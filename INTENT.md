# Intent

This repository is the source for https://resume.sam-rogers.com/. It stays open because the repo is part of the resume, not merely the build artifact behind it.

## Audience Ladder

The artifact serves three hiring-stage audiences.

1. Recruiters at the top of the funnel
   - Primary surface: public web page.
   - Job to be done: quickly decide whether Sam belongs on the shortlist.
   - Supporting features: concise hero positioning, evidence-forward experience cards, target-lane clarity, and copy-ready Interview Decision Brief blocks for ATS notes, recruiter handoff, and hiring-manager summaries.

2. Hiring managers in the middle of the funnel
   - Primary surfaces: role-fit assessment, AI chat, target/company role context, and machine-readable files.
   - Job to be done: shape a better conversation around an actual role, including where the match is strong, where the gaps are real, and what evidence should be probed in a first call.
   - Supporting features: honest strong/moderate/weak fit analysis, reusable interview probes, role-context routing with optional `target` and `company` parameters, and bounded answers grounded in the resume corpus.

3. Engineering, security, IT, compliance, and secondary-interview reviewers
   - Primary surface: this public repository.
   - Job to be done: vet how the resume works, what it sends to third parties, what it does not store, what claims are bounded by evidence, and whether the implementation reflects the judgment claimed by the resume.
   - Supporting artifacts: `README.md`, `SECURITY.md`, `EVIDENCE.md`, `ROADMAP.md`, `api-manifest.json`, `assistant-guide.txt`, tests, prompt evals, metadata validation, rate-limit discovery, and source code.

## Product Principle

The resume should be legible before it is persuasive. Every layer should make the next conversation easier:

- The web page earns the first screen.
- The interactive tools improve the hiring conversation.
- The open repo lets technical and governance reviewers inspect the operating judgment behind the artifact.

## Provider Posture

The resume is model-provider portable in intent, even when a specific provider is used in production. Public product language should say "cloud LLM provider" or "model provider" unless the exact implementation boundary matters. Security, privacy, API, and dependency documentation should name the current provider truthfully.

Provider neutrality is not concealment. It is an architecture and positioning choice: the artifact should demonstrate portable, inspectable AI-enabled workflow design rather than allegiance to one lab.

## Maintenance Rule

New target roles should usually be data additions, not site rewrites. Use role-context presets and public-surface tests to keep default positioning employer-neutral while allowing tailored application links such as:

```txt
?target=content-ops&company=openai
```

If changing a claim, update the smallest durable source that owns it and keep `EVIDENCE.md`, public text artifacts, tests, and generated metadata aligned.

## Target Preset Checklist

When adding a new application context:

- Reuse an existing `target` if the durable job family is already represented.
- Add a new `target` only when the positioning wedge should survive beyond one employer.
- Add `company` metadata only for employer label, referrer matching, source role title, and employer-specific prompt deltas.
- Keep the default public resume employer-neutral unless Sam explicitly changes the active positioning.
- Update or add public-surface tests before manually editing generated text artifacts.
