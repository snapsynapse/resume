# Roadmap

Deferred work for [resume.sam-rogers.com](https://resume.sam-rogers.com). Active site is functional; items below are improvements ordered by impact.

## Measurement & ops

- **PostHog cookieless analytics review** — keep analytics minimal: explicit interaction events only, no autocapture, no pageviews, no replay, no identity, no user-supplied text. Review after 30-60 days and remove any event that does not drive a curation or conversion decision.
- **Post-deploy Siteline self-eval** — rerun the agent-readiness scan after this branch is deployed and use remaining failures as the next worklist.
- **CI eval gate** — run lint, typecheck, unit tests, build, `validate:metadata`, and prompt evals against preview URLs when API env is available.
- **Automated accessibility eval** — add axe or equivalent once Playwright/Puppeteer is installed. Cover homepage, chat modal, mobile menu, and fit form.
- **Live API smoke test** — run `/api/chat` and `/api/analyze-fit` against Vercel previews with `ANTHROPIC_API_KEY` configured. Local Vite cannot cover the live API path.
- **Visual regression snapshots** — capture mobile, tablet, and desktop states for hero, mobile menu, chat modal, and fit assessment.

## Distribution & SEO

- **PDF / print view** — recruiters share PDFs internally. Either a print stylesheet that produces a usable single-page PDF, or a `/resume.pdf` route that renders server-side.

## Drift monitoring

- **Prompt eval fixtures** — extend `npm run eval:prompts` with recruiter scenarios and run it against deployed preview URLs. Catches system-prompt regressions before recruiters do.
- **Analytics-informed content review** — use PostHog interaction counts only to decide which FAQ, CTA, and fit-assessment surfaces need curation. Do not add invasive tracking.

## Workflow hygiene

- **Dependency hygiene** — update stale Browserslist/caniuse-lite data and decide whether to prune unused shadcn/Radix dependencies.

## Cosmetic / polish

- **Drop "New" badge on CTA** — stale signal after a week. Replace with role badge when Anthropic detected, or remove.
- **Cut "Scroll to explore" arrow** — single-fold site, mostly redundant.

## Safety / abuse

- **Per-IP daily cap** — current limits are 5/min + 50/hr. Add 200/day for distributed/rotating abuse safety net.
- **Content moderation on user input** — currently nothing filters what gets sent to Claude. Add a lightweight check if abuse becomes evident in logs.

## Not on roadmap (intentionally skipped)

- **Show failures on the page** — chat is the value surface. If visitors don't engage the AI, they don't get the failure stories. That's the design intent.
- **In-page testimonials** — would dilute the "ask the AI" framing.
