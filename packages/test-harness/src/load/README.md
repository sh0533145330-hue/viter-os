# Load Tests

This directory ships the k6 templates used by EP-19 to validate VitaOS SLOs
(01-v1-master-spec.md §31.4):

| Surface | Target |
| --- | --- |
| API gateway | p99 < 2s, error rate < 0.1% |
| Agent runtime | p99 < 30s |
| Cross-source query | p99 < 5s |
| Voice setup | < 2s to first audio |

## Running

```sh
k6 run \
  --env BASE_URL=https://staging.api.example.com \
  --env TOKEN=$VITA_LOAD_TOKEN \
  --out json=results.json \
  k6-script.js.template
```

The template uses `ramping-vus` for ingest scenarios and
`constant-arrival-rate` for steady-state query scenarios. Thresholds are
encoded inline and `k6 run` exits non-zero if any are violated, so the script
can be wired straight into the nightly CI job.

## Baseline tracking

Each run writes `results.json`; the nightly job uploads this artifact and the
EP-19 dashboard renders the p99 trend across runs. Regressions >10% post a
Slack alert and block release sign-off.
