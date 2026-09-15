import { generateJson } from '../llm';
import { ResearchResultSchema, ResearchResult, AffiliateProgramSchema, AffiliateProgram } from '../types';
import { fetchPageText, PageText } from '../fetchPage';
import * as functions from 'firebase-functions';

export interface ResearchInput {
  vertical: string;          // "residential solar installation"
  region?: string;           // "Colorado, US"
  minPayout?: number;        // ignore programs whose high estimate is below this
  excludePrograms?: string[];// programs already proposed/rejected — don't repeat them
  notes?: string;            // anything Chris typed in
  deepRead?: boolean;        // pass 2: fetch each program's page and re-extract from real text (default true)
  maxDeepReads?: number;     // cap on pages fetched per run (default 8)
}

export type ProgressFn = (message: string) => Promise<void> | void;

const SYSTEM = `You are a research analyst for a one-person affiliate marketing operation.
Your job is to find real, currently-open affiliate or referral programs and report what they actually pay.

Rules:
- Only include programs you can source. Every program needs at least one URL you actually found.
- Report commission structure as published. Do not inflate. If a number is a range, give the range.
- If the payout is per-lead, say so — a "$10,000 commission" and a "$150 per qualified lead" are different businesses.
- Flag compliance requirements: TCPA consent for phone leads, FTC disclosure, geographic limits, prohibited traffic (incentivized, brand bidding, cold email).
- fitScore rewards: high payout, reasonable approval bar for a small operator, clear payment terms, legitimate merchant. Penalize: vague payouts, MLM structures, programs that require a large existing audience.
- Never suggest ways to game, spoof, or automate the merchant's approval process.
- Prefer the merchant's own affiliate/partner page or the program's terms page as signupUrl. Network directories that require login are not useful as sources.`;

const VERIFY_SYSTEM = `You are verifying one affiliate program against the actual text of its web page(s).
Update every field from what the page says. If the page contradicts the draft, the page wins.
If the page does not state something, keep the draft value but lower fitScore and say so in fitRationale.
If the page shows the program is closed, invite-only, or not an affiliate program at all, set fitScore to 0 and explain.
sources must list only the URLs whose text you were given.`;

// ---------------------------------------------------------------------------

async function pass1(input: ResearchInput): Promise<ResearchResult> {
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
  return data;
}

function candidateUrls(p: AffiliateProgram): string[] {
  const urls = [p.signupUrl, ...p.sources].filter((u): u is string => !!u && /^https?:\/\//.test(u));
  // dedupe, drop obvious login-walled network directories
  const seen = new Set<string>();
  return urls.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return !/(app\.impact\.com|members\.cj\.com|account\.shareasale\.com|login|signin)/i.test(u);
  }).slice(0, 2);
}

async function pass2(program: AffiliateProgram, pages: PageText[]): Promise<AffiliateProgram> {
  const readable = pages.filter((p) => p.text.length > 200);
  if (readable.length === 0) {
    return { ...program, fitScore: Math.min(program.fitScore, 40), fitRationale: `${program.fitRationale} [Unverified: could not read the program page.]` };
  }
  const pageBlock = readable.map((p) => `--- ${p.finalUrl} (${p.title || 'untitled'}, read via ${p.via}) ---\n${p.text}`).join('\n\n');
  const prompt = `Draft program record:\n${JSON.stringify(program, null, 2)}\n\nPage text:\n${pageBlock}\n\nReturn the corrected program record.`;
  const { data } = await generateJson(AffiliateProgramSchema, { system: VERIFY_SYSTEM, prompt, search: false, maxTokens: 6000 });
  data.sources = readable.map((p) => p.finalUrl);
  return data;
}

// ---------------------------------------------------------------------------

export async function runResearch(input: ResearchInput, progress: ProgressFn = () => {}): Promise<ResearchResult> {
  const data = await pass1(input);
  await progress(`Pass 1: ${data.programs.length} candidate program(s) found.`);

  if (input.deepRead !== false) {
    const cap = input.maxDeepReads ?? 8;
    const verified: AffiliateProgram[] = [];
    let reads = 0;
    for (const program of data.programs) {
      if (reads >= cap) { verified.push(program); continue; }
      const urls = candidateUrls(program);
      if (urls.length === 0) { verified.push(program); continue; }
      await progress(`Reading ${program.programName}: ${urls[0]}`);
      const pages: PageText[] = [];
      for (const u of urls) {
        reads++;
        try { pages.push(await fetchPageText(u)); }
        catch (e) { functions.logger.warn(`[research] fetch failed ${u}: ${e instanceof Error ? e.message : e}`); }
      }
      try {
        verified.push(await pass2(program, pages));
      } catch (e) {
        functions.logger.warn(`[research] verify failed for ${program.programName}: ${e instanceof Error ? e.message : e}`);
        verified.push(program);
      }
    }
    data.programs = verified.sort((a, b) => b.fitScore - a.fitScore);
    await progress(`Pass 2: verified against ${reads} page(s).`);
  }

  const floor = input.minPayout ?? 0;
  data.programs = data.programs.filter((p) => p.estimatedPayoutHigh >= floor && p.fitScore > 0);
  if (data.programs.length === 0) throw new Error(`No programs met the $${floor} payout floor for "${input.vertical}" after verification`);
  return data;
}
