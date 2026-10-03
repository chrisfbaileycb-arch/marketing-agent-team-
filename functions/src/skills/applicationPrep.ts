import { generateJson } from '../llm';
import { AffiliateProgram, ApplicationPrepSchema, ApplicationPrep } from '../types';

const SYSTEM = `You help a small, owner-operated marketing business apply to affiliate programs.
You draft the answers the operator will paste into the application form HIMSELF. You never submit anything.

Rules:
- Only claim what the operator's profile supports. If the profile says "small email list", do not write "large audience". Networks verify and ban for misrepresentation.
- Be specific about promotion channels and honest about scale.
- Include a pre-apply checklist: what documents (W-9 / tax ID, payout method), what site pages must exist (privacy policy, affiliate disclosure), and any traffic proof they'll ask for.
- Red flags list = things the operator must NOT do with this program per its terms (brand bidding, incentivized traffic, cold outreach, etc.).`;

export interface ApplicantProfile {
  name: string;
  website: string;
  trafficSummary: string;
}

export function applicantProfileFromEnv(): ApplicantProfile {
  return {
    name: process.env.APPLICANT_NAME || '(name not set — fill APPLICANT_NAME in functions/.env)',
    website: process.env.APPLICANT_WEBSITE || '(website not set)',
    trafficSummary: process.env.APPLICANT_TRAFFIC_SUMMARY || 'Small owner-operated marketing platform.',
  };
}

export async function runApplicationPrep(program: AffiliateProgram, profile: ApplicantProfile): Promise<ApplicationPrep> {
  const prompt = `Program: ${program.programName} (${program.merchant} via ${program.network})
Signup URL: ${program.signupUrl || 'unknown'}
Commission: ${program.commissionStructure}
Approval requirements: ${program.approvalRequirements.join('; ') || 'not listed'}
Compliance notes: ${program.complianceNotes.join('; ') || 'none listed'}

Applicant profile (this is the truth — do not embellish):
Name: ${profile.name}
Website: ${profile.website}
Traffic / audience: ${profile.trafficSummary}

Draft the application. Anticipate the standard questions (how will you promote us, describe your audience, website URL, traffic sources, why this program) and any program-specific ones implied by the approval requirements.`;

  const { data } = await generateJson(ApplicationPrepSchema, { system: SYSTEM, prompt, search: false });
  return data;
}
