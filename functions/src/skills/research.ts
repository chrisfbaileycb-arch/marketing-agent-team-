import { generateJson } from '../llm';
import { ResearchResultSchema, ResearchResult } from '../types';

export interface ResearchInput {
  vertical: string;          // "residential solar installation"
  region?: string;           // "Colorado, US"
  minPayout?: number;        // ignore programs whose high estimate is below this
  excludePrograms?: string[];// programs already proposed/rejected — don't repeat them
  notes?: string;            // anything Chris typed in
}

const SYSTEM = `You are a research analyst for a one-person affiliate marketing operation.
Your job is to find real, currently-open affiliate or referral programs and report what they actually pay.

Rules:
- Only include programs you can source. Every program needs at least one URL you actually found.
- Report commission structure as published. Do not inflate. If a number is a range, give the range.
- If the payout is per-lead, say so — a "$10,000 commission" and a "$150 per qualified lead" are different businesses.
- Flag compliance requirements: TCPA consent for phone leads, FTC disclosure, geographic limits, prohibited traffic (incentivized, brand bidding, cold email).
- fitScore rewards: high payout, reasonable approval bar for a small operator, clear payment terms, legitimate merchant. Penalize: vague payouts, MLM structures, programs that require a large existing audience.
- Never suggest ways to game, spoof, or automate the merchant's approval process.`;

export async function runResearch(input: ResearchInput): Promise<ResearchResult> {
  const excluded = input.excludePrograms?.length
    ? `\nDo NOT include these programs (already reviewed): ${input.excludePrograms.join('; ')}`
    : '';
  const prompt = `Find the best affiliate / referral programs for:
Vertical: ${input.vertical}
Region: ${input.region || 'United States'}
Minimum acceptable high-end payout: $${input.minPayout ?? 100}
${input.notes ? `Operator notes: ${input.notes}` : ''}${excluded}

Search the web for current programs. Return between 3 and 10 programs, best fit first.
In marketNotes, summarize in 3–5 sentences how this vertical actually pays affiliates and what a realistic month looks like for a small operator.`;

  const { data } = await generateJson(ResearchResultSchema, { system: SYSTEM, prompt, search: true, maxTokens: 12000 });

  // Belt-and-braces: drop anything under the payout floor after the model has had its say.
  const floor = input.minPayout ?? 0;
  data.programs = data.programs.filter((p) => p.estimatedPayoutHigh >= floor);
  if (data.programs.length === 0) throw new Error(`No programs met the $${floor} payout floor for "${input.vertical}"`);
  return data;
}
