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

Active and healthy. `main` branch clean and in sync with origin as of 2026-07-12. Most recent work (2026-07-09 to 2026-07-11) tightened a prompt-injection eval false positive. CI (lint/typecheck/test/build/audit) runs on every push/PR to `main`; a second workflow runs live API smoke tests and prompt-boundary evals against production after each successful Vercel deploy. See ROADMAP.md for the maintained ledger of delivered vs. open work — check it before assuming a feature is missing.
