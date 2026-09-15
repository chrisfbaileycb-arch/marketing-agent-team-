# Money-Making Team

A personal agent-orchestration tool for affiliate marketing. Agents research affiliate programs overnight, draft the applications, and write the campaign content; every step lands in an approval queue and waits for you.

First built in Google Colab. The agents do research and drafting; you make every decision that touches money, a signup form, or a publish button.

## How it works

```
Agents page            two kinds of agent, both can run nightly:
                         scout    — "find high-ticket things I haven't thought of"
                         vertical — "research this category I named"
      │
      ▼  every night at 02:00 America/Denver  (or "Run" on the Workflows page)
nightlyRun ──► workflow_tasks   skill: opportunity_scout   (scout agents)
                                skill: affiliate_research  (vertical agents)
      │
      ▼  executeWorkflowTask
Scout skill            model + web search across B2B equipment, infrastructure, energy,
                       regulated referral fees, high-ticket services… → 3–10 theses, each
                       split into "found on the web" vs "the agent's reasoning", with
                       payout model, ticket size, sales cycle, risks, novelty + fit scores
      │
      ▼
proposals type: opportunity   ◄── Approvals: "Worth it — find the real programs"
      │
      │  you approve a thesis → its vertical becomes a research task
      ▼
Research skill         pass 1: model + web search → 3–10 candidate programs
                       pass 2: fetch each program's real page (HTTP, headless Chromium
                       if JS-rendered), re-extract payout / cookie / rules from the text,
                       re-score. Unreadable pages cap the fit score at 40.
      │
      ▼
proposals/{id}         status: awaiting_approval          ◄── Approvals page
      │
      │  you click "Approve and draft application"
      ▼
onProposalDecided ──► offers/{id} created  +  workflow_tasks  skill: application_prep
      │
      ▼
Application prep       drafts every answer the network's form will ask, plus a
                       pre-apply checklist and a "don't do this" list — attached to the proposal
      │
      │  you open the signup page, paste the answers, submit, click "I submitted the application"
      ▼
proposals status: applied
      │
      │  once the network approves you: Workflows → run marketing_content for that program
      ▼
Marketing skill        landing page, 4-email sequence, social posts, FTC disclosure,
                       TCPA consent text → proposals (awaiting_approval)
      │
      │  you approve
      ▼
onProposalDecided ──► POST to the connected marketing project's webhookUrl
```

The page reader only reads public pages — it never logs in to a network directory or submits a form. Nothing is submitted to a third party by the agent. The two actions that legally have to be you — signing up with a network, and publishing content — stay with you. The agent removes the 90% around them.

### Skills

| Skill | Input | Output |
|---|---|---|
| `opportunity_scout` | `minCommission`, `channels`, `region`, `avoid`, `notes` | one `proposals` doc per thesis |
| `affiliate_research` | `vertical`, `region`, `minPayout`, `notes` | one `proposals` doc per program |
| `application_prep` | `program`, `proposalId` | drafted answers attached to that proposal |
| `marketing_content` | `program`, `audience`, `channels`, `marketingProjectId` | one `proposals` doc with the content |
| `llm_prompt` | `prompt`, `system`, `variables`, `search` | text result on the task |

Any skill can be queued from the Workflows page, the nightly scheduler, or the webhook endpoint (`POST /webhookTrigger?token=…` with `{ "skill": "...", ...input }`). Set `dryRun: true` on a task (or turn "Write results" off on Workflows) to log what would happen without creating proposals.

### Routes

| Path | Screen |
|---|---|
| `/` | Home — overview |
| `/agents` | Agents — vertical, region, payout floor, nightly schedule |
| `/campaigns` | Campaigns |
| `/workflows` | Run a research task now; incoming webhooks; connected marketing projects |
| `/approvals` | **The queue.** Everything the agents found, waiting for you |
| `/marketplace` | Approved programs (populated by approvals, not seed data) |
| `/skills`, `/https-layers` | Existing screens, unchanged |

## Tech stack

