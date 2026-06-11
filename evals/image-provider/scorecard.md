# Domestic Image Provider Scorecard

Date: 2026-06-11

Selected adapter: `volcengine-ark`

API shape: OpenAI-compatible Responses API at `https://ark.cn-beijing.volces.com/api/v3/responses`, configured through `ARK_API_KEY`, `ARK_MODEL`, and `ARK_RESPONSES_ENDPOINT`.

## Hard Gates

| Gate | Status | Notes |
| --- | --- | --- |
| Mainland-accessible service endpoint | Pass | Beijing Ark endpoint configured. |
| No private images committed to Git | Pass | `cases.json` stores only environment variable names. |
| API key excluded from code | Pass | Runtime reads `ARK_API_KEY`; no key committed. |
| Adapter maps provider failures | Pass | 429/5xx => transient; 400/403 => safety/request rejection; malformed image output => permanent. |
| Real 30-run image quality evaluation | Pending | Requires local private image paths and paid provider calls. |
| Legal/data handling review | Pending | Must be signed off before public launch. |

## Scoring Rubric

- Identity consistency: 30%
- Outfit fidelity: 30%
- Four-panel stability: 15%
- Compliance/data residency: 15%
- Cost, P95 latency, and failure rate: 10%

## Runbook

1. Rotate any API key shared outside the secret manager.
2. Put private authorized evaluation photos outside the repository.
3. Export `ARK_API_KEY`, `IMAGE_PROVIDER=volcengine-ark`, and `COURTFIT_EVAL_CASE_XX_*` image path variables.
4. Run:

```bash
PATH=/tmp/courtfit-node/bin:/usr/bin:/bin /tmp/courtfit-node/bin/node ./node_modules/tsx/dist/cli.mjs evals/image-provider/run.ts
```

5. Score the generated `.eval-output/*.png` files manually using the rubric above.
6. Do not launch with this provider unless no hard gate fails and aggregate quality is acceptable.

## Current Decision

The codebase is integrated with the Ark Responses API adapter but the product decision remains provisional until the private 30-run evaluation is completed. This avoids claiming quality or compliance results that have not been measured.
