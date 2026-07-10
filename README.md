# Sam Rogers AI Resume

Live artifact: https://resume.sam-rogers.com/

The two-page resume is the application input. It points here for the evidence, role-fit context, and inspectable operating judgment that a static resume cannot carry. This repository is therefore part of the candidacy, not merely source code behind a portfolio page.

## Hiring Signal

- Scaled YouTube certification reach from about 1,000 partners per year to about 10,000 in year one.
- Streamlined Convatec content offerings by 90 percent while improving delivery speed by 40 percent.
- Reached more than 80 percent adoption in 30 days for an AI-based training platform deployed across four countries.
- Built the site itself as a bounded AI product with role-fit analysis, copy-ready hiring briefs, prompt and PII evals, minimal telemetry, and machine-readable evidence.

## Reviewer Map

- Candidate claims and reference paths: [EVIDENCE.md](EVIDENCE.md)
- Security, data flow, and reveal-resistant PII design: [SECURITY.md](SECURITY.md)
- Funnel, audience, and positioning decisions: [INTENT.md](INTENT.md)
- Delivered posture and open work: [ROADMAP.md](ROADMAP.md)

## What This Is For

The site supports the stages after a recruiter or hiring manager receives the two-page resume:

- Recruiter: validate the shortlist decision, copy evidence into an ATS or hiring-manager note, and avoid spending time decoding a nonlinear career.
- Hiring manager: evaluate fit against an actual job description, including gaps, transferability, and interview probes.
- Security, IT, and AI compliance reviewers: inspect the candidate's approach to AI-enabled product design, data minimization, prompt boundaries, evidence discipline, and operational controls.

The product decision behind this repo is simple: if the resume claims AI governance, certification, human-AI collaboration, and responsible adoption experience, the resume itself should demonstrate those habits. The implementation favors narrow surfaces, explicit boundaries, minimal telemetry, and auditable source material over a generic chatbot wrapper.

For the full repo-level audience strategy, see [INTENT.md](INTENT.md).
## Design Decisions
### Human-first, machine-readable second
The homepage is the primary interactive evidence experience for this downstream artifact. It is visual and optimized for human triage after the two-page resume introduces the candidacy. It also includes no-JS fallback content and generated static crawl pages so LLMs, search crawlers, link unfurlers, and agentic tools can still read core facts without executing React.
This is intentional. Recruiters and hiring teams should not need special tooling, but automated systems should also receive bounded, accurate context rather than scraped fragments.
### Copy workflow before novelty
The Interview Decision Brief sidebar exists because recruiters often need to copy short blocks into ATS notes, Slack threads, hiring-manager summaries, and interview packets. It is pinned on desktop and tablet where copy-paste workflows are realistic, hidden on mobile, expanded by default, and remembered locally.
The sidebar does not include contact or booking actions. Its job is evidence transfer, not conversion. It gives recruiters and hiring managers reusable language while preserving the main resume as the source of context.
### Honest fit before persuasion
The fit assessment is deliberately framed as an assessment, not a sales funnel. It can return strong, moderate, or weak fit, names gaps, and distinguishes transferable evidence from missing experience.
This matters for compliance and IT review because it shows the AI layer is expected to constrain claims, not maximize candidate appeal.
### Private FAQ disclosure model
The chat system prompt includes a `recruiterFAQ` block in `src/data/sam-profile.ts` that does not appear on the homepage, static crawl pages, `resume.txt`, `llms.txt`, `llms-full.txt`, `agents.json`, or any other public artifact. The intent is that these answers are surfaced by the chat assistant only when a visitor asks a direct question that warrants them.

This block is still sent to a cloud LLM as part of every chat request. The baseline assumption is that anything fed to a cloud-based LLM should be treated as potentially disclosable, not as a private channel. The "ask-on-direct-question" gating is a behavioral instruction, not a transport boundary.

The rule for what belongs in the private FAQ is therefore not "is it currently hidden from the homepage" but "would it be acceptable if it were disclosed." Concrete examples already in the file:
- Region appears ("SF Bay Area, hybrid available"). Residential address, ZIP, and precise city do not appear. Precise-address questions route to a direct call, framed as privacy hygiene rather than evasion. This avoids asserting a precise location on a public LLM surface where false precision would be worse than honest deferral.
- Personal phone does not appear. Disclosure cost is higher and the resume already exposes a personal email contact.
- A qualitative target band (head-of-function, senior lead, builder/operator, and in-band role types for analyzer calibration) appears. Specific compensation numbers do not, because financial detail belongs on a human-to-human call rather than in a system prompt.
- altMBA, Capital One, and similar career-shape items appear with explicit "disclose only on direct ask" instructions. Disclosure cost is low, but proactively surfacing them weakens the head-of-function, senior lead, and builder/operator positioning, so the gating is editorial, not protective.

