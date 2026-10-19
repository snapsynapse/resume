# Security

This repo is a public, inspectable resume application with two unauthenticated AI-backed endpoints. The design goal is to show judgment about privacy, cost control, prompt-injection boundaries, and operational limits without pretending the app handles sensitive enterprise data.

## Contact

Report security issues to sam@sam-rogers.com.

Please include:

- Affected route or file
- Reproduction steps
- Impact
- Whether user-supplied text, API keys, logs, or third-party services are involved

## Public endpoints

| Endpoint | Purpose | Authentication | Data received | Storage intent |
|---|---|---|---|---|
| `/api/chat` | Answer questions about Sam Rogers' resume, evidence, gaps, and role fit. | None | Chat messages and optional role context. | No intentional storage by this app. |
| `/api/analyze-fit` | Compare a pasted job description against Sam's profile. | None | Pasted job description. | No intentional storage by this app. |
| `/api/limits` | Publish machine-readable API limit discovery. | None | None. | No user-submitted data. |
| `/api/role-context` | Return the public-safe part of a tailored application context for a `company` and `target` pair. | None | Two URL query parameters. | Nothing stored; no-store response. |

The two AI-backed endpoints send user-supplied text to the configured cloud LLM provider for analysis. The current production provider is Anthropic. Visitors should not submit confidential, proprietary, regulated, or unreleased role data.

## Job description business context review

The fit assessment provides an optional, on-by-default review step before `/api/analyze-fit` receives a pasted job description. The review is not PII anonymization and is not a legal guarantee. Its purpose is to help internal HR users preserve useful role context while reviewing non-public business details such as confidential search context, internal requisition codes, unreleased initiatives, non-public client names, internal compensation planning, and security-sensitive operational details.

The scanner ([src/lib/jd-review.ts](src/lib/jd-review.ts)) is deterministic and runs entirely client-side: it calls no network service, so neither the original nor the reviewed text leaves the browser during review, and only the user-confirmed reviewed text is posted to `/api/analyze-fit`. On confirmation the original text is discarded from component state. Analytics records review panel opened/skipped/completed, flag counts, length buckets, and edit booleans, but never original JD text, reviewed JD text, flagged terms, placeholders with surrounding text, company names, client names, employee names, or project names.

## Production controls

