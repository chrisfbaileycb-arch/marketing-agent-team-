import * as functions from 'firebase-functions';
import {
  db, FieldValue, Timestamp,
  WorkflowTask, Proposal, AffiliateProgram, AffiliateProgramSchema,
} from './types';
import { runResearch, ResearchInput } from './skills/research';
import { runApplicationPrep, applicantProfileFromEnv } from './skills/applicationPrep';
import { runMarketing } from './skills/marketing';
import { runLlmPrompt, LlmPromptInput } from './skills/llmPrompt';
import { runScout, ScoutInput } from './skills/scout';

const MAX_ATTEMPTS = 2;

type TaskRef = FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;

class TaskContext {
  constructor(readonly ref: TaskRef, readonly id: string, readonly task: WorkflowTask) {}

  async step(progress: number, message: string, type: 'info' | 'success' | 'warning' = 'info') {
    functions.logger.info(`[task ${this.id}] ${message}`);
    await this.ref.update({
      progress,
      currentStep: message,
      logs: FieldValue.arrayUnion({ timestamp: Timestamp.now(), message, type }),
    });
  }
}

/** Sanity checks that don't need a model. */
function validateTask(task: WorkflowTask) {
  const owner = process.env.OWNER_UID;
  if (owner && task.ownerUid !== owner) {
    throw new Error(`Task owner ${task.ownerUid} is not the configured OWNER_UID. Refusing to run.`);
  }
  if (!task.skill) throw new Error('Task has no skill.');
  if (task.input == null || typeof task.input !== 'object') throw new Error('Task input must be an object.');
}

async function alreadyProposedTitles(ownerUid: string, type: Proposal['type']): Promise<string[]> {
  const snap = await db.collection('proposals').where('ownerUid', '==', ownerUid).where('type', '==', type).limit(200).get();
  return snap.docs.map((d) => (d.data() as Proposal).title);
}

async function alreadyProposedPrograms(ownerUid: string): Promise<string[]> {
  const snap = await db.collection('proposals')
    .where('ownerUid', '==', ownerUid)
    .where('type', '==', 'affiliate_program')
    .limit(200)
    .get();
  return snap.docs.map((d) => (d.data() as Proposal).title);
}

async function createProposal(ctx: TaskContext, p: Omit<Proposal, 'ownerUid' | 'taskId' | 'createdAt' | 'status'>) {
  if (ctx.task.dryRun) {
    await ctx.step(ctx.task.progress, `[dry run] would create proposal: ${p.title}`, 'warning');
    return null;
  }
  const doc: Proposal = {
    ...p,
    ownerUid: ctx.task.ownerUid,
    taskId: ctx.id,
    status: 'awaiting_approval',
    createdAt: Timestamp.now(),
  };
  const ref = await db.collection('proposals').add(doc);
  return ref.id;
}

// ---------------------------------------------------------------------------

