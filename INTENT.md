# Intent

This repository is the source for https://resume.sam-rogers.com/. It stays open because the repo is part of the resume, not merely the build artifact behind it.

## Funnel Position

The two-page paper resume is the application input and points to this shared artifact. This site is not intended to replace that document or repeat every recruiter-standard field it already carries. It provides the downstream evidence, role-fit context, and inspectable operating judgment that a static resume cannot.

Because the artifact supports multiple active applications, the default hero keeps several forward-looking role lanes in rotation while a stable positioning promise and compact evidence remain constant. Target and company parameters can narrow the context for tailored application links without creating separate deployments.

The Interview Decision Brief opens by default on desktop because observed use favors immediate copy-ready evidence. Mobile remains supported, but desktop and tablet hiring workflows are the primary optimization target for this downstream artifact.

## Operating Contract

- Primary outcome: convince a recruiter to shortlist Sam for a hiring-manager conversation. The intended 30-second conclusion is that the title history is nonstandard but the evidence is specific enough that rejecting before that conversation would be a mistake. Novelty is never a success criterion.
- Durable-target admission: a new `target` is admitted only when it names a recurring operating pattern materially different from existing lanes, has at least three independently supportable proof points, and is likely to recur across employers. Company-specific variation belongs in an application entry.
- Role-specific context requires an explicit `target` link. Referrers may select company-only context and must never infer a job family.
- Default positioning changes only after repeated external evidence, such as two or more serious interview processes or recurring recruiter feedback pointing to one operating pattern.
- Technical-work stop rule: further public-repo work must improve recruiter or hiring-manager evidence transfer, resolve a real reviewer objection, prove a concrete claim a recruiter should rely on, or reduce a live public-risk exposure. Accessibility and keyboard usability qualify. New abstract governance machinery does not without a demonstrated need.
- Application-to-interview outcome tracking lives in a private workspace, never in this repository.

## Audience Ladder

The artifact serves three hiring-stage audiences.

1. Recruiters after initial resume review
   - Primary surface: public web page reached from the two-page resume.
   - Job to be done: validate the shortlist decision and transfer concise evidence into the hiring workflow.
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
- Evidence interview: before adding a target that changes claims, gaps, disclosure, or location, run `docs/ROLE_CONTEXT_INTAKE.md` privately.
