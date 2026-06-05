# Sam Rogers AI Resume
This repository is part of the resume.
It is not only source code for https://sam-rogers.com/. It is also an inspectable artifact for recruiters, hiring managers, security reviewers, IT teams, and AI compliance teams who need to understand how the resume behaves, what it sends to third parties, what it does not store, and why the implementation choices were made.
## What This Is For
The site is designed for a staged hiring workflow:
- Recruiter: quickly determine whether Sam belongs on the shortlist, copy evidence into an ATS or hiring-manager note, and avoid spending time decoding a nonlinear career.
- Hiring manager: evaluate fit against an actual job description, including gaps, transferability, and interview probes.
- Security, IT, and AI compliance reviewers: inspect the candidate's approach to AI-enabled product design, data minimization, prompt boundaries, evidence discipline, and operational controls.
The product decision behind this repo is simple: if the resume claims AI governance, certification, human-AI collaboration, and responsible adoption experience, the resume itself should demonstrate those habits. The implementation favors narrow surfaces, explicit boundaries, minimal telemetry, and auditable source material over a generic chatbot wrapper.
## Design Decisions
### Human-first, machine-readable second
The homepage is the primary resume experience. It is interactive, visual, and optimized for human triage. It also includes no-JS fallback content and generated static crawl pages so LLMs, search crawlers, link unfurlers, and agentic tools can still read core facts without executing React.
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
- A qualitative target band (senior individual contributor or Lead, in-band role types, signal-list for analyzer calibration) appears. Specific compensation numbers do not, because financial detail belongs on a human-to-human call rather than in a system prompt.
- altMBA, Capital One, and similar career-shape items appear with explicit "disclose only on direct ask" instructions. Disclosure cost is low, but proactively surfacing them weakens the senior-IC and Lead positioning, so the gating is editorial, not protective.

The disclosure rule is enforced mechanically by a PII scan in the test suite. See "Reveal-safe PII evals" below for how that scan is designed so the eval itself does not become a disclosure surface.

The disclosure check is the threshold for adding anything new to the private FAQ. If an item fails the check, the right channel is a direct conversation with Sam, not the chat surface.

### Reveal-safe PII evals
This repository is open source. A naive PII scan would defeat itself: writing a regex literal of the exact value being blocked puts that value into a publicly readable test file, so any reader of the source learns precisely what was meant to be private. The scan in [src/test/pii-scan.test.ts](src/test/pii-scan.test.ts) is designed so that the eval reveals only the categories of protection, not the candidate-specific values being protected.

Design choices that make this work:

