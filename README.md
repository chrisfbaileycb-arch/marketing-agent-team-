# Money-Making Team

An agent-orchestration dashboard for affiliate-marketing workflows. The React front end lets you define agents, campaigns, workflows, skills and HTTPS access layers; a Firebase Cloud Function picks up queued workflow tasks from Firestore and runs them through a Playwright browser session.

First built in Google Colab. This is an early prototype: the UI is complete, the backend launches a real browser session, but the "skill" branches are stubbed and the commission figures it writes back are simulated (see [Current status](#current-status)).

## Architecture

```
Browser (React + Vite)
  └─ src/pages/*          route-level screens
  └─ src/context/         AppContext — in-app state for agents, campaigns, workflows, layers
  └─ src/firebase.ts      Firebase Auth + Firestore client (config is a placeholder)
        │
        ▼  writes a document to  workflow_tasks/{taskId}
Firestore
        │
        ▼  onCreate trigger
functions/src/index.ts    executeWorkflowTask
  ├─ performSafetyCheck   requires targetAgentId + targetCampaignId
  ├─ chromium.launch      Playwright, 2 GB / 300 s
  ├─ executeSkillAction   routes on the skill name, navigates to targetUrl
  └─ writes status / progress / commissionGenerated back to the task doc
```

### Routes

| Path | Screen |
|---|---|
| `/` | Home — overview dashboard |
| `/campaigns` | Campaign management |
| `/agents` | Agent roster |
| `/workflows` | Workflow builder, project connections, webhook triggers |
| `/marketplace` | Skill / agent discovery |
| `/skills` | Skill definitions |
| `/https-layers` | Proxy / access-layer configuration (API-key gating per surface) |

## Tech stack

**Front end:** React 19, TypeScript 5.8, Vite 7, Tailwind CSS 3, Radix UI Themes, Framer Motion, Recharts, React Router v6, react-hook-form + zod, react-toastify, Firebase JS SDK, Supabase JS (installed, not yet wired).

**Backend:** Firebase Cloud Functions (Node 18), firebase-admin, Playwright (Chromium).

## Getting started

### Prerequisites

- Node.js 18+ and npm
- A Firebase project with Firestore and Cloud Functions (Blaze plan — Playwright needs outbound network access)
- Firebase CLI: `npm i -g firebase-tools`

### 1. Front end

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
npm run preview    # serve the production bundle locally
npm run lint
```

### 2. Firebase configuration

Both of these files ship with placeholders and must be filled in before anything talks to Firebase:

- `.firebaserc` — set `projects.default` to your Firebase project ID.
- `src/firebase.ts` — replace the `firebaseConfig` object with the web-app config from the Firebase console.

The Firebase web config is safe to commit (it is not a secret; access is governed by Firestore security rules). Do **not** commit service-account JSON or any `.env` file — both are already covered by `.gitignore`.

### 3. Cloud Functions

```bash
cd functions
npm install
npx playwright install chromium   # local only
npm run serve                     # build + start the local emulator
npm run deploy                    # firebase deploy --only functions
```

`functions/test-skill.js` is a standalone harness that launches Chromium locally and simulates one skill run without touching Firestore:

```bash
cd functions && node test-skill.js
```

## Current status

What works today:

- Full UI across all seven routes, with local state via `AppContext`.
- Firestore trigger that launches a real headless Chromium session and navigates to the supplied `targetUrl`.
- Task lifecycle written back to Firestore (`pending → executing → completed | failed`) with progress and logs.

What is still stubbed and should be treated as placeholder logic:

- `executeSkillAction` only string-matches the skill name to pick a branch; the branch bodies are `TODO` comments. No form-filling, lead extraction or submission is implemented.
- `commissionGenerated` is `basePayout + Math.random() * maxBonus`. It is a display number, not money.
- The log strings in each branch describe intended behaviour, not what the code does.
- Firestore security rules are not included in this repo.
- `src/firebase.ts` and `.firebaserc` are placeholders.
- `@supabase/supabase-js` is a dependency but unused.

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
│   ├── src/index.ts        executeWorkflowTask Cloud Function
│   └── test-skill.js       local Playwright harness
├── public/
├── scripts/init-git.sh     original bootstrap script (points at an older remote)
├── firebase.json
└── .firebaserc
```

## License

Not yet specified.
