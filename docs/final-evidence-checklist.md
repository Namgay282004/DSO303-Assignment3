# Assignment 3 : Final Evidence and Marking Checklist

**Basis:** Official Assignment 3 brief (10 marks total); reviewed against committed repository ZIP on 21 November 2026. "Collected" means files exist, **not** that every production target was proven.

| Rubric criterion | Marks | Evidence in original repository | Remaining qualification |
|---|---:|---|---|
| Revised architecture / single points of failure / change log | 2 | `architecture/screenshots/final-revised-architecture-a3.png`; `architecture/change-log.md`; simulator screenshots | Confirm target architecture and accepted SPOFs clearly distinguished from deployed Mumbai state |
| Cost/service documentation, hidden costs, four comparisons, regional analysis | 2 | `docs/cost-report.md`; `docs/services.md`; `evidence/cost-calculator/*.csv`; Bhutan latency screenshots | Complete service-level two-AZ bill, hidden charges and student denominator not fully established |
| Both profiles + ≥3 cost optimizations | 2 | Singapore normal/exam CSVs; Savings Plan, NAT/PrivateLink, S3 lifecycle exports | Different optimization scopes; do not add as guaranteed savings |
| Four failure scenarios with RPO/RTO assessment and fixes | 2 | `evidence/failure-tests/*`; `infra/failure-scenarios.md`; `docs/recovery-analysis.md` | Four modeled routes passed; production scenario-specific RPO/RTO not measured |
| CloudWatch bottleneck, fix/retest, two reasoned load scenarios | 2 | `evidence/cloudwatch/*`; `evidence/load-tests/*`; local autosave evidence | CPU bottleneck not proven; policy did not scale out; SQS surge lacks timed queue-drain run |

## Key screenshots and raw artifacts

- **Local 3,000 starts:** `evidence/load-tests/local-exam-start/07-retest-peak-load-results.png`, `08-retest-database-verification.png`, `07-retest-summary.json`.
- **Four modeled faults:** `evidence/failure-tests/02-az-a-outage-part2.png`, `03-az-b-outage-part2.png`, `04-rds-primary-result-part1.png`, `05-ec2-failover-part1.png`.
- **Real AWS monitoring:** `evidence/cloudwatch/alb-bottleneck-metrics.png`, `autoscaling-policies.png`, `18-cpu-target-tracking-policy-form.png`, `optimization-retest-cloudwatch.png`, and `10-bottleneck-summary.json`.
- **Local backend/DB:** `evidence/recovery-tests/local-backend/08-exam-answer-recovery-results.png`, `local-postgres/01-postgres-recovery-results.png`.
- **Backup/WAL:** `evidence/recovery-tests/backup-restore/04-timed-restoration-results.png`, `wal-pitr/02-wal-replay-results.png`, `wal-pitr/04-recovery-timing-results.png`, `wal-pitr/04-recovery-timing-results.json`.
- **Pricing:** `evidence/cost-calculator/normal-month-singapore.png`, `ezam-month.png`, `normal-month-mumbai.png`, three optimization screenshots and CSVs.

## Final submission checks

- [ ] Merge the Markdown files from the report ZIP into the original repository, keeping the same relative paths.
- [ ] Verify GitHub renders all image links after merge.
- [ ] Confirm cost calculator links, date checked, and any full-service cost breakdown available to the tutor.
- [ ] Keep simulator, local Docker and real AWS results explicitly separate.
- [ ] Do not state 134 ms as RTO or imply local WAL storage is off-host disaster recovery.
- [ ] Confirm the tutor's permission to replace the official brief's demo-video requirement with detailed written evidence.
- [ ] Verify no secrets, private backups or PostgreSQL data directories are committed.
- [ ] Check final Git status and open Markdown pages in GitHub before submission.