import { z } from 'zod';
import { generateJson } from '../llm';

export const OpportunitySchema = z.object({
  thesis: z.string().describe('One sentence. The idea itself, e.g. "Sell GPU servers to colocation buyers in cold-climate states where cooling costs are lower"'),
  vertical: z.string().describe('Search-ready vertical name to hand to the research skill'),
  whyItPays: z.string(),
  payoutModel: z.enum(['per_sale_percent', 'per_sale_flat', 'per_qualified_lead', 'reseller_margin', 'recurring_revshare', 'mixed', 'unknown']),
  typicalTicket: z.string().describe('What the end customer spends, e.g. "$8k–$40k per server"'),
  estimatedCommissionLow: z.number().nonnegative(),
  estimatedCommissionHigh: z.number().nonnegative(),
  salesCycle: z.string().describe('How long from first touch to paid commission, honestly'),
  channelFit: z.array(z.string()).describe('Which of the operator\'s channels this works on and why'),
  anchorPrograms: z.array(z.object({ name: z.string(), url: z.string().url().or(z.literal('')), note: z.string() })).max(4),
  sourced: z.array(z.string()).describe('Claims you actually found on the web, each with the URL'),
  hypothesis: z.array(z.string()).describe('Claims that are your reasoning, NOT found on a page. Be honest here.'),
  risks: z.array(z.string()).describe('Regulatory, approval-bar, saturation, fraud-adjacent traps'),
  noveltyScore: z.number().min(0).max(100).describe('How unlikely a solo operator is to have thought of this'),
  fitScore: z.number().min(0).max(100),
  tier: z.enum(['bounty', 'mid_ticket', 'high_ticket']).describe('bounty: $100–$1k, short cycle, often B2B SaaS/fintech referral programs; mid_ticket: $1k–$5k; high_ticket: $5k+'),
  stacksWithClientBase: z.boolean().describe('True if this is something the operator would naturally recommend to a marketing client (bookkeeping, payroll, CRM, phones) and get paid for'),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

export const ScoutResultSchema = z.object({
  constraintsUnderstood: z.string(),
  opportunities: z.array(OpportunitySchema).min(3).max(10),
  passedOn: z.array(z.string()).describe('Categories you considered and rejected, with one-line reasons — so the operator can override you'),
});
export type ScoutResult = z.infer<typeof ScoutResultSchema>;

export interface ScoutInput {
  minCommission?: number;            // per closed deal / lead, USD
  channels?: string[];               // what the operator can actually run
  region?: string;
  exclude?: string[];                // verticals / theses already seen
  avoid?: string[];                  // e.g. ['MLM', 'crypto', 'supplements']
  notes?: string;
}

const SYSTEM = `You are a market scout for a one-person affiliate / commission-sales operation.
Your job is NOT to research a category the operator already named. It is to find high-payout commission opportunities the operator would not think to search for, then hand each one off as a named vertical.

How to think:
- Return a deliberate MIX across three tiers, not just the biggest number:
    bounty ($100–$1k, 30-day cycle): B2B SaaS and fintech referral/partner programs — accounting, payroll, CRM, legal practice management, VoIP, e-signature, merchant services, business banking. These stack: the operator runs marketing for small professional firms and is already the one recommending tools.
    mid_ticket ($1k–$5k): high-ticket home services leads, commercial insurance, equipment financing referrals, franchise referrals.
    high_ticket ($5k+): B2B equipment, infrastructure, energy, industrial software, fleet, medical/dental equipment.
- Partner bounties change quarterly and often differ from the public affiliate program of the same company. Say which program you found and when its terms were published.
- Look for asymmetries: a regional cost advantage, a regulatory change, a supply shift, a demographic. State the asymmetry as the thesis.
- For every opportunity, separate what you FOUND (a program page, a payout table, a news item — with URL) from what you REASONED. Put reasoning in "hypothesis". A solo operator will act on this; do not dress up a guess as a fact.
- Be precise about payout model. "$10,000 commission" and "$10,000 sale with 3% referral fee" and "$10,000 sale that pays $200 per qualified lead" are three different businesses. Say which.
- Be honest about sales cycle. High-ticket B2B often means 60–180 days and a partner-program registration with business paperwork.
- Reject: MLM/network marketing, anything requiring the operator to buy inventory, "guaranteed income" schemes, programs whose payout you cannot find at all, anything the operator listed under avoid.
- noveltyScore is about the operator, not the world: would a small marketer who defaults to "solar" and "software" have thought of this?`;

export async function runScout(input: ScoutInput): Promise<ScoutResult> {
  const prompt = `Operator constraints:
- Minimum commission worth their time: $${input.minCommission ?? 250} per closed deal, signup, or qualified lead
- Their current customers are small professional-services firms (e.g. personal-injury law practices) that they market for on retainer — bounties those firms would plausibly sign up for count as a strong fit
- Channels they can run: ${(input.channels || ['short-form video (TikTok/Reels/Shorts)', 'targeted paid social', 'email', 'landing pages']).join('; ')}
- Region: ${input.region || 'United States'}
- Avoid: ${(input.avoid || ['MLM', 'inventory purchase required', 'crypto', 'gambling']).join('; ')}
${input.exclude?.length ? `- Already reviewed, do not repeat: ${input.exclude.join('; ')}` : ''}
${input.notes ? `- Notes: ${input.notes}` : ''}

Search the web broadly. Come back with 3–10 opportunities the operator would not have found on their own, best first.
For each, "vertical" must be a phrase the operator can hand to a follow-up researcher, e.g. "GPU colocation and server hardware partner programs".`;

  const { data } = await generateJson(ScoutResultSchema, { system: SYSTEM, prompt, search: true, maxTokens: 14000 });
  const floor = input.minCommission ?? 250;
  data.opportunities = data.opportunities
    .filter((o) => o.estimatedCommissionHigh >= floor)
    .sort((a, b) => (b.fitScore + b.noveltyScore) - (a.fitScore + a.noveltyScore));
  if (data.opportunities.length === 0) throw new Error(`Scout found nothing above the $${floor} commission floor`);
  return data;
}
