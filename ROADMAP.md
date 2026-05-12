# Roadmap

Deferred work for [resume.sam-rogers.com](https://resume.sam-rogers.com). Active site is functional; items below are improvements ordered by impact.

## Measurement & ops

- **PostHog cookieless analytics** — set up via `posthog:llma-cc-setup` skill. Track suggested-Q click-through, chat session length, fit-assessment submissions, Anthropic-visitor referrer rate. Decide retention based on whether the data drives a curation decision in the first 60 days.
- **Siteline self-eval** — run the agent-readiness scan against this site. Eat your own dog food.
- **CI eval gate** — run lint, typecheck, unit tests, build, metadata checks, and prompt evals against preview URLs when API env is available.
- **Automated accessibility eval** — add axe or equivalent once Playwright/Puppeteer is installed. Cover homepage, chat modal, mobile menu, and fit form.
- **Live API smoke test** — run `/api/chat` and `/api/analyze-fit` against Vercel previews with `ANTHROPIC_API_KEY` configured. Local Vite cannot cover the live API path.
- **Visual regression snapshots** — capture mobile, tablet, and desktop states for hero, mobile menu, chat modal, and fit assessment.

## Distribution & SEO

- **JSON-LD Person schema** — cross-pollinate from `paice.foundation`'s existing structured data so "Sam Rogers Anthropic" type queries can match.
- **PDF / print view** — recruiters share PDFs internally. Either a print stylesheet that produces a usable single-page PDF, or a `/resume.pdf` route that renders server-side.
- **Metadata/social card check** — assert canonical URL, OG/Twitter image existence, title/description, favicon paths, and no `www` / `http` regressions.

## Drift monitoring

- **Prompt eval fixtures** — extend `npm run eval:prompts` with recruiter scenarios and run it against deployed preview URLs. Catches system-prompt regressions before recruiters do.
- **Conversation logging review** — once PostHog is in, review what people ask weekly. Curate FAQ improvements based on real usage, not inference.

## Workflow hygiene

- **Feature branches + Vercel previews** — every change today goes direct to main. A `dev` branch with preview URLs would let visual changes be tested before going live.
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
