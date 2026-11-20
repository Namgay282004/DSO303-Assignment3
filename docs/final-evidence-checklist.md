# Evidence index and assessment traceability

This index maps the five assessment areas to the actual source records and reports. It is a navigation aid, not a replacement for the main report.

| Assessment area | Report section | Principal evidence |
|---|---|---|
| Revised architecture and design rationale | [Final report §2](assignment3-final-report.md) | `architecture/screenshots/final-revised-architecture-a3.png`, `architecture/change-log.md` |
| Services, feasibility and trade-offs | [Final report §3](assignment3-final-report.md) | `docs/cost-report.md`, `evidence/cost-calculator/` CSV exports and screenshots, Bhutan ping screenshots |
| Cost estimates and three optimization scenarios | [Final report §3](assignment3-final-report.md) | Normal/exam-month exports, Savings Plan, NAT/PrivateLink and S3 lifecycle evidence |
| Four failure simulations and recovery assessment | [Final report §4](assignment3-final-report.md) | `infra/failure-scenarios.md`, `evidence/failure-tests/` screenshots |
| Performance, bottleneck investigation and retest | [Final report §5](assignment3-final-report.md) | `evidence/load-tests/`, `evidence/local-load-test/`, `evidence/cloudwatch/` and `cloudwatch-analysis.md` |

## Submission evidence notes

- The November 20 AWS retest measured 559 requests, 0% failures and 434.51 ms p95. Its original terminal output and JSON summary are on the student's laptop and can be added under `evidence/cloudwatch/`.
- The CPU target-tracking policy was configured at 50% CPU; the activity history did not show a scale-out during the two-minute retest.
- Simulator recovery traces and local database tests should be interpreted within their respective environments.
- Check the main report in VS Code Markdown Preview to view all embedded figures.
