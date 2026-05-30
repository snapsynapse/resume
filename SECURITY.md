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

Both endpoints send user-supplied text to Anthropic for analysis. Visitors should not submit confidential, proprietary, regulated, or unreleased role data.

## Job description business context review

The fit assessment provides an optional, on-by-default review step before `/api/analyze-fit` receives a pasted job description. The review is not PII anonymization and is not a legal guarantee. Its purpose is to help internal HR users preserve useful role context while reviewing non-public business details such as confidential search context, internal requisition codes, unreleased initiatives, non-public client names, internal compensation planning, and security-sensitive operational details.

The scanner ([src/lib/jd-review.ts](/Users/snap/Git/resume/src/lib/jd-review.ts)) is deterministic and runs entirely client-side: it calls no network service, so neither the original nor the reviewed text leaves the browser during review, and only the user-confirmed reviewed text is posted to `/api/analyze-fit`. On confirmation the original text is discarded from component state. Analytics records review panel opened/skipped/completed, flag counts, length buckets, and edit booleans, but never original JD text, reviewed JD text, flagged terms, placeholders with surrounding text, company names, client names, employee names, or project names.

## Production controls

- Model selection is explicit through `ANTHROPIC_MODEL`, defaulting to `claude-opus-4-8`.
- API keys are server-side only and must never use a `VITE_` prefix.
- Request bodies are bounded by character limits before upstream model calls.
- Chat history is capped at 20 turns.
- Rate limiting uses Upstash Redis when configured.
- Production fails closed with HTTP 503 if Upstash rate-limit configuration is missing.
- API responses set `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Global headers include CSP, `frame-ancestors 'none'`, `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- PostHog analytics, when configured, is cookieless, explicit-event-only, and must not include user-supplied text.

## Prompt-injection posture

The AI features are not trusted execution surfaces. They only summarize and compare user text against a fixed public profile corpus.

Current boundaries:

- The system prompt instructs the model not to invent unsupported facts.
- Fit analysis returns a constrained JSON schema.
- Prompt-eval scripts include jailbreak-style cases for private address, fake credentials, sensitive-material handling, production-engineering overclaiming, and instruction override attempts.
- The app displays model output as text, not executable HTML.

Future hardening:

- Run `npm run eval:prompts` in CI against a staging deployment with `ANTHROPIC_API_KEY`.
- Add regression cases for claims inflation, false credential requests, and malicious job descriptions.
- Add structured refusal fields to fit assessment output for clearly abusive or irrelevant inputs.
- Add request-level abuse monitoring that records counts and outcomes without storing submitted text.

## Dependency and build posture

- The live UI intentionally avoids carrying unused component-library surface area.
- Dependency audit should pass with `npm audit`.
- Static crawl pages are generated at build time from `src/data/sam-profile.ts`.
- Metadata validation checks sitemap entries, JSON files, security headers, no-JS fallback content, canonical URLs, and URL policy.

## CSP note

The current CSP allows inline scripts/styles because Vite, the static no-JS fallback, and generated static pages still depend on inline JSON-LD and inline route styles. A stricter future version should replace this with nonces or hashes for JSON-LD and generated CSS. The current policy still blocks framing, object embeds, external scripts, and broad browser permissions.