The disclosure rule is enforced mechanically by a PII scan in the test suite. See "Reveal-resistant PII evals" below for how that scan is designed so the eval itself does not become a disclosure surface.

The disclosure check is the threshold for adding anything new to the private FAQ. If an item fails the check, the right channel is a direct conversation with Sam, not the chat surface.

### Reveal-resistant PII evals
The public test suite checks committed content for sensitive shapes and candidate-specific literals without placing the protected values in source or CI output. The attacker model, hash design, reporting behavior, limits, and verification procedure now live in [SECURITY.md](SECURITY.md#reveal-resistant-pii-evals), where security reviewers will look for them.

### User context is useful, but sensitive context is risky
The job-description workflow includes an optional in-browser business-context review before API submission. The scanner is deterministic, runs locally, and flags likely non-public details so the user can replace them with placeholders before sending text for model analysis.
This is risk reduction, not anonymization. The app explicitly warns users not to paste confidential, proprietary, regulated, or unreleased role data. Sensitive roles should be handled by email instead.
### Public positioning and server-only context are separated
Public surfaces avoid proactively marketing previous or overly narrow role positioning. Server-side prompts may still retain context needed to answer user-supplied role descriptions honestly. For example, if a pasted role explicitly asks about an AI officer-style scope, the model can assess transferable evidence and gaps without advertising that as Sam's current offer.
This separation is a governance decision: public metadata should not solicit roles the candidate is not actively positioning for, while the LLM should not become less accurate when the user supplies legitimate context.
### Target and company routing
The default public resume is employer-neutral. Tailored application context is selected through two optional URL fields:
```txt
?target=content-ops&company=openai
```
`target` owns the positioning wedge: content operations, AI education, certification systems, or another durable job family. `company` owns only employer-specific context: label, referrer patterns, source role metadata, and application-specific prompt deltas. Either field may be used alone, but the durable strategy should live under `target`, not under a company name.
The implementation lives in [src/lib/role-context.ts](src/lib/role-context.ts). Adding a new application should usually mean adding or reusing a target preset and, when needed, adding a company application entry. It should not require rewriting the homepage, public text artifacts, system prompt, chat questions, and tests by hand.
## What Was Used And Why
- Vite: fast static frontend build with predictable output.
- React: interactive resume surfaces, fit workflow, AI chat, and copy-ready sidebar.
- TypeScript: typed data contracts for profile content, fit results, API handlers, and tests.
- Tailwind CSS: local design system with constrained, inspectable styling.
- Radix Dialog: accessible modal foundation for the AI chat surface.
- Vercel Functions: small server-side API endpoints for chat and fit analysis.
- Cloud LLM provider API: LLM responses for resume questions and structured job-description fit analysis. The current implementation uses Anthropic Messages API.
- Upstash Redis: optional public-endpoint rate limiting with production fail-closed behavior.
- PostHog: optional cookieless interaction analytics with autocapture disabled.
- Vitest and Testing Library: unit, integration, public-surface, API-handler, and prompt-boundary test coverage.
- Lovable: initial scaffold. The first commits in `git log` are the Lovable/gpt-engineer bot; the 52 commits since are the substantive build, including the API layer, prompt boundaries, evals, and every governance surface described in this README.
The stack is intentionally ordinary. The point is not to hide behind an exotic architecture. The point is to make the AI-enabled parts easy to inspect, constrain, test, and replace.
## Architecture
The app has four main surfaces:
- Human resume: React-rendered homepage with hero, evidence, work history, fit assessment, booking/contact path, and AI chat.
- Interview Decision Brief: desktop/tablet sidebar with recruiter and hiring-manager copy blocks, locally remembered state, and fit-result-aware updates.
- API layer: `/api/chat` and `/api/analyze-fit`, both using the configured cloud LLM provider, rate limits, no-store responses, prompt boundaries, and `/api/limits` discovery.
- Machine-readable artifacts: static crawl pages and public text/JSON resources for agents, LLMs, search systems, and scanners.
Profile content is centralized in `src/data/sam-profile.ts` so the interactive app, static crawl pages, AI prompts, and machine-readable files stay aligned.
## Trust And Agent Interaction Standards
This resume site intentionally conforms to two public standards that Sam Rogers authored and maintains:
- [Graceful Boundaries](https://gracefulboundaries.dev/) Level 2 for public API limit communication.
- [GuideCheck](https://guidecheck.org/) Level 3 for the human-verifiable assistant guide.
This is not a claim that the resume is an enterprise compliance system. It is a design decision for inspectability. If recruiters, hiring managers, security reviewers, IT teams, AI compliance reviewers, or their agents interact with a public AI-enabled resume, they should be able to inspect the operational limits and the assistant-facing trust boundary.
Graceful Boundaries is implemented across the public API surface:
- `/api/chat`
- `/api/analyze-fit`
- `/api/limits`
Non-success API responses include `error`, `detail`, and `why`. HTTP 429 responses also include `limit` and `retryAfterSeconds`. `/api/limits` provides machine-readable discovery for enforced limits and production fail-closed behavior.
GuideCheck is implemented through `/.well-known/assistant-guide.txt`. The guide is ASCII-only, compact, and written for human verification before agent execution. It defines scope, trust boundaries, approval gates, prohibited behavior, evidence rules, sensitive job-description handling, API usage, and explicit action blocks for candidate-fit review workflows.
## Validated Lighthouse Baseline
Latest recorded local production-preview validation: 2026-05-30, Lighthouse 13.3.0, against generated production assets at `http://127.0.0.1:4175/`. Re-run after material frontend, asset, CSP, routing, or analytics changes; this dated result is evidence of the recorded build, not a claim about the current deployment.
Scores:
- Performance: 100
- Accessibility: 100
- Best Practices: 100
- SEO: 100
- Agentic Browsing: 100
Validation command:
```sh
npx -y lighthouse http://127.0.0.1:4175/ --output=json --output-path=/tmp/resume-lighthouse-lazy-fonts.json --chrome-flags="--headless --no-sandbox" --quiet
```
This is a lab validation of the built site, not a guarantee of every visitor's runtime conditions. The implementation choices behind the score include local system fonts, responsive WebP portrait assets, stricter CSP, lazy-loaded chat and fit-assessment surfaces, generated static crawl pages, and metadata validation.
## Print / PDF Handoff
The tailored two-page resume is upstream of this artifact and remains the application document. Browser print is a best-effort convenience for reviewers, not the canonical resume or a distribution format this repository generates. Its stylesheet removes interactive-only surfaces and prints important link destinations for auditability.
## Data Flow
For normal page viewing:
- Static assets are served from the site.
- Optional PostHog events may record metadata-only interactions if configured.
- No account, login, cookie banner, or user profile is required.
For AI chat:
- The user's chat message is sent to `/api/chat`.
- The API builds a bounded system prompt from public resume data and server-side role-context rules.
- The message is sent to the configured cloud LLM provider. The current production provider is Anthropic.
- The app does not intentionally store chat messages.
For fit assessment:
- The user pastes a job description.
- The browser can run a local deterministic review for business-sensitive terms.
- Only the current reviewed textarea content is sent to `/api/analyze-fit`.
- The API asks the configured cloud LLM provider for structured JSON with verdict, matches, gaps, transferability, and recommendation. The current production provider is Anthropic.
- The result updates both the fit panel and Interview Decision Brief sidebar.
- Editing the JD after analysis clears the tailored sidebar state so stale fit guidance is not reused.
## Privacy And Telemetry
PostHog is used only for minimal monitoring of whether visitors use the interactive resume surfaces. The intent is lightweight interaction telemetry, not behavioral surveillance.
The implementation must remain cookieless and should not require a cookie banner or additional tracking disclosure. Keep these constraints:
- `cookieless_mode: "always"`
- `autocapture: false`
- pageview and pageleave capture disabled
- session recording disabled
- no `identify()` calls
- no user text, job-description text, chat content, email addresses, names, or other user-supplied content in event properties
- `respect_dnt: true`
Current explicit events cover chat opens, chat message send/response outcomes, fit-assessment starts/completions/failures, job-description review panel opened/skipped/completed, booking clicks, email clicks, footer link clicks, section navigation clicks, experience-context toggles, and Interview Decision Brief copy actions.
Chat and fit-assessment text-size events use character-length buckets, not exact lengths. Job-description review events carry only a flag count, a character-length bucket, and an edited boolean. Interview Decision Brief copy events carry only metadata such as block id, mode, and fit verdict. They never include copied text, scanned text, flagged terms, placeholders, JD content, or any company, client, employee, or project names.
## Security And Compliance Posture
This is a public resume site, not an enterprise system. The security posture is therefore scoped to public web endpoints, user-submitted text risk, model-boundary risk, and claim integrity.
Controls include:
- CSP, `nosniff`, referrer policy, permissions policy, and frame-ancestor restrictions in `vercel.json`.
- `Cache-Control: no-store` on API responses.
- API rate limiting with burst and sustained windows.
- Production fail-closed behavior when rate limiting is not configured.
- Structured fit-analysis schema with bounded verdict values.
- Prompt-boundary tests for private information, false credentials, sensitive job material, production-infrastructure overclaiming, role-positioning drift, and JD prompt injection.
- PII / compensation exposure scan in the test suite ([src/test/pii-scan.test.ts](src/test/pii-scan.test.ts)). Runs in CI. Designed so the eval itself does not leak the values it protects, full architecture documented under "Reveal-resistant PII evals" in Design Decisions above.
- Public evidence ledger for claims that need more context than a resume page can carry.
- Responsible disclosure path in `SECURITY.md`.
Important limits:
- The business-context review is not anonymization.
- The app is not a compliance certification system.
- User-submitted text is sent to the configured cloud LLM provider when chat or fit assessment is used. The current production provider is Anthropic.
- Visitors should not paste confidential, proprietary, regulated, or unreleased role data.
## Evidence Discipline
The resume makes claims about certification scale, learning systems, AI adoption, compliance systems, PAICE, AI Posture, and governance-oriented work. Claims that need more context than a public page can carry are mapped in [EVIDENCE.md](EVIDENCE.md).
The intent is bounded substantiation. This repo should show enough evidence structure to support vetting without dumping client material, private employer records, or sensitive artifacts into a public repository.
## Machine-Readable Routes
The homepage includes meaningful no-JS fallback HTML inside `index.html`, so agents that fetch raw HTML can read a profile summary, experience summary, contact paths, and links to dedicated crawl pages before React hydrates.
Dedicated public routes are generated after `vite build` by [scripts/generate-static-html.mjs](scripts/generate-static-html.mjs):
- `/about/`
- `/experience/`
- `/fit-assessment/`
- `/portfolio/`
- `/contact/`
These pages are primarily for LLMs, SEO crawlers, link unfurlers, Siteline-style scanners, and agents that do not execute JavaScript reliably. Humans may visit them, so they intentionally share the homepage's look and feel, but they are not meant to replace the interactive homepage.
Machine-readable resources in `public/` include:
- `/llms.txt`
- `/llms-full.txt`
- `/agents.json`
- `/api-manifest.json`
- `/.well-known/assistant-guide.txt`
- `/resume.txt`
- `/changelog.txt`
- `/sitemap.xml`
- `/.well-known/security.txt`
Generated files live in `dist/` after `npm run build` and are not committed. Test them with:
```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```
Then visit `http://127.0.0.1:4173/about/` or the other generated routes.
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
To debug a configured build in-browser, append `?analytics_debug=1` and watch the console/network panel for PostHog requests to the configured host. The CSP permits PostHog ingestion at `https://us.i.posthog.com` and remote project configuration at `https://us-assets.i.posthog.com`; the bundled SDK uses the no-external entrypoint so it does not inject third-party scripts. Local builds also warn in the console when `VITE_POSTHOG_KEY` is missing.
## Scripts
- `npm run dev`: start local Vite server
- `npm run build`: production build, then generate static crawl pages and validate metadata
- `npm run preview`: preview production build
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript check, including Vercel API handlers
- `npm run validate:metadata`: verify generated crawl pages, structured data, sitemap, and machine-readable files
- `npm run test`: Vitest test suite, including mocked API success paths for chat streaming, structured fit analysis, Interview Decision Brief behavior, and JD state clearing
- `npm audit --audit-level=high`: dependency advisory check enforced in CI
- `npm run eval:prompts`: live prompt-boundary checks for configured deployments; set `EVAL_BASE_URL` to a Vercel/dev URL with `ANTHROPIC_API_KEY`
- `npm run smoke:api`: live liveness and response-shape checks for `/api/chat` and `/api/analyze-fit`; set `EVAL_BASE_URL` as above. Both skip cleanly when no endpoint is reachable.
The `.github/workflows/eval-live.yml` workflow runs `smoke:api` and `eval:prompts` automatically against each successful Vercel production deployment, via the `deployment_status` event the Vercel GitHub integration emits. Preview deployments are skipped because Vercel Deployment Protection answers their requests with 401, leaving the API unreachable without a bypass secret.
Local note: `npm run dev` starts Vite and serves the frontend only. Use `vercel dev` or a deployed URL for `/api/chat`, `/api/analyze-fit`, `npm run smoke:api`, and `npm run eval:prompts`.
## Deployment
This repo is configured for Vercel. `vercel.json` rewrites API routes to `/api/:path*` and all other routes to the SPA entrypoint. Security headers are declared there so reviewers can inspect the deployed posture from source.
## Review Pointers
- [SECURITY.md](SECURITY.md): endpoint threat model, disclosure path, and hardening notes.
- [EVIDENCE.md](EVIDENCE.md): claim ledger behind the resume.
- [scripts/eval-prompts.mjs](scripts/eval-prompts.mjs): live prompt-boundary evals.
- [scripts/smoke-api.mjs](scripts/smoke-api.mjs): live API liveness and response-shape smoke test.
- [src/components/DecisionBriefSidebar.tsx](src/components/DecisionBriefSidebar.tsx): Interview Decision Brief copy workflow for recruiter and hiring-manager handoff.
- [src/components/FitAssessment.tsx](src/components/FitAssessment.tsx): job-description assessment workflow.
- [src/components/JDReviewPanel.tsx](src/components/JDReviewPanel.tsx): local business-context review before fit analysis.
