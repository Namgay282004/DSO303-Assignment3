# Assignment 3 — Final Evidence Checklist

This checklist distinguishes **observed evidence**, **estimates**, and **unverified requirements**.

| Requirement | Evidence | Status |
|---|---|---|
| Revised architecture and changes | `architecture/screenshots/final-revised-architecture-a3.png`; `architecture/change-log.md` | Documented |
| AWS services and justification | `docs/services.md`; `docs/cost-report.md` | Documented |
| Normal/exam monthly and annual costs | `docs/cost-report.md`; calculator CSVs and PNGs in `evidence/cost-calculator/` | Partial baseline: $83.09 normal, $138.71 exam, $1,108.32 annual |
| Three cost optimizations | EC2 Savings Plan, PrivateLink scenario, S3 lifecycle CSVs/PNGs | Estimated; NAT/PrivateLink not equivalent |
| Singapore/Mumbai comparison | Calculator and Bhutan-origin ping evidence | Documented; browser latency is not an SLA |
| Four failure scenarios | `infra/failure-scenarios.md`; `evidence/failure-tests/` | Four successful modeled HTTP traces |
| Simulator load scenarios | `evidence/load-tests/` | Simulator settings, not measured sustained throughput |
| Real local load and database investigation | `evidence/load-tests/load-test-report.md`; `evidence/local-load-test/` | k6 tests completed; WAL waits observed |
| Measured optimization experiment | `evidence/local-load-test/08-wal-experiment-results.png` | Improved one local run, **rejected for production** |
| CloudWatch-proven bottleneck and safe fix/retest | No verified benchmark | **Outstanding gap** |
| 3,000 exam starts within five minutes | No end-to-end proof | **Outstanding gap** |
| RPO ≤ 5 minutes / RTO ≤ 1 hour | Simulated failover paths only | **Not measured** |
| Five-year retention | Proposed S3 lifecycle | **Not fully validated** |
| Terraform/AWS baseline | `terraform/`, `evidence/terraform/`, `evidence/aws-baseline/` | Supporting artifacts; plan is not proof of deployment |

## Submission notes

- AWS Pricing Calculator figures are **partial estimates**, not actual billing or complete two-AZ total cost.
- Architecture Lab **$281.57/month** and calculator **$83.09/month** are different modeled scopes.
- A modeled **134 ms request duration** is not recovery time.
- `synchronous_commit=off` is **not a production recommendation** for exam answers.
- Exclude credentials, generated student tokens, Terraform state and plan binaries, dependencies, and backups.