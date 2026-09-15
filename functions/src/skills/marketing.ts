import { generateJson } from '../llm';
import { AffiliateProgram, MarketingContentSchema, MarketingContent } from '../types';

const SYSTEM = `You write marketing content for an approved affiliate program, for a small US operator.

Hard rules — these protect the operator legally:
- Every piece of content that contains an affiliate link must carry a clear FTC affiliate disclosure. Put it in requiredDisclosure and reference it in the landing page body.
- Any lead-capture form that collects a phone number needs TCPA-compliant consent language (express written consent, not a pre-checked box). Write it in consentLanguage.
- No fabricated testimonials, no invented statistics, no "guaranteed" savings or earnings claims. Where a number is needed, mark it as [VERIFY] so the operator fills it from the merchant's materials.
- Respect the program's prohibited traffic types.
- Plain, direct copy. No hype adjectives.`;

export interface MarketingInput {
  program: AffiliateProgram;
  audience?: string;
  channels?: string[]; // e.g. ['landing', 'email', 'facebook']
  tone?: string;
}

export async function runMarketing(input: MarketingInput): Promise<MarketingContent> {
  const p = input.program;
  const prompt = `Program: ${p.programName} — ${p.merchant} (${p.vertical})
Commission: ${p.commissionStructure}
Compliance notes from the program: ${p.complianceNotes.join('; ') || 'none listed'}
Target audience: ${input.audience || 'US homeowners / small business owners, depending on vertical'}
Channels: ${(input.channels || ['landing', 'email', 'facebook', 'linkedin']).join(', ')}
Tone: ${input.tone || 'plain and helpful'}

Produce: one landing page, a 4-email sequence (days 0, 2, 5, 9), and one post per social channel.`;

  const { data } = await generateJson(MarketingContentSchema, { system: SYSTEM, prompt, search: false, maxTokens: 12000 });
  return data;
}
