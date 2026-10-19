# CLAUDE.md

Agent guidance for working in this repo. See README.md, INTENT.md, ROADMAP.md, SECURITY.md, and EVIDENCE.md for the full narrative — this file is a condensed map, not a replacement.

## Purpose

Source for Sam Rogers' AI-enabled resume site (live at https://resume.sam-rogers.com/). The two-page paper resume is the actual application document; this repo/site is the downstream evidence, role-fit, and governance-inspection artifact it points to. The repo itself is part of the candidacy — security/IT/compliance reviewers are an explicit audience, not an afterthought.

## Tech Stack

- Vite + React + TypeScript (SPA)
- Tailwind CSS, Radix Dialog
- Vercel Functions for the API layer (`/api/chat`, `/api/analyze-fit`, `/api/limits`, `/api/role-context`)
- Anthropic Messages API (cloud LLM provider; public docs deliberately say "cloud LLM provider" unless the exact boundary matters)
- Upstash Redis for optional rate limiting (production fails closed if unconfigured)
- PostHog for minimal cookieless telemetry (no autocapture, no identify, metadata-only events; one `page_viewed` per route with a `tailored` boolean)
- Vitest + Testing Library for tests
- ESLint + TypeScript for lint/typecheck

## Directory Layout

- `src/components/` — UI components (chat modal, fit assessment, Interview Decision Brief sidebar, JD review panel, etc.)
- `src/pages/` — route-level pages
- `src/lib/` — shared logic, including `role-context.ts` (target presets, `company`/`target` parsing, private preset schema parser), `role-context-client.ts` (browser fetch of `/api/role-context`), and `jd-review.ts` (local sensitive-term scanner)
- `src/test/fixtures/role-context-presets.json` — FAKE employer presets (two invented companies) used to test the routing mechanism end to end; the real file lives outside the repo
- `src/data/sam-profile.ts` — single source of truth for profile content, consumed by the app, static crawl pages, AI prompts, and machine-readable files
- `src/data/ai-usage-snapshot.ts` — GENERATED floor figures for the AI usage dashboard; edit via `npm run refresh:ai-usage`, never by hand. Hand-maintained public files (`llms.txt`, `agents.json`, `assistant-guide.txt`, `llms-full.txt`) deliberately carry no token figures so they cannot go stale
- `src/test/` — test suite, including `pii-scan.test.ts` (reveal-resistant PII/compensation scan)
- `api/` — Vercel serverless functions (`chat.ts`, `analyze-fit.ts`, `limits.ts`, `role-context.ts` (public-safe context lookup), `role-context-store.ts` (server-only loader for the private presets), `boundaries.ts`, `config.ts`, `explicit-role-context.ts`, `recruiter-guidance.ts`, `vercel-adapter.ts`)
- `scripts/` — build-time and eval tooling: `generate-static-html.mjs` (static crawl pages), `validate-metadata.mjs`, `eval-prompts.mjs` (live prompt-boundary evals; employer-specific cases come from `EVAL_ROLE_CONTEXT_CASES`, never the file), `smoke-api.mjs` (live API liveness checks), `role-context-presets.mjs` (`validate` and `env` subcommands for the private presets JSON; self-contained, imports nothing from `src/`), `fetch-ai-usage.mjs` (regenerates `src/data/ai-usage-snapshot.ts` and the index.html no-JS figures from the published dashboard; run by `refresh-ai-usage.yml` weekly, never at runtime), `eval-ats-artifact.mjs` (offline plain-text resume check), `eval-recruiter.mjs` (live recruiter evals; held), `typecheck.mjs`, `og-card.html` (source for `public/imgs/og.png`, rendered with headless Chrome), and `lib/`
- `public/` — machine-readable artifacts: `llms.txt`, `llms-full.txt`, `agents.json`, `api-manifest.json`, `resume.txt`, `changelog.txt`, `sitemap.xml`, `robots.txt`, `imgs/og.png` (1200x630 social card), `.well-known/assistant-guide.txt`, `.well-known/security.txt`
- Root docs: `README.md` (architecture/design decisions), `INTENT.md` (audience strategy), `ROADMAP.md` (delivered vs. open work), `SECURITY.md` (threat model, PII eval design), `EVIDENCE.md` (claim ledger), `PROJECT_CONTEXT.md` (current status); `docs/ROLE_CONTEXT_INTAKE.md`; dated reports in `ops/`

