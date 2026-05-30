# Roadmap

Deferred work for [resume.sam-rogers.com](https://resume.sam-rogers.com). Active site is functional; items below are improvements ordered by impact.
## Recently completed
- **Mobile chat modal centering** — fixed transform collision between centered dialog placement and entrance animation.
- **Mobile hero overlap** — hid the scroll cue on mobile so it no longer collides with the primary CTA.
- **Static crawl page drift** — generated role targets, experience highlights, and portfolio entries from `src/data/sam-profile.ts`.
- **API success-path tests** — added mocked coverage for chat streaming, structured fit parsing, and invalid structured output.

## Measurement & ops

- **PostHog cookieless analytics review** — keep analytics minimal: explicit interaction events only, no autocapture, no pageviews, no replay, no identity, no user-supplied text. Review after 30-60 days and remove any event that does not drive a curation or conversion decision.
- **Post-deploy Siteline self-eval** — rerun the agent-readiness scan after this branch is deployed and use remaining failures as the next worklist.
- **CI eval gate** — run lint, typecheck, unit tests, build, `validate:metadata`, and the expanded prompt-boundary evals against preview URLs when API env is available.
- **Automated accessibility eval** — add axe or equivalent once Playwright/Puppeteer is installed. Cover homepage, chat modal, mobile menu, and fit form.
- **Live API smoke test** — run `/api/chat` and `/api/analyze-fit` against Vercel previews with `ANTHROPIC_API_KEY` configured. Local Vite cannot cover the live API path.
- **Visual regression snapshots** — capture mobile, tablet, and desktop states for hero, mobile menu, chat modal, and fit assessment.

## Distribution & SEO

- **PDF / print view** — recruiters share PDFs internally. Either a print stylesheet that produces a usable single-page PDF, or a `/resume.pdf` route that renders server-side.

## Drift monitoring

- **Prompt eval fixtures** — current fixtures cover private facts, false credentials, sensitive-material handling, production-engineering boundaries, and fit-assessment injection. Add more recruiter-specific scenarios as they appear in real conversations.
- **Analytics-informed content review** — use PostHog interaction counts only to decide which FAQ, CTA, and fit-assessment surfaces need curation. Do not add invasive tracking.

## Workflow hygiene

- **Dependency hygiene** — unused shadcn/ui surface has been pruned, Browserslist data has been refreshed, and Vite uses the standard React plugin.

## Cosmetic / polish

- **Role-aware CTA labeling** — the stale "New" badge has been removed. Consider a future Anthropic-specific role badge only if it adds clarity without feeling over-targeted.
- **Decide whether to cut desktop "Scroll to explore" arrow** — mobile hidden; desktop cue remains but may still be redundant.

## Safety / abuse

- **Per-IP daily cap** — current limits are 5/min + 50/hr. Add 200/day for distributed/rotating abuse safety net.
- **Content moderation on user input** — currently nothing filters what gets sent to Claude. Add a lightweight check if abuse becomes evident in logs.

## Not on roadmap (intentionally skipped)

- **Show failures on the page** — chat is the value surface. If visitors don't engage the AI, they don't get the failure stories. That's the design intent.
- **In-page testimonials** — would dilute the "ask the AI" framing.
