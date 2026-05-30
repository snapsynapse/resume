# Job Description Business Context Review
Status: implemented. Scanner in `src/lib/jd-review.ts`, review UI in `src/components/JDReviewPanel.tsx`, wired into `src/components/FitAssessment.tsx`.
Audience: internal HR, talent acquisition, and hiring managers using the fit assessment.
Scope: text job descriptions pasted into the interactive resume. File upload is out of scope until the text flow proves useful.
## Product intent
The goal is to earn an interview by making the reviewer's job easier and safer.
The fit assessment should receive as much useful role context as possible. The review step should help the user remove or generalize non-public business details that could create avoidable liability, employer-policy risk, or recruiter-client trust risk.
This is not PII anonymization. It is not a legal guarantee. It is a lightweight, transparent review assist for business-sensitive context.
## Reference frame
The review should focus on whether information is non-public, controlled by the employer or client, and potentially valuable or disruptive if disclosed outside the intended recruiting process.
Research basis:
- Trade-secret risk generally turns on whether information is not generally known, has economic value because it is secret, and is subject to reasonable measures to keep it secret. Source: [Cornell LII, trade secret](https://law.cornell.edu/wex/trade_secret).
- Job descriptions are usually not confidential as complete documents, but specific details attached to a role can be restricted. Examples include internal compensation details, specialized duties, and highly sensitive R&D, advanced technology, or national-security work. Source: [JDXpert, Are Job Descriptions Confidential?](https://jdxpert.com/blog/are-job-descriptions-confidential).
- Published salary ranges should not be treated as sensitive by default. Many jurisdictions require pay ranges in covered job postings, and employees generally have protected rights to discuss wages. Sources: [New York Department of Labor, Pay Transparency](https://dol.ny.gov/pay-transparency) and [NLRB, Your Right to Discuss Wages](https://nlrb.gov/about-nlrb/rights-we-protect/your-rights/your-rights-to-discuss-wages).
- Confidential recruiting risk often comes from replacement roles, strategic hiring, stealth initiatives, or client-controlled disclosure. Sources: [Aplin, confidential job postings](https://aplin.com/blog/why-some-job-postings-are-confidential/) and [Martyn Bassett, recruiter client disclosure](https://mbassett.com/blog/recruiters-sharing-client-companies/).
- Internal jargon, acronyms, and employee names are often bad job-description practice even when they are not legally sensitive. Sources: [Wright State, writing an effective job description](https://wright.edu/human-resources/writing-an-effective-job-description) and [University of Waterloo, job description writing guidelines](https://uwaterloo.ca/human-resources/node/591).
## Principles
- Preserve role signal by default.
- Review business-sensitive context, not ordinary recruiting context.
- Use plain recruiter-friendly language.
- Use deterministic local scanning. Do not call a third-party anonymization service.
- Use bracketed placeholders for user-approved substitutions.
- Let the user approve and continue. Do not block analysis because the scanner is uncertain.
- Never send original or reviewed JD text to analytics.
## Usually preserve
These details usually help the fit assessment and should remain unless the user knows the search is confidential or the detail is non-public.
| Detail | Why preserve it |
|---|---|
| Company name | Often essential for domain, scale, culture, and role context. It is not sensitive by default. |
| Public industry and business model | Helps assess relevance without usually exposing controlled information. |
| Public product names | Helpful for role fit when already marketed or documented externally. |
| Public vendor, partner, and tool names | Tools like Workday, Salesforce, ServiceNow, AWS, Cornerstone, Degreed, Docebo, and similar platforms are normal role context. |
| Role title and seniority | Core matching information. |
| Responsibilities and outcomes | Core matching information. |
| Required and preferred skills | Core matching information. |
| Location model and travel | Core matching information. |
| Published salary range and benefits | Often legally expected in postings and useful for fit. |
| Public compliance domains | Terms like SOC 2, HIPAA, GDPR, FedRAMP, ISO 27001, and similar domains are useful unless paired with non-public implementation details. |
## Review before analysis
These details are the core review targets. The tool should flag likely instances and offer bracketed placeholders, but the user decides whether replacement is needed.
| Detail | Why it can matter | Placeholder |
|---|---|---|
| Confidential search or replacement context | May reveal an incumbent transition, planned termination, or sensitive leadership change. | `[CONFIDENTIAL SEARCH CONTEXT]` |
| Internal requisition, headcount, approval, or job codes | May expose internal workflow, budget, headcount, or planning references that are not candidate-facing. | `[INTERNAL JOB CODE]` |
| Non-public client or customer names | May violate client expectations or reveal a non-public relationship, especially in agency, consulting, vendor, or enterprise sales contexts. | `[CLIENT NAME]` |
| Unreleased product, launch, roadmap, or initiative names | May reveal strategy before public announcement. | `[UNRELEASED INITIATIVE]` |
| Internal project, program, incident, or codename references | May identify non-public strategy, operations, security work, or delivery plans. | `[INTERNAL PROJECT]` |
| M&A, reorg, market-entry, or stealth expansion details | May reveal strategic moves before employees, investors, customers, or competitors are supposed to know. | `[STRATEGIC PLAN]` |
| Employee, hiring manager, interview panel, or incumbent names | May expose individuals unnecessarily and can make a confidential search identifiable. | `[EMPLOYEE NAME]` |
| Non-public compensation planning | Published salary ranges can stay. Internal grade, comp ratio, exception approval, equity refresh notes, or unpublished bands should be reviewed. | `[INTERNAL COMP DETAIL]` |
| Security-sensitive operational detail | May expose vulnerabilities, incidents, clearance-sensitive work, facility details, or internal controls. | `[SECURITY-SENSITIVE DETAIL]` |
## Clarity-only nudges
Some terms are not liability issues but may reduce usefulness for both the candidate and the fit assessment. These can be shown as low-pressure suggestions, not risk warnings.
| Detail | Suggested treatment |
|---|---|
| Undefined acronyms | Keep if role-relevant, define if possible. |
| Internal team shorthand | Replace with a functional description if the shorthand is not useful outside the company. |
| Internal level names | Keep if meaningful, or add a public equivalent such as senior manager, principal IC, director, or VP. |
| Overly broad confidential labels | Replace blanket warnings with the specific detail that should be protected. |
## MVP UX
The review should be inline in the existing fit assessment card, below the paste area.
Proposed flow:
1. User pastes the JD.
2. An on-by-default toggle says: "Review business-sensitive details before analysis."
3. A collapsible review panel appears when the scan finds likely review targets or when the user opens it manually.
4. The panel explains: "Company name, public tools, public products, salary ranges, responsibilities, and skills usually help the assessment. This review looks for non-public details like internal codes, confidential searches, client names, and unreleased plans."
5. The panel lists detected candidates with placeholder suggestions.
6. The reviewed JD remains editable.
7. The user confirms a short checklist and clicks "Use reviewed JD."
8. `/api/analyze-fit` receives only the reviewed JD text.
Recommended checklist:
- "I removed non-public client, internal project, search, or strategy details."
- "I kept useful public context like company, role, tools, responsibilities, and published salary information."
- "Use this reviewed JD for fit analysis."
## Placeholder policy
Use bracketed placeholders that preserve enough signal for fit analysis.
Examples:
- `Replacing current director` -> `[CONFIDENTIAL SEARCH CONTEXT]`
- `REQ-48291` -> `[INTERNAL JOB CODE]`
- `Project Atlas` -> `[INTERNAL PROJECT]`
- `Acme Bank rollout` -> `[CLIENT NAME] rollout`
- `FY26 confidential market entry` -> `[STRATEGIC PLAN]`
- `Grade 17 exception approved` -> `[INTERNAL COMP DETAIL]`
Do not over-sanitize:
- `Workday integration` should stay.
- `Salesforce enablement` should stay.
- `Remote, US-based, 20% travel` should stay.
- `$145,000-$175,000 base salary` should stay when it appears to be published recruiting language.
## Deterministic scanner requirements
The scanner should be local and deterministic. It can run entirely in the browser or in a first-party route, but it must not call a third-party anonymization service.
High-confidence patterns:
- Requisition-like codes: `REQ-12345`, `JR-1234`, `JOB-1234`, `HC-2026-018`, `FY26-HC-014`.
- Confidential search phrases: "confidential search", "replacement search", "backfill for", "replacing current", "incumbent", "do not post", "not public yet".
- Compensation planning phrases: "internal grade", "comp ratio", "exception approval", "equity refresh", "unpublished range", "offer ceiling".
- Strategy phrases: "stealth", "unannounced", "pre-launch", "market entry", "acquisition", "reorg", "restructure", "RIF", "reduction in force".
- Security phrases: "active incident", "vulnerability", "exploit", "breach", "facility access", "classified", "clearance-sensitive".
Medium-confidence patterns:
- Capitalized project-like phrases near words such as project, program, initiative, roadmap, launch, migration, rollout, client, customer, account, partner.
- Names near hiring-process words such as hiring manager, interview panel, incumbent, reports to, replacing, or backfill.
- Acronyms or codes that appear once and are near internal-process words.
The scanner should explain uncertainty. For example: "This might be an internal project name. Keep it if it is public or useful role context."
## Analytics
Allowed event properties:
- Review panel opened or skipped.
- Review completed.
- Count of candidate flags.
- Character length bucket.
- Whether the user edited the reviewed JD, as a boolean only.
Forbidden event properties:
- Original JD text.
- Reviewed JD text.
- Flagged terms.
- Placeholder-adjacent text.
- Company, client, employee, or project names.
## Security and privacy posture
The app should continue to state that job descriptions are sent to Anthropic for fit analysis after user review. The review step does not change that upstream processing fact.
The app should state that original and reviewed JD text are not intentionally stored by this app, and analytics must not include user-supplied text.
The review step should be described as risk reduction and transparency, not as anonymization, compliance certification, or legal advice.
## Resolved implementation decisions
- The scan runs entirely client-side in `src/lib/jd-review.ts`. It calls no network service.
- The review panel stays collapsed with a visible flag count badge. The user opens it manually.
- Bracketed replacements are applied one flag at a time, each with its own apply button, so the user can reject medium-confidence flags.
- The original pasted text is discarded once the user confirms the reviewed JD: the confirmed reviewed text overwrites the only component state that held the original.

## Implementation notes
- A trailing rollout or migration name (for example `Acme Bank rollout`) is treated as a client name, because a capitalized name in front of delivery work most often identifies the client. A leading project or program name (for example `Project Atlas`) is treated as an internal project.
- Medium-confidence adjacency rules are case-sensitive on purpose: real capitalization is the signal. Trigger words allow a sentence-start capital, but the proper-noun phrase must be genuinely capitalized, which keeps generic titles like `Project Manager` and functions like `reports to Engineering Operations` from being flagged.
- Allowlisted public tools and compliance domains (for example `Workday`, `Salesforce`, `AWS`, `SOC 2`, `ISO 27001`) are never flagged, even next to a trigger word.
