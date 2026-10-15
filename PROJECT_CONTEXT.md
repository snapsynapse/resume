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

The 2026-10-14 production delivery and subsequent local audit repairs have separate acceptance boundaries. See `ops/audit-mitigations-2026-10-14.md` for the repairs and deterministic evidence; inspect Git and the ignored delivery receipt for current local versus production identity. CI runs lint, real multi-project typecheck, tests, build, and dependency audit on push/PR to `main`. The scheduled usage refresh also enforces the dependency audit before publishing.

The automatic live-eval workflow was disabled manually during delivery. Model-backed verification remains held, biography additions remain parked, and the audit repair tranche is local-only. A future push or deployment requires a new request; live prompt/API evaluation additionally requires explicit release of the model hold. See ROADMAP.md and the unresolved handoff queue before expanding the scope.
