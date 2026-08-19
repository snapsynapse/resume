# Google Search Console evidence, 2026-08-18

## Scope and identity

- Property URL: `https://search.google.com/search-console/performance/search-analytics?resource_id=https%3A%2F%2Fresume.sam-rogers.com`

- URL resource identifier: `https://resume.sam-rogers.com/`

- Visible property selector: `https://resume.sam-rogers.com/`

- Canonical production origin: `https://resume.sam-rogers.com/`

- Evidence method: authenticated Comet inspection. No account identity, private query data, credentials, or non-public exports are recorded.

## Repository and production gates

- The clean-but-diverged local branch was reconciled with `origin/main` in merge commit `30b44d1`, preserving both the local evidence-dashboard work and the remote live-eval fix.

- Repair commit `f9b7df5` added the required root `ProfilePage.mainEntity`, removed the global SPA fallback that masked unknown URLs with HTTP 200, refreshed the exact CSP hashes, and added regression checks for both search defects.

- Current dependency advisories were repaired with explicit compatible upgrades. `npm audit --audit-level=high` reports zero vulnerabilities.

- Local gates passed: lint, typecheck, 213 tests across 15 files, production build, generated static pages, and metadata validation.

- GitHub Actions run `32201540352` passed for `f9b7df5` before console mutation.

- Production verification found all six canonical sitemap pages returning HTTP 200 with `ProfilePage.mainEntity`, `robots.txt` and `sitemap.xml` returning HTTP 200, exactly six sitemap URLs, and the synthetic unknown URL `/__search-audit-unknown-20260818__` returning HTTP 404.

## Search performance

- Time range: default three months.

- Observation: Search Console displayed no query data.

- This is a dated provider observation, not proof of zero impressions or a repository defect.

## Sitemaps

Before the repair, `/sitemap.xml` showed:

- Submitted: 2026-05-12.

- Last read: 2026-08-09.

- Status: Success.

- Discovered pages: 6.

- Discovered videos: 0.

Production still contains the same six verified canonical URLs, so no sitemap refresh was justified.

## Page indexing

- Report last updated: 2026-08-13.

- Property aggregate: 2 indexed and 4 not indexed.

- The only exclusion reason was `Discovered - currently not indexed`.

- Affected URLs: `/about/`, `/contact/`, `/fit-assessment/`, and `/portfolio/`; all showed last crawl `N/A`.

## Profile page enhancement

- Report last updated: 2026-08-16.

- Before repair: 1 invalid item and 0 valid items.

- Critical issue: missing field `mainEntity` on `https://resume.sam-rogers.com/`.

- First detected: 2026-07-06. Last crawled: 2026-07-06.

- Live production exposed the required `mainEntity` before validation began.

## Action ledger

| Provider and property ID | Action and target | Accepted or attempted at | Confirmation | Result class | Repeat policy | Next review |
|---|---|---|---|---|---|---|
| Google Search Console, `https://resume.sam-rogers.com/` | Validate fix for missing `ProfilePage.mainEntity` | 2026-08-18 18:33 MDT | `Validation Started`; started 2026-08-18 | Accepted and pending | Do not restart | Validation status changes after Google recrawls the root page |
| Google Search Console, `https://resume.sam-rogers.com/` | Request indexing for `https://resume.sam-rogers.com/about/` | 2026-08-18 18:34 MDT | URL added to the priority crawl queue | Accepted and pending | Never repeat | URL Inspection or page-indexing report changes |
| Google Search Console, `https://resume.sam-rogers.com/` | Request indexing for `https://resume.sam-rogers.com/contact/` | 2026-08-18 18:36 MDT | Daily quota exceeded; request could not be processed | Failed, not queued | Reinspect on a later day before one new attempt | Daily quota is available and the URL remains eligible |
| Google Search Console, `https://resume.sam-rogers.com/` | Request indexing for `https://resume.sam-rogers.com/fit-assessment/` | Not attempted | Stopped after the quota failure | Not attempted | Inspect before a future one-time request | Daily quota is available and the URL remains eligible |
| Google Search Console, `https://resume.sam-rogers.com/` | Request indexing for `https://resume.sam-rogers.com/portfolio/` | Not attempted | Stopped after the quota failure | Not attempted | Inspect before a future one-time request | Daily quota is available and the URL remains eligible |

## Exports

- Exports captured: none. Evidence was transcribed from authenticated report views without private query data.
