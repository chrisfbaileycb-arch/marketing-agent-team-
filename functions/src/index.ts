import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import { db, FieldValue, Timestamp, Proposal, AffiliateProgram, WorkflowTask } from './types';
import { runTask, enqueueTask } from './runner';

const REGION = 'us-central1';
const runtime = { memory: '2GB' as const, timeoutSeconds: 540 };  // 2GB: headless Chromium fallback in the page reader

// ---------------------------------------------------------------------------
// 1. Task runner — fires when the front end (or anything else) adds a task.
// ---------------------------------------------------------------------------
export const executeWorkflowTask = functions
  .region(REGION)
  .runWith(runtime)
  .firestore.document('workflow_tasks/{taskId}')
  .onCreate(async (snap, context) => {
    await runTask(snap.ref, context.params.taskId);
  });

// ---------------------------------------------------------------------------
// 2. Approval trigger — Chris flips a proposal to "approved" on the Approvals
//    page; this decides what happens next. Nothing runs without that flip.
// ---------------------------------------------------------------------------
export const onProposalDecided = functions
  .region(REGION)
  .runWith(runtime)
  .firestore.document('proposals/{proposalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Proposal;
    const after = change.after.data() as Proposal;
    if (before.status === after.status) return;
    const id = context.params.proposalId;

    if (after.status === 'approved' && after.type === 'opportunity') {
      // Chris liked the thesis → run the deep research on that vertical. Read-only, no signups.
      const o = after.data as { vertical: string; region?: string; minCommission?: number; thesis: string };
      await enqueueTask({
        ownerUid: after.ownerUid,
        skill: 'affiliate_research',
        agentId: after.agentId,
        campaignId: after.campaignId,
        input: { vertical: o.vertical, region: o.region || 'United States', minPayout: o.minCommission ?? 250, notes: `Thesis approved by operator: ${o.thesis}` },
      });
      functions.logger.info(`[proposal ${id}] opportunity approved → research queued for "${o.vertical}"`);
      return;
    }

    if (after.status === 'approved' && after.type === 'affiliate_program') {
      const program = after.data as unknown as AffiliateProgram;
      // Approved program → becomes an "offer" the Marketplace and Campaigns pages can use…
      await db.collection('offers').doc(id).set({
        ownerUid: after.ownerUid,
        proposalId: id,
        name: program.programName,
        category: program.vertical,
        payout: program.estimatedPayoutHigh,
        payoutLow: program.estimatedPayoutLow,
        payoutUnit: program.payoutUnit,
        commission: program.commissionStructure,
        epc: null,           // unknown until real data exists — never fabricated
        hot: program.fitScore >= 80,
        imageUrl: '',
        signupUrl: program.signupUrl,
        network: program.network,
        status: 'approved_pending_application',
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // …and the agent drafts the application answers for Chris to paste in himself.
      await enqueueTask({
        ownerUid: after.ownerUid,
        skill: 'application_prep',
        agentId: after.agentId,
        campaignId: after.campaignId,
        input: { program, proposalId: id },
      });
      functions.logger.info(`[proposal ${id}] approved → offer created, application prep queued`);
    }

    if (after.status === 'applied' && after.type === 'affiliate_program') {
      // Chris says he actually submitted the application. Track it; marketing waits for network approval.
      await db.collection('offers').doc(id).set({ status: 'application_submitted', appliedAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    if (after.status === 'approved' && after.type === 'marketing_content') {
      // Push approved content to the connected marketing project, if one was chosen.
      const projectId = after.data.marketingProjectId as string | null | undefined;
      if (!projectId) {
        functions.logger.info(`[proposal ${id}] marketing content approved; no marketing project set, content stays in Firestore`);
        return;
      }
      const projSnap = await db.collection('marketingProjects').doc(projectId).get();
      const proj = projSnap.data();
      if (!proj?.webhookUrl) {
        functions.logger.warn(`[proposal ${id}] marketing project ${projectId} has no webhookUrl; skipping push`);
        return;
      }
      const res = await fetch(proj.webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(proj.apiToken ? { authorization: `Bearer ${proj.apiToken}` } : {}) },
        body: JSON.stringify({ event: 'marketing_content_approved', proposalId: id, content: after.data.content, program: after.data.program }),
      });
      await change.after.ref.update({
        'data.pushedTo': projectId,
        'data.pushStatus': res.status,
        'data.pushedAt': Timestamp.now(),
      });
      functions.logger.info(`[proposal ${id}] pushed to ${proj.platform ?? 'project'} → HTTP ${res.status}`);
    }
  });

// ---------------------------------------------------------------------------
// 3. Nightly run — every agent with schedule === "nightly" gets a research task.
//    Output lands on the Approvals page; nothing else happens until Chris looks.
// ---------------------------------------------------------------------------
export const nightlyRun = functions
  .region(REGION)
  .runWith(runtime)
  .pubsub.schedule(process.env.NIGHTLY_CRON || '0 2 * * *')
  .timeZone(process.env.NIGHTLY_TZ || 'America/Denver')
  .onRun(async () => {
    const owner = process.env.OWNER_UID;
    if (!owner) {
      functions.logger.error('OWNER_UID not set; nightly run skipped');
      return;
    }
    const agents = await db.collection('agents')
      .where('ownerUid', '==', owner)
      .where('schedule', '==', 'nightly')
      .where('status', '==', 'active')
      .get();

    let queued = 0;
    for (const doc of agents.docs) {
      const a = doc.data();
      if (a.mode === 'scout') {
        await enqueueTask({
          ownerUid: owner,
          skill: 'opportunity_scout',
          agentId: doc.id,
          campaignId: a.campaignId || undefined,
          input: { minCommission: a.minPayout ?? 250, region: a.region || 'United States', notes: a.notes || '', channels: a.channels || undefined },
        });
        queued++;
        continue;
      }
      if (!a.vertical) {
        functions.logger.warn(`agent ${doc.id} (${a.name}) is nightly but has no vertical; skipping`);
        continue;
      }
      await enqueueTask({
        ownerUid: owner,
        skill: 'affiliate_research',
        agentId: doc.id,
        campaignId: a.campaignId || undefined,
        input: { vertical: a.vertical, region: a.region || 'United States', minPayout: a.minPayout ?? 100, notes: a.notes || '' },
      });
      queued++;
    }
    await db.collection('runs').add({ ownerUid: owner, kind: 'nightly', queued, at: FieldValue.serverTimestamp() });
    functions.logger.info(`nightly run queued ${queued} research task(s)`);
  });

// ---------------------------------------------------------------------------
// 4. Webhook — the URL the Workflows page hands out. Token-checked, body → task.
//    POST /webhookTrigger?token=…   body: { skill?, ...input }
// ---------------------------------------------------------------------------
export const webhookTrigger = functions
  .region(REGION)
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') { res.status(405).send('POST only'); return; }
    const token = (req.query.token as string) || (req.headers['x-webhook-token'] as string) || '';
    if (!token || token.length < 16) { res.status(401).json({ error: 'missing token' }); return; }

    const hookSnap = await db.collection('incomingWebhooks').where('token', '==', token).limit(1).get();
    if (hookSnap.empty) { res.status(401).json({ error: 'unknown token' }); return; }
    const hookDoc = hookSnap.docs[0];
    const hook = hookDoc.data();
    if (hook.status !== 'active') { res.status(403).json({ error: 'webhook paused' }); return; }

    const body = (typeof req.body === 'object' && req.body) || {};
    const skill = (body.skill as WorkflowTask['skill']) || 'llm_prompt';
    const { skill: _s, ...input } = body;

    const taskId = await enqueueTask({
      ownerUid: hook.ownerUid,
      skill,
      agentId: hook.targetAgentId,
      campaignId: hook.targetCampaignId,
      webhookId: hookDoc.id,
      input,
    });
    await hookDoc.ref.update({ triggerCount: FieldValue.increment(1), lastTriggeredAt: FieldValue.serverTimestamp() });
    res.status(202).json({ ok: true, taskId });
  });

/** Utility exported for the front end's use via callable, so tokens are generated server-side. */
export const createWebhookToken = functions
  .region(REGION)
  .https.onCall(async (_data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in first');
    return { token: crypto.randomBytes(24).toString('base64url') };
  });