- Model selection is explicit through provider configuration. The current Anthropic implementation uses `ANTHROPIC_MODEL`, defaulting to `claude-opus-4-8`.
- API keys are server-side only and must never use a `VITE_` prefix.
- Request bodies are bounded by character limits before upstream model calls.
- Chat history is capped at 20 turns.
- Rate limiting uses Upstash Redis when configured.
- Production fails closed with HTTP 503 if Upstash rate-limit configuration is missing.
- Non-success API responses follow [Graceful Boundaries](https://gracefulboundaries.dev/) Level 2. They include `error`, `detail`, and `why`; 429 responses also include `limit` and `retryAfterSeconds`; `/api/limits` publishes discovery metadata.
- `/.well-known/assistant-guide.txt` follows [GuideCheck](https://guidecheck.org/) Level 3 for human-verifiable assistant instructions, approval gates, and sensitive-context handling.
- API responses set `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Global headers include CSP, `frame-ancestors 'none'`, `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- PostHog uses the no-external SDK entrypoint; CSP permits ingestion and remote configuration hosts but does not allow PostHog-hosted script injection.
- PostHog analytics, when configured, is cookieless, explicit-event-only, and must not include user-supplied text.
- Custom analytics properties are allowlisted centrally; contextual labels and employer selections are omitted before capture.
- Both POST handlers require a non-null object before field access. Fit results are validated against a shared runtime shape before API success and client rendering.
- Chat cancellation propagates from browser unmount through response disconnection to the provider stream. Normal POST completion does not cancel a healthy response.
- PII and compensation exposure is mechanically gated by [src/test/pii-scan.test.ts](src/test/pii-scan.test.ts), which scans committed repository content for personal phone shapes, SSN shapes, DOB shapes, dollar-amount figures, compensation-range notations, and a hash-based blocklist of candidate-specific residential and contact literals, pursued employer labels, and applied-for role titles.
- Employer application presets are server-side only (`ROLE_CONTEXT_PRESETS` or `ROLE_CONTEXT_PRESETS_FILE`, never `VITE_`-prefixed) and never committed. The repository carries only a fake fixture.

## Role context data flow

A tailored link carries `?company=<key>&target=<target>`. What happens to those two values:

- Browser: the client reads them from the URL and calls `GET /api/role-context` with the same two parameters. It stores nothing. PostHog's `sanitize_properties` strips the query string from `$current_url` and `$initial_current_url` before any event leaves the browser, so the parameters never reach analytics. Referrers are reduced to their origin. The `page_viewed` event records only whether a tailored selector was present (`tailored: true/false`), never its value. The hero shows a visible notice naming the tailored view with a one-click neutral version.
- `/api/role-context`: looks the pair up in the private preset map loaded from the environment and returns only the public-safe subset (label, hero titles, suggested questions, source role, location context). The response is `Cache-Control: no-store`. The app does not log the parameters. An unknown or absent `company` key returns the target-only context with HTTP 200, byte-identical to a typo.
- `/api/chat`: receives the same selection in the request body, resolves it server-side, and folds the entry's prompt delta into the system prompt. The prompt delta is the only field that never leaves the server. Like all chat content it is sent to the cloud LLM provider, so it must contain only material that would be acceptable if disclosed.
- Nothing about the selection is persisted by this app. The parameters are positioning selectors for the reader, not identifiers.

Residual: the `company` key space is enumerable in principle. Guessing a real key reveals that a preset exists for that employer, and its public-safe fields, nothing more. The endpoint returns the same shape and status for real and unknown keys, does not list keys, and holds no prompt text, so the exposure from a correct guess is bounded to what the tailored link's intended reader already sees.

## Reveal-resistant PII evals

A public PII scan can defeat itself if the exact blocked value appears in its regex, fixture, allowlist, or failure output. This repository therefore exposes the protection categories without publishing the candidate-specific values being protected.

Attacker model: the scan protects against a casual reader of source or CI output incidentally discovering a candidate-specific value. It does not protect against a motivated offline dictionary attack. The blocked inputs include low-entropy values, so unsalted SHA-256 is a source-reveal and log-reveal control, not a cryptographic secrecy boundary. Using an HMAC would move that boundary to a CI secret and would not fit this public-repository threat model.

Design:

- Generic shape patterns cover US-format phone numbers, SSN-shaped strings, DOB-shaped strings, dollar figures, and compensation ranges.
- Candidate-specific residential and contact values are stored only as an unordered set of SHA-256 digests of normalized values.
- Scan-time tokenization checks one-to-nine-word n-grams and normalized 10-digit phone windows against the digest set.
- Violation output reports only file, line, and pattern category. It never echoes a matched substring.
- Allowlisted exceptions are stored as full-line digests so the allowlist does not disclose the protected context.
- Public name, email, and region assertions act as positive controls so an empty scan cannot pass silently.
- The digest order is intentionally non-semantic and can be rotated when entries are added.

Scope: the scan covers committed repository content, including `INTENT.md` and `.github`. User-submitted chat or job-description text is governed by request boundaries and the job-description review scanner, not this repository-content eval.

Verification: run `npm run test` and inspect [src/test/pii-scan.test.ts](src/test/pii-scan.test.ts). A reviewer can confirm that the test contains only generic shapes and unlabeled digests and that failure paths do not print matched values.

## Prompt-injection posture

The AI features are not trusted execution surfaces. They only summarize and compare user text against a fixed public profile corpus.

Current boundaries:

- The system prompt instructs the model not to invent unsupported facts.
- Fit analysis returns a constrained JSON schema.
- Prompt-eval scripts include adversarial prompt-injection cases for private address, fake credentials, sensitive-material handling, sensitive-material approval, production-engineering overclaiming, role-band calibration, and instruction override attempts.
- The app displays model output as text, not executable HTML.

Future hardening:

- Resume live prompt verification only after explicit authorization releases the model-backed verification hold. The automatic `eval-live.yml` workflow was disabled manually during the 2026-10-14 delivery and remains held.
- Add regression cases for claims inflation, false credential requests, and malicious job descriptions.
- Add structured refusal fields to fit assessment output for clearly abusive or irrelevant inputs.
- Add request-level abuse monitoring that records counts and outcomes without storing submitted text.

## Dependency and build posture

- The live UI intentionally avoids carrying unused component-library surface area.
- Dependency audit is enforced in CI with `npm audit --audit-level=high`.
- The scheduled usage-refresh workflow enforces the dependency audit before its publishing step, alongside the other deterministic checks.
- `npm run typecheck` explicitly checks every referenced application, API, and tooling project. Offline fixture tests prove deliberate type errors fail the gate.
- Static crawl pages are generated at build time from `src/data/sam-profile.ts`.
- Metadata validation checks sitemap entries, JSON files, security headers, no-JS fallback content, canonical URLs, and URL policy.
- Metadata validation checks the assistant guide for presence, ASCII-only content, an 8 KiB size ceiling, required GuideCheck sections, and action blocks.

## CSP note

The current CSP permits same-origin scripts and explicit hashes for inline JSON-LD; it does not permit script `unsafe-inline`. Styles still permit `unsafe-inline` for inline route styles and runtime component styling. Replacing that style allowance would require a separate compatibility review. The policy blocks framing, object embeds, unlisted external scripts, and broad browser permissions.