**Front end:** React 19, TypeScript 5.8, Vite 7, Tailwind CSS 3, Radix UI Themes, Framer Motion, Recharts, React Router v6, Firebase JS SDK (Auth + Firestore).

**Backend:** Firebase Cloud Functions (Node 20, 2 GB), Firestore, a page reader (fetch → `playwright-core` + `@sparticuz/chromium` fallback, read-only: no clicks, no logins), and a pluggable model layer — Anthropic Claude by default (web search tool) or Gemini (`LLM_PROVIDER=gemini`, Google Search grounding). Structured outputs are validated with zod before anything is written.

## Setup

### 1. Firebase project

1. Create a project; enable **Authentication → Google**, **Firestore**, and **Functions** (Blaze plan is required for outbound model API calls).
2. `.firebaserc` — set `projects.default`.
3. `src/firebase.ts` — paste the web-app config from the console. (Not a secret; access is governed by the rules below.)
4. Run the app once, sign in with Google, and read your UID from the hover title on your email in the header (or the Auth console).
5. `firestore.rules` — replace `"OWNER_UID"` with that UID (or run `bash scripts/setup-uid.sh YOUR_UID`). Every collection is denied to anyone else.

### 2. Functions

```bash
cd functions
cp .env.example .env      # fill in: ANTHROPIC_API_KEY, OWNER_UID, APPLICANT_*  (or GEMINI_API_KEY if you prefer Gemini)
npm install
npm run dryrun -- scout 1000 "United States"                        # open-ended scout, local, no Firebase
npm run dryrun -- "residential solar installation" "Colorado, US"   # research one vertical
```

`APPLICANT_NAME / WEBSITE / TRAFFIC_SUMMARY` are what the application-prep skill is allowed to say about you. Keep them true — networks check.

### 3. Deploy

```bash
npm install && npm run build          # front end → dist/
firebase deploy                       # rules, indexes, functions, hosting
```

Local emulators: `cd functions && npm run serve`.

## Data model

All documents carry `ownerUid`. Collections: `agents`, `campaigns`, `offers`, `proposals`, `workflow_tasks`, `incomingWebhooks`, `marketingProjects`, `affiliateSales`, `adSpendRequests`, `httpsLayers`, `certificates`, `runs`, `users/{uid}`.

Revenue: `affiliateSales` is manual entry from your network dashboards. Nothing in the system generates a dollar figure on its own — `commissionGenerated` on tasks is always `0` and exists only for the legacy Workflows log.

## Known gaps

- `marketingProjects.apiToken` is stored in Firestore (owner-only). Fine for one operator; move to Secret Manager if this is ever shared.
- Affiliate-network revenue APIs (Impact, CJ, ShareASale) are not wired. The `offers` doc has the fields for it.
- `Skills` and `HTTPS Layers` pages are UI-only; the layer/cert records persist but nothing enforces them.

## Project layout

```
.
├── App.tsx                 root component, router, providers
├── index.tsx / index.html  Vite entry
├── src/
│   ├── components/         Layout, UploadZone, AccountIndicator
│   ├── context/            AppContext.tsx
│   ├── pages/              one file per route
│   └── firebase.ts
├── functions/
│   ├── src/index.ts        executeWorkflowTask, onProposalDecided, nightlyRun, webhookTrigger
│   ├── src/runner.ts       task lifecycle, retries, proposal creation
│   ├── src/llm.ts          Gemini / Anthropic, JSON + zod validation
│   ├── src/fetchPage.ts    read a public page as text; browser only when needed
│   ├── src/skills/         scout, research (two-pass), applicationPrep, marketing, llmPrompt
│   ├── src/cli.ts          `npm run dryrun` local harness
│   └── .env.example
├── firestore.rules         owner-only access
├── firestore.indexes.json
├── public/
├── scripts/init-git.sh     clone + setup reference
├── scripts/setup-uid.sh    one-time: patches firestore.rules with your Firebase UID
├── firebase.json
└── .firebaserc
```

## License

Not yet specified.
