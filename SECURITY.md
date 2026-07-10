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
- PII and compensation exposure is mechanically gated by [src/test/pii-scan.test.ts](src/test/pii-scan.test.ts), which scans committed repository content for personal phone shapes, SSN shapes, DOB shapes, dollar-amount figures, compensation-range notations, and a hash-based blocklist of candidate-specific residential and contact literals.

## Reveal-resistant PII evals

A public PII scan can defeat itself if the exact blocked value appears in its regex, fixture, allowlist, or failure output. This repository therefore exposes the protection categories without publishing the candidate-specific values being protected.

Attacker model: the scan protects against a casual reader of source or CI output incidentally discovering a candidate-specific value. It does not protect against a motivated offline dictionary attack. The blocked inputs include low-entropy values, so unsalted SHA-256 is a source-reveal and log-reveal control, not a cryptographic secrecy boundary. Using an HMAC would move that boundary to a CI secret and would not fit this public-repository threat model.

Design:

- Generic shape patterns cover US-format phone numbers, SSN-shaped strings, DOB-shaped strings, dollar figures, and compensation ranges.
- Candidate-specific residential and contact values are stored only as an unordered set of SHA-256 digests of normalized values.
- Scan-time tokenization checks one-to-four-word n-grams and normalized 10-digit phone windows against the digest set.
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

- Run `npm run eval:prompts` in CI against a staging deployment with the configured provider key.
- Add regression cases for claims inflation, false credential requests, and malicious job descriptions.
- Add structured refusal fields to fit assessment output for clearly abusive or irrelevant inputs.
- Add request-level abuse monitoring that records counts and outcomes without storing submitted text.

## Dependency and build posture

- The live UI intentionally avoids carrying unused component-library surface area.
- Dependency audit is enforced in CI with `npm audit --audit-level=high`.
- Static crawl pages are generated at build time from `src/data/sam-profile.ts`.
- Metadata validation checks sitemap entries, JSON files, security headers, no-JS fallback content, canonical URLs, and URL policy.
- Metadata validation checks the assistant guide for presence, ASCII-only content, an 8 KiB size ceiling, required GuideCheck sections, and action blocks.

## CSP note

The current CSP allows inline scripts/styles because Vite, the static no-JS fallback, and generated static pages still depend on inline JSON-LD and inline route styles. A stricter future version should replace this with nonces or hashes for JSON-LD and generated CSS. The current policy still blocks framing, object embeds, external scripts, and broad browser permissions.
