import * as admin from 'firebase-admin';
import { z } from 'zod';

if (admin.apps.length === 0) admin.initializeApp();
export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

/** Skill names the runner knows how to execute. */
export type SkillName = 'opportunity_scout' | 'affiliate_research' | 'application_prep' | 'marketing_content' | 'llm_prompt';

export type TaskStatus = 'pending' | 'executing' | 'awaiting_approval' | 'completed' | 'failed';

export interface TaskLog {
  timestamp: admin.firestore.Timestamp;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

/** A document in `workflow_tasks`. The front end creates these; the runner consumes them. */
export interface WorkflowTask {
  ownerUid: string;
  skill: SkillName;
  agentId?: string;
  campaignId?: string;
  webhookId?: string;
  input: Record<string, unknown>;
  dryRun?: boolean;
  status: TaskStatus;
  progress: number;
  currentStep?: string;
  attempts?: number;
  logs?: TaskLog[];
  result?: unknown;
  error?: string;
  createdAt: admin.firestore.Timestamp | Date;
  completedAt?: admin.firestore.Timestamp;
  failedAt?: admin.firestore.Timestamp;
  /** Kept for the legacy Workflows page; always 0 — commissions are logged manually. */
  commissionGenerated?: number;
}

/** A document in `proposals` — anything the agent wants Chris to approve before it goes further. */
export type ProposalType = 'opportunity' | 'affiliate_program' | 'marketing_content';
export type ProposalStatus = 'awaiting_approval' | 'approved' | 'rejected' | 'applied';

export interface Proposal {
  ownerUid: string;
  type: ProposalType;
  status: ProposalStatus;
  taskId: string;
  agentId?: string;
  campaignId?: string;
  title: string;
  summary: string;
  data: Record<string, unknown>;
  createdAt: admin.firestore.Timestamp;
  decidedAt?: admin.firestore.Timestamp;
  /** Written by the front end when Chris actually submits the application himself. */
  appliedAt?: admin.firestore.Timestamp;
}

// ---------------------------------------------------------------------------
// Structured outputs the LLM must return. Validated with zod before we trust them.
// ---------------------------------------------------------------------------

export const AffiliateProgramSchema = z.object({
  programName: z.string(),
  merchant: z.string(),
  network: z.string().describe('e.g. Impact, CJ, ShareASale, PartnerStack, in-house'),
  vertical: z.string(),
  signupUrl: z.string().url().or(z.literal('')),
  commissionStructure: z.string().describe('Plain-English: "$150 per qualified lead", "8% of sale", etc.'),
  estimatedPayoutLow: z.number().nonnegative(),
  estimatedPayoutHigh: z.number().nonnegative(),
  payoutUnit: z.enum(['per_lead', 'per_sale', 'per_install', 'percent_of_sale', 'unknown']),
  cookieWindowDays: z.number().int().nonnegative().nullable(),
  approvalRequirements: z.array(z.string()),
  paymentTerms: z.string(),
  complianceNotes: z.array(z.string()).describe('TCPA, FTC disclosure, geo limits, prohibited traffic types'),
  fitScore: z.number().min(0).max(100),
  fitRationale: z.string(),
  sources: z.array(z.string().url()),
});
export type AffiliateProgram = z.infer<typeof AffiliateProgramSchema>;

export const ResearchResultSchema = z.object({
  vertical: z.string(),
  region: z.string(),
  programs: z.array(AffiliateProgramSchema).min(1).max(12),
  marketNotes: z.string(),
});
export type ResearchResult = z.infer<typeof ResearchResultSchema>;

export const ApplicationPrepSchema = z.object({
  programName: z.string(),
  answers: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
  promotionPlan: z.string(),
  redFlagsToAvoid: z.array(z.string()),
  checklistBeforeApplying: z.array(z.string()),
});
export type ApplicationPrep = z.infer<typeof ApplicationPrepSchema>;

export const MarketingContentSchema = z.object({
  programName: z.string(),
  angle: z.string(),
  landingPage: z.object({
    headline: z.string(),
    subheadline: z.string(),
    body: z.string(),
    cta: z.string(),
    requiredDisclosure: z.string(),
  }),
  emailSequence: z.array(
    z.object({ dayOffset: z.number().int().nonnegative(), subject: z.string(), body: z.string() }),
  ),
  socialPosts: z.array(z.object({ platform: z.string(), text: z.string() })),
  consentLanguage: z.string().describe('TCPA-compliant consent text for any lead form'),
});
export type MarketingContent = z.infer<typeof MarketingContentSchema>;