## Conventions

- New target roles should be data additions in `role-context.ts`, `sam-profile.ts`, and the mirrored `TARGET_KEYS` in `scripts/role-context-presets.mjs`, not site rewrites. See INTENT.md's "Target Preset Checklist."
- Default public positioning stays employer-neutral; tailored context comes via `?company=<key>&target=<target>` URL params (`for` and `role` are accepted aliases). Context is chosen only by the link; there is no referrer detection.
- Never commit employer presets. Application entries (employer label, applied-for title, optional `heroTitle`, req id, posting URL, prompt delta) live in a private JSON outside the repo, loaded server-side from `ROLE_CONTEXT_PRESETS` (raw JSON) or `ROLE_CONTEXT_PRESETS_FILE` (path). Never `VITE_`-prefix them. The repo carries only the fake fixture. Do not name a pursued employer or applied-for title in any tracked file, including tests, evals, docs, and changelog entries; `pii-scan.test.ts` carries hashes of them and fails CI for any path in its `SCAN_ROOTS` (source, public, scripts, workflows, docs, ops, and the top-level project docs).
- Context parameters are reader-facing positioning selectors, not identifiers: never log them, never send their values to analytics (only the `tailored` boolean), never persist them.
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
npm run eval:audit       # offline audit-regression checks (also in the full suite)
npm run eval:ats-artifact # offline plain-text resume structure check
npm run eval:recruiter   # live recruiter evals; model-backed, held
npm run refresh:ai-usage # regenerate the AI usage snapshot from the live dashboard (network)
npm run presets:validate -- PRESETS_PATH  # schema-check the private presets JSON; never echoes values
npm run presets:env -- PRESETS_PATH       # minified JSON on stdout; wrap it as the value in a `vercel api` PATCH file body (see Release path)
```

Required env: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (defaults to `claude-opus-4-8` locally, should be explicit in production). Optional: Upstash Redis vars for rate limiting, `VITE_POSTHOG_*` for analytics, `ROLE_CONTEXT_PRESETS` or `ROLE_CONTEXT_PRESETS_FILE` for employer presets (unset means neutral site).

CI (`.github/workflows/ci.yml`): on push/PR to `main` — `npm ci`, `npm audit --audit-level=high`, lint, typecheck, test, build.

Live eval workflow (`.github/workflows/eval-live.yml`): configured for successful Production `deployment_status` events, but disabled manually during the 2026-10-14 delivery. Model-backed verification remains held. Run only deterministic checks until Sam explicitly releases that hold; any future deployment must account for the disabled workflow.

## Release path (2026-10-18)

- Pushing to `main` deploys Production through the Vercel Git integration before CI runs. To deploy after CI, push the commit to a `release/*` branch, open a PR, wait for CI, then fast-forward `main` with `git push origin <sha>:main`.
- `ROLE_CONTEXT_PRESETS` is a sensitive Production variable. Update it with `npx vercel@64.2.0 api` PATCH and a complete JSON file body (`--input`), never a pipe; it takes effect on the next deploy. Never print preset values.
- A plain Vite preview has no API handlers. To view a tailored page locally, serve `dist/` with a small stub that imports `api/role-context.ts` and points `ROLE_CONTEXT_PRESETS_FILE` at the fake fixture.
- Delivery receipts live in ignored `private/review-<date>/`.

## Operating checkpoint (2026-10-18)

- The 2026-10-14 audit repairs shipped on 2026-10-15; four more releases shipped on 2026-10-18 (current Production `cfa81af` or later). Inspect Git, provider state, and the ignored receipts in `private/review-<date>/` before asserting current synchronization or deployment state.
- Commit, push, and deployment each need Sam's request. Model-backed verification remains held. Biography additions were released by Sam on 2026-10-18 for true and context-appropriate signals.
- `npm run eval:audit` is offline and included in the full test suite. Its checks cover telemetry filtering, referenced-project typechecking, fit-result and request validation, streaming cancellation, and the scheduled-refresh dependency gate.
- Read ROADMAP.md for open proposals. `handoffs/` is empty when no session work is queued. A deterministic pass does not establish live model quality or submitted-PDF acceptance.
