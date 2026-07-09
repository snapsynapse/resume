# Roadmap
Open work for [resume.sam-rogers.com](https://resume.sam-rogers.com).
This document is part of the resume. It is written for the tertiary vetting audience: security, IT, AI compliance, and governance reviewers who want to understand not only what exists, but what risks remain intentionally visible.
The active site is functional. Items below are not promises of enterprise completeness. They separate recently delivered posture from the remaining improvements that would make the resume easier to audit, safer to operate, or more useful inside a hiring workflow.

## Operating Principles
- Prefer evidence and bounded claims over persuasion.
- Keep analytics minimal and metadata-only.
- Treat user-supplied job descriptions as potentially sensitive.
- Make AI behavior inspectable through tests and public documentation.
- Avoid adding workflow features that increase tracking, lock-in, or data collection.

## Recently Delivered
- **CI eval gate** — `ci.yml` runs lint, typecheck, unit tests, `npm audit --audit-level=high`, and build. Build also runs metadata validation.
- **Live API smoke test** — `scripts/smoke-api.mjs` (`npm run smoke:api`) checks `/api/chat` and `/api/analyze-fit` liveness and response shape against production deployments. It skips cleanly when no endpoint is reachable, so it cannot run against local Vite alone.
- **Live prompt-boundary evals** — `scripts/eval-prompts.mjs` (`npm run eval:prompts`) runs prompt-boundary and fit-assessment evals against production deployments through `eval-live.yml`.
- **Target/company routing** — tailored links now use two optional fields, for example `?target=content-ops&company=openai`. Durable positioning lives under `target`; employer context lives under `company`.
- **Employer-neutral default positioning** — default public surfaces no longer foreground a single employer application. Anthropic and OpenAI context remain available only through explicit presets or referrer/context detection.
- **Provider-portable public language** — product and public-facing docs now refer to the configured cloud LLM provider while still naming Anthropic where the current implementation boundary matters.
- **Open-repo strategy doc** — `INTENT.md` now records the three-audience ladder: recruiters, hiring managers, and engineering/security/IT/compliance reviewers.
- **Public-surface drift checks** — tests now cover current role-family positioning, employer-neutral default artifacts, model-provider language, repo-vetting artifact discoverability, and the three-audience strategy.
- **Roadmap freshness check** — public-surface tests now confirm delivered target/company routing, provider-portable language, and open-repo strategy are recorded here.
- **Target preset authoring note** — `INTENT.md` now includes a checklist for adding a new `target` or `company` without turning each application into a site rewrite.
- **Local API eval note** — `README.md` now clarifies that Vite serves the frontend only; `vercel dev` or a deployed URL is required for `/api/chat`, `/api/analyze-fit`, `smoke:api`, and `eval:prompts`.

## Measurement And Ops
- **Post-deploy Siteline self-eval** — rerun an agent-readiness scan after deployment and use remaining failures as the next worklist. This keeps machine-readable surfaces aligned with the human resume.
- **Automated accessibility eval** — add axe or equivalent once Playwright/Puppeteer is installed. Cover homepage, Interview Decision Brief sidebar, chat modal, mobile menu, and fit form.
- **Visual regression snapshots** — capture mobile, tablet, and desktop states for hero, Interview Decision Brief sidebar, mobile menu, chat modal, and fit assessment.

## Low-Hanging Fruit
- **Keyboard copy smoke check** — add a focused test for tab order and copy button reachability in the Interview Decision Brief before investing in broader visual regression.
- **Role-context fixture helper** — add a tiny test helper for target/company URL setup so future application presets do not duplicate `window.history.pushState` boilerplate across component tests.

## Distribution Artifacts
- **PDF download** — recruiters still share PDFs internally. Currently we have a print stylesheet that produces a usable PDF, but it might be useful in some cases to provide a `/resume.pdf` route that renders the current evidence hierarchy cleanly.

## Drift Monitoring
- **Prompt eval fixtures** — keep current boundary fixtures for private facts, false credentials, sensitive-material handling, production-engineering boundaries, fit-assessment injection, and role-context routing. Add recruiter- or compliance-specific cases only when real conversations expose a recurring failure mode.
- **Public-surface drift checks** — continue checking that public files stay aligned with current positioning, provider posture, and repo-vetting strategy. This protects what crawlers, agents, and reviewers can recover from the repo.
- **Analytics-informed content review** — use PostHog interaction counts only to decide which FAQ, CTA, Interview Decision Brief, and fit-assessment surfaces need curation. Do not add invasive tracking.

## Safety And Abuse
- **Per-IP daily cap** — current limits cover burst and hourly use. Add a daily cap if logs show distributed or rotating abuse patterns.
- **Input abuse handling** — currently the app warns users not to submit sensitive material but does not moderate every possible abusive input before sending it to the model. Add a lightweight preflight check only if abuse becomes evident.

## Job Description Review
- **Optional PII detection** — consider detecting emails, phone numbers, and internal URLs in pasted job descriptions. Keep it off by default or clearly secondary so the feature remains a business-context review, not an anonymization or legal-compliance claim.
- **Typed scanner configuration** — externalize phrase lists, allowlists, placeholders, and category metadata from `src/lib/jd-review.ts` into a typed config object. This would make HR-facing rule updates easier without changing scanner logic.
- **Pre-confirm diff summary** — show a short summary before confirmation, such as "3 details replaced, 1 manual edit." Keep it metadata-only and do not persist or send original/reviewed text to analytics.

## Accessibility And Usability Polish
- **Desktop scroll cue review** — mobile cue is hidden. Decide whether the remaining desktop "Scroll to explore" cue is useful or visual noise.
- **Keyboard copy workflow review** — verify the Interview Decision Brief remains efficient for keyboard-only recruiters and hiring managers after real use.

## Not On Roadmap
- **Broad prompt eval expansion without evidence of failure** — the current stage prioritizes workflow and integration evals. Additional live LLM evals should be added only when a concrete boundary risk appears.
- **Show failures directly on the page** — chat is the intended surface for nuanced failure stories. If visitors do not engage the AI, they do not get the full narrative. That is intentional.
- **In-page testimonials** — testimonials would dilute the evidence-first framing.
- **More tracking for attribution** — the resume should not become a marketing funnel with identity resolution, session replay, or cross-site tracking.
