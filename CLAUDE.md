# CLAUDE.md

Agent guidance for working in this repo. See README.md, INTENT.md, ROADMAP.md, SECURITY.md, and EVIDENCE.md for the full narrative — this file is a condensed map, not a replacement.

## Purpose

Source for Sam Rogers' AI-enabled resume site (live at https://resume.sam-rogers.com/). The two-page paper resume is the actual application document; this repo/site is the downstream evidence, role-fit, and governance-inspection artifact it points to. The repo itself is part of the candidacy — security/IT/compliance reviewers are an explicit audience, not an afterthought.

## Tech Stack

- Vite + React + TypeScript (SPA)
- Tailwind CSS, Radix Dialog
- Vercel Functions for the API layer (`/api/chat`, `/api/analyze-fit`, `/api/limits`)
- Anthropic Messages API (cloud LLM provider; public docs deliberately say "cloud LLM provider" unless the exact boundary matters)
- Upstash Redis for optional rate limiting (production fails closed if unconfigured)
- PostHog for minimal cookieless telemetry (no autocapture, no identify, metadata-only events)
- Vitest + Testing Library for tests
- ESLint + TypeScript for lint/typecheck

## Directory Layout

- `src/components/` — UI components (chat modal, fit assessment, Interview Decision Brief sidebar, JD review panel, etc.)
- `src/pages/` — route-level pages
- `src/lib/` — shared logic, including `role-context.ts` (target/company routing) and `jd-review.ts` (local sensitive-term scanner)
- `src/data/sam-profile.ts` — single source of truth for profile content, consumed by the app, static crawl pages, AI prompts, and machine-readable files
- `src/test/` — test suite, including `pii-scan.test.ts` (reveal-resistant PII/compensation scan)
- `api/` — Vercel serverless functions (`chat.ts`, `analyze-fit.ts`, `limits.ts`, `boundaries.ts`, `config.ts`, `explicit-role-context.ts`, `vercel-adapter.ts`)
- `scripts/` — build-time and eval tooling: `generate-static-html.mjs` (static crawl pages), `validate-metadata.mjs`, `eval-prompts.mjs` (live prompt-boundary evals), `smoke-api.mjs` (live API liveness checks)
- `public/` — machine-readable artifacts: `llms.txt`, `llms-full.txt`, `agents.json`, `api-manifest.json`, `resume.txt`, `changelog.txt`, `sitemap.xml`, `.well-known/assistant-guide.txt`, `.well-known/security.txt`
- Root docs: `README.md` (architecture/design decisions), `INTENT.md` (audience strategy), `ROADMAP.md` (delivered vs. open work), `SECURITY.md` (threat model, PII eval design), `EVIDENCE.md` (claim ledger)

## Conventions

- New target roles should be data additions in `role-context.ts` and `sam-profile.ts`, not site rewrites. See INTENT.md's "Target Preset Checklist."
- Default public positioning stays employer-neutral; tailored context comes via `?target=...&company=...` URL params.
- The private `recruiterFAQ` block in `sam-profile.ts` is sent to the cloud LLM on every chat request but never appears on public static surfaces — treat it as "acceptable if disclosed," not as a secured channel.
- Anything added to the codebase that touches PII, compensation, or disclosure boundaries needs a corresponding check in `src/test/pii-scan.test.ts` and should not leak protected values into source or CI output.
- Public-surface tests guard against drift in positioning language, provider-neutral phrasing, and repo-vetting artifact discoverability — update these alongside any copy change.

## Build / Test (from docs — do not execute without explicit instruction)

```sh
npm install
cp .env.example .env.local
npm run dev            # Vite dev server, frontend only (port 8080 default)
vercel dev              # needed to exercise /api/chat and /api/analyze-fit locally
npm run lint
npm run typecheck
npm run test            # Vitest suite
npm run build            # vite build + generate-static-html + validate-metadata
npm run preview          # preview production build
npm audit --audit-level=high
npm run eval:prompts     # live prompt-boundary evals; needs EVAL_BASE_URL + ANTHROPIC_API_KEY
npm run smoke:api        # live API liveness/shape checks; needs EVAL_BASE_URL
```

Required env: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (defaults to `claude-opus-4-8` locally, should be explicit in production). Optional: Upstash Redis vars for rate limiting, `VITE_POSTHOG_*` for analytics.

CI (`.github/workflows/ci.yml`): on push/PR to `main` — `npm ci`, `npm audit --audit-level=high`, lint, typecheck, test, build.

Live eval workflow (`.github/workflows/eval-live.yml`): triggered by Vercel's `deployment_status` event on successful Production deploys only (preview deploys are gated by Vercel auth) — runs `smoke:api` and `eval:prompts` against the live production domain.

## Current State (as of 2026-07-12)

- Branch `main`, clean working tree, in sync with `origin/main`.
- Most recent commits (2026-07-09 to 2026-07-11) fix a prompt-injection eval false positive around a disclosed-token detection window — active, recently-touched codebase.
- No open TODO/FIXME markers found in source or docs.
- ROADMAP.md is maintained as a living delivered-vs-open ledger — check it before assuming something is unbuilt; several "planned" items get closed out inline (target/company routing, provider-neutral language, etc. are already marked delivered).
- Open items on ROADMAP.md worth knowing about: automated accessibility eval (axe, once Playwright/Puppeteer is added), visual regression snapshots, keyboard-copy smoke test for the Interview Decision Brief, typed config for the JD scanner's phrase lists, optional PII detection in pasted job descriptions, per-IP daily rate cap.
