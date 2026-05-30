# Roadmap
Open work for [resume.sam-rogers.com](https://resume.sam-rogers.com).
This document is part of the resume. It is written for the tertiary vetting audience: security, IT, AI compliance, and governance reviewers who want to understand not only what exists, but what risks remain intentionally visible.
The active site is functional. Items below are not promises of enterprise completeness. They are the remaining improvements that would make the resume easier to audit, safer to operate, or more useful inside a hiring workflow.
## Operating Principles
- Prefer evidence and bounded claims over persuasion.
- Keep analytics minimal and metadata-only.
- Treat user-supplied job descriptions as potentially sensitive.
- Make AI behavior inspectable through tests and public documentation.
- Avoid adding workflow features that increase tracking, lock-in, or data collection.
## Measurement And Ops
- **PostHog cookieless analytics review** — review interaction counts after 30-60 days and remove any event that does not drive a content, usability, or conversion decision. The purpose is curation, not behavioral surveillance.
- **Post-deploy Siteline self-eval** — rerun an agent-readiness scan after deployment and use remaining failures as the next worklist. This keeps machine-readable surfaces aligned with the human resume.
- **CI eval gate** — run lint, typecheck, unit tests, build, `validate:metadata`, and prompt-boundary evals against preview URLs when API environment variables are available.
- **Live API smoke test** — run `/api/chat` and `/api/analyze-fit` against Vercel previews with `ANTHROPIC_API_KEY` configured. Local Vite cannot cover the live API path.
- **Automated accessibility eval** — add axe or equivalent once Playwright/Puppeteer is installed. Cover homepage, Decision Brief sidebar, chat modal, mobile menu, and fit form.
- **Visual regression snapshots** — capture mobile, tablet, and desktop states for hero, Decision Brief sidebar, mobile menu, chat modal, and fit assessment.
## Distribution And Review Artifacts
- **PDF / print view** — recruiters still share PDFs internally. Add either a print stylesheet that produces a usable PDF or a `/resume.pdf` route that renders the current evidence hierarchy cleanly.
- **Security-review packet** — consider a short generated artifact that links `README.md`, `SECURITY.md`, `EVIDENCE.md`, prompt evals, public machine-readable files, and deployed headers. This would reduce review friction for IT and compliance teams without adding new runtime behavior.
## Drift Monitoring
- **Prompt eval fixtures** — keep current boundary fixtures for private facts, false credentials, sensitive-material handling, production-engineering boundaries, and fit-assessment injection. Add recruiter- or compliance-specific cases only when real conversations expose a recurring failure mode.
- **Public-surface drift checks** — continue checking that public files stay aligned with current positioning and do not point to local-only planning material. This protects what crawlers, agents, and reviewers can recover from the repo.
- **Analytics-informed content review** — use PostHog interaction counts only to decide which FAQ, CTA, Decision Brief, and fit-assessment surfaces need curation. Do not add invasive tracking.
## Safety And Abuse
- **Per-IP daily cap** — current limits cover burst and hourly use. Add a daily cap if logs show distributed or rotating abuse patterns.
- **Input abuse handling** — currently the app warns users not to submit sensitive material but does not moderate every possible abusive input before sending it to the model. Add a lightweight preflight check only if abuse becomes evident.
## Accessibility And Usability Polish
- **Desktop scroll cue review** — mobile cue is hidden. Decide whether the remaining desktop "Scroll to explore" cue is useful or visual noise.
- **Keyboard copy workflow review** — verify the Decision Brief remains efficient for keyboard-only recruiters and hiring managers after real use.
## Not On Roadmap
- **Broad prompt eval expansion without evidence of failure** — the current stage prioritizes workflow and integration evals. Additional live LLM evals should be added only when a concrete boundary risk appears.
- **Show failures directly on the page** — chat is the intended surface for nuanced failure stories. If visitors do not engage the AI, they do not get the full narrative. That is intentional.
- **In-page testimonials** — testimonials would dilute the evidence-first framing.
- **More tracking for attribution** — the resume should not become a marketing funnel with identity resolution, session replay, or cross-site tracking.
