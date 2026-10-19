# Project Context

## What this is

An AI-enabled personal resume site for Sam Rogers ("Snap"), source-hosted in this repo and deployed at https://resume.sam-rogers.com/. It is the downstream artifact a two-page paper resume points to — carrying evidence, role-fit analysis, and inspectable operating judgment that a static resume cannot. The repository itself is part of the candidacy: it is written to be read by human reviewers and by security/IT/AI-compliance reviewers evaluating how the candidate builds AI-enabled products.

## Audience

Three tiers, per INTENT.md's "Audience Ladder":

1. **Recruiters** — land on the public page after the paper resume, validate the shortlist call, copy evidence into ATS notes via the Interview Decision Brief sidebar.
2. **Hiring managers** — use the AI chat and job-description fit assessment to shape interview conversations, see honest strong/moderate/weak verdicts with named gaps.
3. **Engineering / security / IT / compliance reviewers** — read the repo itself (README, SECURITY.md, EVIDENCE.md, ROADMAP.md, tests, prompt evals) to vet the AI implementation's boundaries and claims.

## Style / Tone

Documentation is deliberately dense, precise, and non-promotional — favors bounded claims and named limitations over persuasive copy (see README.md "Design Decisions" and ROADMAP.md "Operating Principles": prefer evidence over persuasion, avoid hype, keep tracking minimal). The public product surface (hero, fit assessment) is similarly restrained: fit results can come back "weak," gaps are named explicitly rather than smoothed over. Avoid marketing language when writing anything for this project — the entire premise is that the resume should be legible and auditable before it is persuasive.

## Key URLs

- Live site: https://resume.sam-rogers.com/
- Standards referenced: https://gracefulboundaries.dev/ (Level 2, API limit communication), https://guidecheck.org/ (Level 3, assistant guide)
- Repo: origin `https://github.com/snapsynapse/resume.git`

## Current status

As of 2026-10-18, Production runs `cfa81af` and the suite is 29 test files and 380 tests, all passing. That day's releases added the availability update, confirmed training evidence, the 1200x630 social card, the applied-title-only hero on application links, a cookieless `page_viewed` count with a `tailored` boolean, and the 2x2 hero evidence grid.

History: the audit repairs shipped at `ca151d25d3b05017b18679a6c2fe6298ceab07e1` on 2026-10-15. Exact-head CI then passed 370 tests and all deterministic gates; production GET-only acceptance matched 33 build files and verified routes, public contexts, headers, and API method guards. The owning receipt is ignored `private/review-2026-10-15/audit-release/production-delivery.json`; `ops/audit-mitigations-2026-10-14.md` preserves the preceding local repair checkpoint. Inspect Git and provider state before asserting present synchronization or deployment identity. The scheduled usage refresh enforces the dependency audit before publishing.

Six keyboard regression checks cover the subsequent mobile focus repair; the production delivery receipt for that tranche is ignored `private/review-2026-10-15/keyboard-release/production-delivery.json`. Inspect that receipt and provider state for its delivery status. The automatic live-eval workflow remains disabled manually. Model-backed verification remains held. On 2026-10-18 Sam released biography additions for true, context-appropriate signals; four releases that day are recorded in ignored `private/review-2026-10-18/production-delivery.json`. Future commit, push, or deployment work requires its own request; live prompt/API evaluation additionally requires explicit release of the model hold. Open proposals live in ROADMAP.md; the release path is in CLAUDE.md.