async function executeSkill(ctx: TaskContext): Promise<{ result: unknown; awaitingApproval: boolean }> {
  const { task } = ctx;

  switch (task.skill) {
    case 'opportunity_scout': {
      const input = task.input as unknown as ScoutInput;
      await ctx.step(20, 'Scanning the market for high-ticket commission opportunities…');
      const exclude = [...(input.exclude || []), ...(await alreadyProposedTitles(task.ownerUid, 'opportunity'))];
      const scan = await runScout({ ...input, exclude });
      await ctx.step(70, `${scan.opportunities.length} opportunit${scan.opportunities.length === 1 ? 'y' : 'ies'} found. Writing them up…`, 'success');
      const ids: string[] = [];
      for (const o of scan.opportunities) {
        const id = await createProposal(ctx, {
          type: 'opportunity',
          agentId: task.agentId,
          campaignId: task.campaignId,
          title: o.thesis,
          summary: `${o.vertical} — $${Math.round(o.estimatedCommissionLow).toLocaleString()}–$${Math.round(o.estimatedCommissionHigh).toLocaleString()} ${o.payoutModel.replace(/_/g, ' ')} · novelty ${o.noveltyScore} · fit ${o.fitScore}`,
          data: { ...o, region: input.region || 'United States', minCommission: input.minCommission ?? 1000 },
        });
        if (id) ids.push(id);
      }
      return { result: { proposalIds: ids, count: scan.opportunities.length, passedOn: scan.passedOn, constraintsUnderstood: scan.constraintsUnderstood }, awaitingApproval: ids.length > 0 };
    }

    case 'affiliate_research': {
      const input = task.input as unknown as ResearchInput;
      if (!input.vertical) throw new Error('affiliate_research needs input.vertical');
      await ctx.step(20, `Researching ${input.vertical} programs in ${input.region || 'the US'}…`);
      const exclude = [...(input.excludePrograms || []), ...(await alreadyProposedPrograms(task.ownerUid))];
      const research = await runResearch({ ...input, excludePrograms: exclude }, (m) => ctx.step(45, m));
      await ctx.step(70, `Found ${research.programs.length} programs. Writing them up for your review…`, 'success');

      const ids: string[] = [];
      for (const program of research.programs) {
        const id = await createProposal(ctx, {
          type: 'affiliate_program',
          agentId: task.agentId,
          campaignId: task.campaignId,
          title: program.programName,
          summary: `${program.merchant} via ${program.network} — ${program.commissionStructure} (fit ${program.fitScore}/100)`,
          data: program,
        });
        if (id) ids.push(id);
      }
      return { result: { proposalIds: ids, marketNotes: research.marketNotes, count: research.programs.length }, awaitingApproval: ids.length > 0 };
    }

    case 'application_prep': {
      const program = AffiliateProgramSchema.parse(task.input.program);
      await ctx.step(30, `Drafting application answers for ${program.programName}…`);
      const prep = await runApplicationPrep(program, applicantProfileFromEnv());
      await ctx.step(80, 'Application draft ready.', 'success');
      // Attach the draft to the originating proposal so the Approvals screen shows it inline.
      const proposalId = task.input.proposalId as string | undefined;
      if (proposalId && !task.dryRun) {
        await db.collection('proposals').doc(proposalId).update({
          'data.application': prep,
          'data.applicationTaskId': ctx.id,
        });
      }
      return { result: prep, awaitingApproval: false };
    }

    case 'marketing_content': {
      const program = AffiliateProgramSchema.parse(task.input.program) as AffiliateProgram;
      await ctx.step(30, `Writing campaign content for ${program.programName}…`);
      const content = await runMarketing({
        program,
        audience: task.input.audience as string | undefined,
        channels: task.input.channels as string[] | undefined,
        tone: task.input.tone as string | undefined,
      });
      await ctx.step(80, 'Content drafted. Queued for your review before anything is published.', 'success');
      const id = await createProposal(ctx, {
        type: 'marketing_content',
        agentId: task.agentId,
        campaignId: task.campaignId,
        title: `Campaign content: ${program.programName}`,
        summary: content.angle,
        data: { program, content, marketingProjectId: task.input.marketingProjectId ?? null },
      });
      return { result: { proposalId: id }, awaitingApproval: !!id };
    }

    case 'llm_prompt': {
      const input = task.input as unknown as LlmPromptInput;
      if (!input.prompt) throw new Error('llm_prompt needs input.prompt');
      await ctx.step(30, 'Running prompt…');
      const out = await runLlmPrompt(input);
      await ctx.step(90, `Done (${out.provider}/${out.model}).`, 'success');
      return { result: out, awaitingApproval: false };
    }

    default:
      throw new Error(`Unknown skill "${String(task.skill)}"`);
  }
}

// ---------------------------------------------------------------------------

export async function runTask(ref: TaskRef, id: string) {
  const snap = await ref.get();
  const task = snap.data() as WorkflowTask | undefined;
  if (!task) return;
  if (task.status !== 'pending') {
    functions.logger.info(`[task ${id}] status is ${task.status}; skipping`);
    return;
  }

  const attempts = (task.attempts ?? 0) + 1;
  await ref.update({ status: 'executing', attempts, progress: 5, startedAt: FieldValue.serverTimestamp() });
  const ctx = new TaskContext(ref, id, { ...task, attempts });

  try {
    validateTask(task);
    await ctx.step(10, task.dryRun ? 'Dry run — nothing will be written except this log.' : 'Checks passed.');
    const { result, awaitingApproval } = await executeSkill(ctx);
    await ref.update({
      status: awaitingApproval ? 'awaiting_approval' : 'completed',
      progress: 100,
      currentStep: awaitingApproval ? 'Waiting for your approval on the Approvals page.' : 'Completed.',
      result,
      commissionGenerated: 0,
      completedAt: FieldValue.serverTimestamp(),
      logs: FieldValue.arrayUnion({
        timestamp: Timestamp.now(),
        message: awaitingApproval ? 'Proposals created — review them on the Approvals page.' : 'Task completed.',
        type: 'success',
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    functions.logger.error(`[task ${id}] attempt ${attempts} failed: ${message}`);
    const retry = attempts < MAX_ATTEMPTS && !/OWNER_UID|Unknown skill|needs input/.test(message);
    await ref.update({
      status: retry ? 'pending' : 'failed',
      error: message,
      currentStep: retry ? `Attempt ${attempts} failed, retrying…` : 'Failed.',
      logs: FieldValue.arrayUnion({ timestamp: Timestamp.now(), message, type: 'error' }),
      ...(retry ? {} : { failedAt: FieldValue.serverTimestamp() }),
    });
    if (retry) await runTask(ref, id);
  }
}

/** Enqueue a task. Used by the scheduler, the webhook, and the approval trigger. */
export async function enqueueTask(task: Omit<WorkflowTask, 'status' | 'progress' | 'createdAt'>) {
  const ref = await db.collection('workflow_tasks').add({
    ...task,
    status: 'pending',
    progress: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
