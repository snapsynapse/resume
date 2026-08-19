---
title: "Search indexing"
purpose: "Property-specific index policy, validation commands, deployment gate, and console follow-up."
status: active
updated: 2026-08-18
owner: "Sam Rogers"
open_tasks:
  - "Wait for Google to complete ProfilePage mainEntity validation."
  - "Reinspect contact, fit-assessment, and portfolio after the daily URL Inspection quota resets."
---

# Search indexing

This is repository-scoped policy for the `https://resume.sam-rogers.com/` Google Search Console URL-prefix property. The canonical production origin is `https://resume.sam-rogers.com/`. Vite builds the root page, and `scripts/generate-static-html.mjs` emits the five additional static crawl pages into `dist/`.

## Index policy

| Surface | Policy | Reason |
|---|---|---|
| `/`, `/about/`, `/experience/`, `/fit-assessment/`, `/portfolio/`, and `/contact/` | Index and include in `sitemap.xml` | Canonical recruiter and reviewer destinations |
| Unknown routes | Return HTTP 404 and omit from sitemap | Error surfaces are not content destinations |
| `robots.txt`, `llms.txt`, agent files, and other machine-readable artifacts | Crawlable and omit from the HTML sitemap | Discovery or machine consumption rather than canonical HTML pages |
| `/api/*` | Omit from sitemap and prevent caching | Interactive API surface rather than a search destination |

## Structured data

Every canonical page requires a `ProfilePage` node whose `mainEntity` identifies `https://resume.sam-rogers.com/#sam-rogers`. `scripts/validate-metadata.mjs` checks the generated pages and fails if the global Vercel SPA rewrite would turn unknown routes into HTTP 200 responses.

## Validation lanes

- Repository gates: `npm run lint`, `npm run typecheck`, and `npm test`.

- Exact artifact and metadata: `npm run build`.

- Dependency advisories: `npm audit --audit-level=high`.

- Production: verify HTTP status and canonical metadata for all six sitemap URLs, then verify `robots.txt`, `sitemap.xml`, exact sitemap count, and a synthetic unknown path.

## Deployment and console sequence

1. Reconcile branch and remote history without overwriting concurrent work.

2. Run repository checks and build the exact artifact.

3. Push `main` through CI and the Vercel integration.

4. Wait for CI and production convergence.

5. Reconcile production HTTP, canonical metadata, unknown-route behavior, robots, and sitemap.

6. Only then request eligible canonical pages once or validate a repaired enhancement group when the live examples satisfy that group.

## Current baseline

The latest authenticated-console evidence is in `ops/search/GoogleSearchConsole/2026-08-18/README.md`. Production passes the six-page search contract at commit `f9b7df5`. Google accepted validation for the repaired root `mainEntity` issue; the root's inspected crawl still predates the repair, while a post-deployment crawl indexed `/about/` and detected a valid ProfilePage item. The aggregate four-page exclusion count is therefore stale. The `/contact/` request failed before queueing because the daily quota was exhausted; `/fit-assessment/` and `/portfolio/` were not attempted. Reinspect those three still-uncrawled URLs after quota reset and keep failed, unknown, and accepted states distinct.