- Two-layer pattern model. Generic shape-based patterns (any US-format phone number, any SSN-shaped string, any dollar-amount figure, any compensation range) are kept as literal regexes because the shapes themselves are public knowledge and reveal nothing about the candidate. Candidate-specific values (a particular residential city, town, state, ZIP, or personal phone number) are stored only as SHA-256 hex digests of normalized lowercase forms. A reader of the test file learns that residential signals are being blocked, but not which specific residential signals.
- No labels on the digest set. The hash entries are an unordered set, not a labeled map. A reader cannot infer which digest corresponds to a city versus a state versus a phone number, and the order is intentionally rotated when entries are added so positional inference is also unreliable.
- Tokenization at scan time. The scan tokenizes each file line into one-to-four-word lowercase n-grams and into phone-shape digit windows (digits-only, sliding 10-digit windows). Each candidate is hashed and checked against the digest set. This means a multi-word city name, a state name, a single-token ZIP, and a phone in any format collapse to the same hashed-membership test, without the test file needing to know which kind of literal it is matching.
- Violation reports never echo the matched substring. When the scan finds a hit, it reports file path and line number only. A CI log, a screenshot, or an issue paste of a failing run does not leak the value the scan was protecting. The author can open the file locally to see what happened.
- Allowlists are also hashed. Legitimate non-residential references that happen to share a name (e.g. a regulatory project anchor that uses a state's name in a non-residence context) are allowed by full-line SHA-256, not by quoted regex. The legitimate context never has to appear in the test file alongside the rule that permits it.
- Positive controls cover the allowlisted identifiers. Name, email, and region are asserted to appear somewhere in the scanned set as plain-text positive controls. These three are public by policy, so naming them does not weaken the design. Their presence guarantees the scan is wired to real content rather than silently passing on an empty file collection.
- Reveal-safety is verifiable. A grep of the test file and this README for any candidate-specific phone, ZIP, city, or state literal returns nothing. This property is mechanical, not editorial, and a future reviewer can re-verify it without trusting prior intent.

Scope reminder: this scan covers committed repository content only. User-submitted text in form fields and chat messages is governed by the API handlers' prompt-boundary tests and the JD review scanner, not by this eval.

### User context is useful, but sensitive context is risky
The job-description workflow includes an optional in-browser business-context review before API submission. The scanner is deterministic, runs locally, and flags likely non-public details so the user can replace them with placeholders before sending text for model analysis.
This is risk reduction, not anonymization. The app explicitly warns users not to paste confidential, proprietary, regulated, or unreleased role data. Sensitive roles should be handled by email instead.
### Public positioning and server-only context are separated
Public surfaces avoid proactively marketing previous or overly narrow role positioning. Server-side prompts may still retain context needed to answer user-supplied role descriptions honestly. For example, if a pasted role explicitly asks about an AI officer-style scope, the model can assess transferable evidence and gaps without advertising that as Sam's current offer.
This separation is a governance decision: public metadata should not solicit roles the candidate is not actively positioning for, while the LLM should not become less accurate when the user supplies legitimate context.
## What Was Used And Why
- Vite: fast static frontend build with predictable output.
- React: interactive resume surfaces, fit workflow, AI chat, and copy-ready sidebar.
- TypeScript: typed data contracts for profile content, fit results, API handlers, and tests.
- Tailwind CSS: local design system with constrained, inspectable styling.
- Radix Dialog: accessible modal foundation for the AI chat surface.
- Vercel Functions: small server-side API endpoints for chat and fit analysis.
- Anthropic Messages API: LLM responses for resume questions and structured job-description fit analysis.
- Upstash Redis: optional public-endpoint rate limiting with production fail-closed behavior.
- PostHog: optional cookieless interaction analytics with autocapture disabled.
- Vitest and Testing Library: unit, integration, public-surface, API-handler, and prompt-boundary test coverage.
The stack is intentionally ordinary. The point is not to hide behind an exotic architecture. The point is to make the AI-enabled parts easy to inspect, constrain, test, and replace.
## Architecture
The app has four main surfaces:
- Human resume: React-rendered homepage with hero, evidence, work history, fit assessment, booking/contact path, and AI chat.
- Interview Decision Brief: desktop/tablet sidebar with recruiter and hiring-manager copy blocks, locally remembered state, and fit-result-aware updates.
- API layer: `/api/chat` and `/api/analyze-fit`, both using Anthropic, rate limits, no-store responses, prompt boundaries, and `/api/limits` discovery.
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
Latest local production-preview validation: 2026-05-30, Lighthouse 13.3.0, against generated production assets at `http://127.0.0.1:4175/`.
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
The browser print path is intentionally supported for recruiters who need to save or forward a PDF. The print stylesheet keeps the resume source of truth in the webpage while removing interactive-only surfaces: navigation, the Interview Decision Brief sidebar, AI chat, the fit-assessment form, buttons, animations, shadows, and decorative layout treatment.
The printed output keeps identity, positioning, experience evidence, skills, and contact paths. Important links print with their URLs so a saved PDF remains auditable outside the browser.
## Data Flow
For normal page viewing:
- Static assets are served from the site.
- Optional PostHog events may record metadata-only interactions if configured.
- No account, login, cookie banner, or user profile is required.
For AI chat:
- The user's chat message is sent to `/api/chat`.
- The API builds a bounded system prompt from public resume data and server-side role-context rules.
- The message is sent to Anthropic.
- The app does not intentionally store chat messages.
For fit assessment:
- The user pastes a job description.
- The browser can run a local deterministic review for business-sensitive terms.
- Only the current reviewed textarea content is sent to `/api/analyze-fit`.
- The API asks Anthropic for structured JSON with verdict, matches, gaps, transferability, and recommendation.
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
Job-description review events carry only a flag count, a character-length bucket, and an edited boolean. Interview Decision Brief copy events carry only metadata such as block id, mode, and fit verdict. They never include copied text, scanned text, flagged terms, placeholders, JD content, or any company, client, employee, or project names.
## Security And Compliance Posture
This is a public resume site, not an enterprise system. The security posture is therefore scoped to public web endpoints, user-submitted text risk, model-boundary risk, and claim integrity.
Controls include:
- CSP, `nosniff`, referrer policy, permissions policy, and frame-ancestor restrictions in `vercel.json`.
- `Cache-Control: no-store` on API responses.
- API rate limiting with burst and sustained windows.
- Production fail-closed behavior when rate limiting is not configured.
- Structured fit-analysis schema with bounded verdict values.
- Prompt-boundary tests for private information, false credentials, sensitive job material, production-infrastructure overclaiming, and JD prompt injection.
- PII / compensation exposure scan in the test suite ([src/test/pii-scan.test.ts](src/test/pii-scan.test.ts)). Runs in CI. Designed so the eval itself does not leak the values it protects — full architecture documented under "Reveal-safe PII evals" in Design Decisions above.
- Public evidence ledger for claims that need more context than a resume page can carry.
- Responsible disclosure path in `SECURITY.md`.
Important limits:
- The business-context review is not anonymization.
- The app is not a compliance certification system.
- User-submitted text is sent to Anthropic when chat or fit assessment is used.
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
- `npm run build`: production build, then generate static crawl pages
- `npm run preview`: preview production build
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript check, including Vercel API handlers
- `npm run validate:metadata`: verify generated crawl pages, structured data, sitemap, and machine-readable files
- `npm run test`: Vitest test suite, including mocked API success paths for chat streaming, structured fit analysis, Interview Decision Brief behavior, and JD state clearing
- `npm run eval:prompts`: live prompt-boundary checks for configured deployments; set `EVAL_BASE_URL` to a Vercel/dev URL with `ANTHROPIC_API_KEY`
## Deployment
This repo is configured for Vercel. `vercel.json` rewrites API routes to `/api/:path*` and all other routes to the SPA entrypoint. Security headers are declared there so reviewers can inspect the deployed posture from source.
## Review Pointers
- [SECURITY.md](SECURITY.md): endpoint threat model, disclosure path, and hardening notes.
- [EVIDENCE.md](EVIDENCE.md): claim ledger behind the resume.
- [scripts/eval-prompts.mjs](scripts/eval-prompts.mjs): live prompt-boundary evals.
- [src/components/DecisionBriefSidebar.tsx](src/components/DecisionBriefSidebar.tsx): Interview Decision Brief copy workflow for recruiter and hiring-manager handoff.
- [src/components/FitAssessment.tsx](src/components/FitAssessment.tsx): job-description assessment workflow.
- [src/components/JDReviewPanel.tsx](src/components/JDReviewPanel.tsx): local business-context review before fit analysis.
