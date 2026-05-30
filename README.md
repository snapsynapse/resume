# Sam Rogers AI Resume
Interactive resume for https://sam-rogers.com/. The site presents a concise work history, an AI chat for recruiter questions, and a job-description fit assessment with an optional local business-context review step.
## Stack
- Vite
- React
- TypeScript
- Tailwind CSS
- Radix Dialog
- Vercel Edge Functions
- Anthropic Messages API
- Optional Upstash Redis rate limiting
- Optional PostHog cookieless click analytics
## Local Setup
```sh
npm install
cp .env.example .env.local
npm run dev
```
The Vite dev server runs on port 8080 by default. Use `vercel dev` when testing `/api/chat` or `/api/analyze-fit` locally.
## Environment
Required:
```sh
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-opus-4-8
```
`ANTHROPIC_MODEL` is optional locally and defaults to `claude-opus-4-8`, but it should be set explicitly in production so model changes are reviewable.

Optional rate limiting:
```sh
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
Without Upstash, the API routes run locally but skip rate limiting. In production, missing Upstash configuration fails closed with HTTP 503 so public endpoints do not run without cost controls.
Optional cookieless analytics:
```sh
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://us.i.posthog.com
```
Vite embeds `VITE_` variables at build time. A deployed build will not capture analytics unless `VITE_POSTHOG_KEY` is present in the deployment environment before the build runs.
## Analytics Intent
PostHog is used only for minimal monitoring of whether visitors use the interactive resume surfaces. The intent is lightweight click/interaction telemetry, not behavioral surveillance.
The implementation must remain cookieless and should not require a cookie banner or additional tracking disclosure. Keep these constraints:
- `cookieless_mode: "always"`
- `autocapture: false`
- pageview and pageleave capture disabled
- session recording disabled
- no `identify()` calls
- no user text, job-description text, chat content, email addresses, names, or other user-supplied content in event properties
- `respect_dnt: true`
Current explicit events cover chat opens, chat message send/response outcomes, fit-assessment starts/completions/failures, job-description review panel opened/skipped/completed, booking clicks, email clicks, footer link clicks, section navigation clicks, and experience-context toggles.
Job-description review events carry only a flag count, a character-length bucket, and an edited boolean. They never include scanned text, flagged terms, placeholders, or any company, client, employee, or project names.
To debug a configured build in-browser, append `?analytics_debug=1` and watch the console/network panel for PostHog requests to the configured host. Local builds also warn in the console when `VITE_POSTHOG_KEY` is missing.
## Scripts
- `npm run dev`: start local Vite server
- `npm run build`: production build, then generate static crawl pages
- `npm run preview`: preview production build
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript check, including Vercel API handlers
- `npm run validate:metadata`: verify generated crawl pages, structured data, sitemap, and machine-readable files
- `npm run test`: Vitest test suite, including mocked API success paths for chat streaming and structured fit analysis
- `npm run eval:prompts`: live prompt-boundary checks for configured deployments; set `EVAL_BASE_URL` to a Vercel/dev URL with `ANTHROPIC_API_KEY`
## Machine-Readable Routes
The homepage is the human-first interactive resume. It still includes meaningful no-JS fallback HTML inside `index.html`, so agents that fetch raw HTML can read a profile summary, experience summary, contact paths, and links to dedicated crawl pages before React hydrates.
Dedicated public routes are generated after `vite build` by [scripts/generate-static-html.mjs](/Users/snap/Git/resume/scripts/generate-static-html.mjs):
- `/about/`
- `/experience/`
- `/fit-assessment/`
- `/portfolio/`
- `/contact/`
These pages are primarily for LLMs, SEO crawlers, link unfurlers, Siteline-style scanners, and agents that do not execute JavaScript reliably. Humans may visit them, so they intentionally share the homepage's look and feel, but they are not meant to replace the interactive homepage.
The generator imports `src/data/sam-profile.ts` for role targets, experience highlights, and PAICE portfolio entries. Keep profile edits there first so the interactive app, AI prompts, and static crawl pages stay aligned.
Generated files live in `dist/` after `npm run build` and are not committed. Test them with:
```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```
Then visit `http://127.0.0.1:4173/about/` or the other generated routes.
Machine-readable resources in `public/` include:
- `/llms.txt`
- `/llms-full.txt`
- `/agents.json`
- `/api-manifest.json`
- `/resume.txt`
- `/changelog.txt`
- `/sitemap.xml`
- `/.well-known/security.txt`
## Deployment
This repo is configured for Vercel. `vercel.json` rewrites API routes to `/api/:path*` and all other routes to the SPA entrypoint.
## Evidence And Evals
Claims that need more context than a public page can carry are mapped in [EVIDENCE.md](/Users/snap/Git/resume/EVIDENCE.md). The goal is bounded substantiation, not dumping client material into a public repo.

Prompt-boundary evals live in [scripts/eval-prompts.mjs](/Users/snap/Git/resume/scripts/eval-prompts.mjs). They check that the AI layer refuses private-address and false-credential requests, routes sensitive job material to email, does not overclaim production-infrastructure ownership, and resists job-description prompt injection.
## Privacy Note
The chat and fit assessment send user-supplied text to Anthropic for analysis. The app does not intentionally store chat messages or submitted job descriptions, and analytics events must never include user-supplied text. Visitors should not paste confidential, proprietary, regulated, or unreleased role data into the form. For sensitive roles, email Sam directly instead.
Before analysis, the fit assessment offers an optional business-context review. A deterministic scanner runs entirely in the browser, calls no third-party service, and flags likely non-public details (internal codes, confidential searches, client names, unreleased plans) so the visitor can replace them with bracketed placeholders or edit the text. Only the reviewed text is sent to `/api/analyze-fit`. This is risk reduction and transparency, not anonymization, compliance certification, or legal advice.
## Security
See [SECURITY.md](/Users/snap/Git/resume/SECURITY.md) for the endpoint threat model, responsible disclosure path, and hardening notes.
See [EVIDENCE.md](/Users/snap/Git/resume/EVIDENCE.md) for the claim ledger behind the resume.
