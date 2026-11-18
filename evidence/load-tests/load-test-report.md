# DSO303 Assignment 3 — Load Test, Bottleneck, Fix and Retest

**Status:** Test plan — no benchmark measurements have been supplied yet.

## Objective

Assess the requirement for **3,000 students beginning an exam within five minutes**. This is an arrival rate of approximately **10 new exam starts per second**, but the total request rate can be higher because each student also authenticates, loads exam content, and saves answers. Do not equate 10 starts/s with 10 total requests/s.

## Safety and environment

Use a test deployment, synthetic student accounts and dummy examination records. Obtain permission before generating load against shared infrastructure. Never test a production examination without authorization. Record whether results come from real AWS or Floci; Floci may not emulate realistic EC2 CPU/network and CloudWatch behavior.

## Required test evidence

Record the application endpoint and environment, generator/tool version, virtual-user schedule, duration, completed/failed requests, throughput, p50/p95/p99 latency, and HTTP error rate. Capture CloudWatch CPUUtilization, ALB TargetResponseTime and HTTPCode_Target_5XX_Count, RDS CPU/connections (where supported), and relevant application logs. If CloudWatch metrics are unavailable in the emulator, explicitly mark them unavailable rather than inventing screenshots.

## Test A — Baseline and bottleneck

1. Confirm the health endpoint and database are working; capture `evidence/load-tests/01-before-health.png`.
2. Generate a reproducible workload ramping to 3,000 exam starts across five minutes, or document the smaller scale actually achieved.
3. Capture generator summary as `02-baseline-load-results.png`.
4. Capture CloudWatch dashboard as `03-baseline-cloudwatch.png`.
5. Identify a bottleneck only when supported by both request symptoms and resource metrics; otherwise state **not demonstrated**.

| Metric | Baseline measured |
|---|---|
| Environment / URL | Not measured |
| Workload / users / duration | Not measured |
| Completed requests | Not measured |
| Error rate | Not measured |
| Throughput (requests/s) | Not measured |
| p95 response time | Not measured |
| EC2 CPU / RDS / ALB metric | Not measured |
| Demonstrated bottleneck | Not established |

## Test B — Apply one specific fix

Possible fixes **depending on the observed bottleneck**: increase EC2 instance capacity or ASG minimum, optimize database indexes/connection pooling, reduce expensive synchronous queries, or move noncritical marking work to SQS. Document exactly one applied change, why the evidence supports it, and its **new cost implication**.

**Actual fix applied:** Not yet selected.  
**Configuration before/after:** Not measured.  
**Estimated additional monthly cost:** Not yet calculated.

## Test C — Retest identical workload

Use the same endpoint behavior, workload, duration, and generator conditions as Test A. Capture `04-retest-load-results.png` and `05-retest-cloudwatch.png`.

| Metric | Before fix | After fix | Interpretation |
|---|---|---|---|
| Throughput | Not measured | Not measured | Pending |
| Error rate | Not measured | Not measured | Pending |
| p95 response time | Not measured | Not measured | Pending |
| Bottleneck metric | Not measured | Not measured | Pending |
| Monthly compute/database cost | Not calculated | Not calculated | Pending |

**Verdict:** Cannot conclude peak-load feasibility without measured results.

## Two additional reasoned load scenarios

### Scenario D — Concurrent autosave surge

**Risk:** Thousands of students save answers at the same time, saturating database writes and connection pools.  
**Expected signal:** Increased API p95, database CPU/connections, slow-query logs, or errors.  
**Proposed mitigation:** Batch or debounce saves where safe, index queries, tune connection pooling, and test durable write acknowledgement. Autosave must remain within the five-minute RPO target.  
**Status:** Reasoned scenario, not measured.

### Scenario E — Submission and marking queue spike

**Risk:** Many students submit together, causing SQS queue depth and marking delay to increase.  
**Expected signal:** ApproximateNumberOfMessagesVisible, oldest-message age, worker CPU, and marking completion delay.  
**Proposed mitigation:** Keep submission acknowledgement separate from marking, scale workers, configure DLQ/retries and idempotent processing. Account for extra worker costs.  
**Status:** Reasoned scenario, not measured.

## Final feasibility interpretation

A low Pricing Calculator estimate is not proof of performance. Update the cost report's peak-load verdict only after a bottleneck, mitigation, and retest are documented with actual measurements.
