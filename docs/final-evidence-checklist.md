# Assignment 3 — Evidence Review

| Requirement | Evidence / document | Assessment |
|---|---|---|
| Revised architecture and change log | `architecture/screenshots/final-revised-architecture-a3.png`, `architecture/change-log.md` | Present |
| Normal/exam calculator estimates | `evidence/cost-calculator/*.csv` | Present; partial infrastructure cost |
| Three optimization estimates | EC2, NAT/PrivateLink, S3 CSV/screenshots | Present; NAT/PrivateLink not equivalent |
| Singapore/Mumbai comparison | Calculator CSVs and three CloudPing runs | Present |
| Four failure scenarios | `evidence/failure-tests/` | Four simulated successful traces; RPO/RTO not measured |
| Load test | `evidence/load-tests/` | Multiple simulator settings; no proven bottleneck or fix/retest |
| CloudWatch performance evidence | No confirmed CloudWatch benchmark metrics | Not available |
| Five-year retention | Proposed S3 lifecycle strategy | Enforcement not verified |
| CLI / Terraform work | `evidence/aws-baseline/`, `evidence/terraform*` | Evidence present; distinguish from simulator |
| Final cost feasibility | `docs/cost-report.md` | Conditional due to incomplete pricing |

Do not describe simulator latency as recovery time, proposed mitigations as deployed fixes, or incomplete cost estimates as full total cost of ownership.