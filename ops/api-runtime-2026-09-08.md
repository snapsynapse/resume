# Compiled API startup repair

The production API smoke run [34309259671](https://github.com/snapsynapse/resume/actions/runs/34309259671) failed at commit `06da448`: both chat and fit analysis returned HTTP 500 before method rejection. Vercel marked the deployment ready, but runtime logs reported `ERR_MODULE_NOT_FOUND` for `src/data/ai-usage-snapshot.ts`, imported by emitted `sam-profile.js`.

The shared profile's `.ts` import supports the static generator's direct Node type-stripping path. Vercel emitted the imported module as `.js` while retaining `.ts` in the import. Its build logged TS5097 and still produced a ready deployment. The root compiler configuration also lacked the modern library declarations required by `Object.hasOwn`; referenced API-project options did not supply Vercel's root-config defaults.

The root TypeScript configuration now rewrites relative TypeScript extensions in emitted JavaScript and explicitly selects ES2022 with ES2023/DOM libraries. Source imports, profile content, dependencies, API behavior and provider configuration are unchanged.

## Regression and acceptance

`src/test/api-artifact.test.ts` emits the real API dependency closure using the root compiler options, then loads both emitted default handlers in a separate native Node process without provider credentials. It asserts GET returns 405 and requires clean compiler diagnostics. The existing test suite runs this check automatically in CI. The original configuration fails with the same missing-module error observed in production; the corrected configuration passes.

The actual Vercel CLI 59.11.7 build was also reproduced in a disposable checkout with TypeScript 5.8.3. Before the fix, native Node 24 could not load the emitted function. After the fix, both compiled handlers returned 405, the compiler diagnostics cleared, and the static-site build passed. This checks the deployment packaging path separately from the lightweight CI regression.

Production acceptance requires the exact deployed commit, GET method rejection, successful chat and fit-analysis POST smoke checks, and the existing prompt-boundary evaluation. A ready deployment or passing frontend build alone is insufficient. The [Live API eval workflow](https://github.com/snapsynapse/resume/actions/workflows/eval-live.yml) records deployment-triggered results; select the run matching the intended commit.

## Delivery record

2026-09-08 guide delivery pushed (06da448, repair 062e750); post-deploy Siteline reconcile: not run, no receipt

## Delivery record

2026-09-08 guide delivery pushed (06da448, repair 062e750); post-deploy Siteline reconcile: not run, no receipt
