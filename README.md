# Sam Rogers AI Resume
Interactive resume for https://sam-rogers.com/. The site presents a concise work history, an AI chat for recruiter questions, and a job-description fit assessment.
## Stack
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
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
```
Optional rate limiting:
```sh
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
Without Upstash, the API routes still run but skip rate limiting.
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
Current explicit events cover chat opens, chat message send/response outcomes, fit-assessment starts/completions/failures, booking clicks, email clicks, footer link clicks, section navigation clicks, and experience-context toggles.
To debug a configured build in-browser, append `?analytics_debug=1` and watch the console/network panel for PostHog requests to the configured host. Local builds also warn in the console when `VITE_POSTHOG_KEY` is missing.
## Scripts
- `npm run dev`: start local Vite server
- `npm run build`: production build, then generate static crawl pages
- `npm run preview`: preview production build
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript check, including Vercel API handlers
- `npm run validate:metadata`: verify generated crawl pages, structured data, sitemap, and machine-readable files
- `npm run test`: Vitest test suite, including mocked API success paths for chat streaming and structured fit analysis
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
## Privacy Note
The fit assessment sends pasted job descriptions to the configured AI provider for analysis. The app does not intentionally store submitted job descriptions. For confidential roles, email Sam directly instead.
