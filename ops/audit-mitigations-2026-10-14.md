# Audit mitigation checkpoint, 2026-10-14
Scope: repository-local implementation of the recommended sequence in [the regression-check plan](audit-regression-checks-2026-10-14.md), following [the original audit](code-audit-2026-10-14.md). Sam authorized deterministic validation and a local commit. Push, deployment, Vercel changes, and model-backed verification remain outside this authorization. Biography additions remain parked.
## Implemented sequence
1. A1, telemetry: removed the composed role label from chat events and company names from experience-toggle events. The central sanitizer allowlists custom application metadata before capture and at the SDK boundary, including nested person-property filtering. URL query/hash stripping remains in place. Coarse metadata positive controls and context-disclosure negative controls pass.
2. A2, typecheck: retained the effective referenced-project runner from the checks commit. Aligned application library definitions with the existing ES2023 definitions and supported browser baseline, corrected the portrait JSX property, typed the hero context fixture, and aligned PostHog types with its runtime entrypoint. Application, tooling, and API projects pass. The root Vercel emit configuration is preserved.
3. A3/A4, runtime shapes: added the shared dependency-free `src/lib/fit-result.ts` validator. Both the endpoint and client require the declared fields, verdict enum, strings, arrays, nested items, and exact keys before success or rendering. Both POST handlers treat parsed JSON as unknown and reject null, arrays, and scalars with structured 400 responses. Invalid fit output uses the existing 502 boundary. Prompt semantics are unchanged.
4. A5, cancellation: the adapter watches response close and request aborted, removes listeners, and preserves healthy response EOF and normal POST completion. The provider-backed Web stream consumes on demand and explicitly aborts the SDK stream on cancellation. The browser fetch carries an AbortSignal and aborts on unmount, without emitting a sample fallback for intentional cancellation. Real localhost HTTP checks cover raw and pre-parsed request bodies and response-consumer disconnection.
5. Documentation: corrected the nine-word PII scan window, existing script hashes, style-only CSP inline allowance, effective type gate, and explicit live-eval hold. Replaced stale July synchronization claims with pointers to delivery evidence. The scheduled usage-refresh dependency audit was already added in the preceding checks commit and remains enforced locally.
## Deterministic acceptance
| Check | Result |
|---|---|
| Complete Vitest suite | 370 passed in 27 files, zero failed, zero skipped |
| Focused `npm run eval:audit` | 52 passed, zero failed, zero skipped |
| `npm run typecheck` | All three referenced projects passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; five static crawl pages generated and metadata validation passed |
| Dependency audit | Zero reported vulnerabilities at every severity |
| Architecture mirror | All five perspectives validated; `.omm/` remains ignored |
The full suite includes the reveal-resistant PII checks and native Node loading of emitted API dependency closures. The root compiler settings still produce loadable handler imports, including the shared validator. No provider or Redis requests were made by the tests. Localhost HTTP tests required socket access outside the sandbox; no production endpoint was contacted.

Three existing/new fixtures were corrected to match their intended contract: the fake stream reader now exposes `releaseLock`; the disconnect test triggers close after the first delivered write rather than relying on prefetch timing; the malformed fit test permits the existing `onResult(null)` reset but rejects publication of a malformed result. No skip, expected-failure marker, compiler suppression, or relaxed production boundary was added.

Machine-readable test and audit receipts are retained in ignored `private/review-2026-10-14/audit-mitigations/`. Local runtime is Node 26.10.0; CI specifies Node 22 and was not dispatched. These local results establish deterministic acceptance, not remote CI or provider semantics.
## Remaining delivery and evidence boundaries
All five audited defects are repaired in the local candidate. Production remains on the last recorded delivered source, `1a29d8ccf6da2efe935d4238fcb317a33512494f`, and retains the audited baseline until a separately authorized release. The preceding checks-only commit is `1335055122de54ff3e783af04ebbbf390d88cf88`; its red baseline remains documented for provenance.

Next release consideration, if Sam requests it: push the reviewed local commits, require the actual remote deterministic gate, deploy the exact accepted source, and verify static/read-only identity and presentation. Keep the automatic `eval-live.yml` workflow disabled while model verification is held. A deterministic pass does not release that hold.

Historical telemetry contents were not inspected or deleted. Any decision to review historical events or request cleanup is separate from this repair. Submitted-PDF acceptance, audit-superlative substantiation, draft-PR disposition, optional accessibility/browser coverage, and biography candidates remain in their existing queues. No new claim or biography content was published.
