# Roadmap

Deferred work for [resume.sam-rogers.com](https://resume.sam-rogers.com). Active site is functional; items below are improvements ordered by impact.

## Measurement & ops

- **PostHog cookieless analytics** — set up via `posthog:llma-cc-setup` skill. Track suggested-Q click-through, chat session length, fit-assessment submissions, Anthropic-visitor referrer rate. Decide retention based on whether the data drives a curation decision in the first 60 days.
- **Siteline self-eval** — run the agent-readiness scan against this site. Eat your own dog food.

## Distribution & SEO

- **JSON-LD Person schema** — cross-pollinate from `paice.foundation`'s existing structured data so "Sam Rogers Anthropic" type queries can match.
- **PDF / print view** — recruiters share PDFs internally. Either a print stylesheet that produces a usable single-page PDF, or a `/resume.pdf` route that renders server-side.

## Drift monitoring

- **Weekly canonical-query check** — cron a script that hits `/api/chat` with 5 standard questions and asserts known-good substrings in the response. Catches system-prompt regressions before recruiters do.
- **Conversation logging review** — once PostHog is in, review what people ask weekly. Curate FAQ improvements based on real usage, not inference.

## Workflow hygiene

- **Feature branches + Vercel previews** — every change today goes direct to main. A `dev` branch with preview URLs would let visual changes be tested before going live.

## Cosmetic / polish

- **Drop "New" badge on CTA** — stale signal after a week. Replace with role badge when Anthropic detected, or remove.
- **Cut "Scroll to explore" arrow** — single-fold site, mostly redundant.
- **Verify mobile layout** — Hero portrait stacks above text on small screens. Untested as of writing.

## Safety / abuse

- **Per-IP daily cap** — current limits are 5/min + 50/hr. Add 200/day for distributed/rotating abuse safety net.
- **Content moderation on user input** — currently nothing filters what gets sent to Claude. Add a lightweight check if abuse becomes evident in logs.

## Not on roadmap (intentionally skipped)

- **Show failures on the page** — chat is the value surface. If visitors don't engage the AI, they don't get the failure stories. That's the design intent.
- **In-page testimonials** — would dilute the "ask the AI" framing.
