# Assignment 3 : Load Simulation, Bottleneck Investigation, Optimization and Retest

## Workload objective

The exam requirement is **3,000 students starting within five minutes**, or approximately **10 exam starts/second** on average. This is not the same as total HTTP request throughput, because each student may generate several requests.

## Simulation method and observed results

AWS Architecture Lab request simulations were performed using the revised architecture and `GET /api/exams/current`.

| Simulator setting | Observed HTTP status | Modeled request duration | Trace |
|---|---|---|---|
| 1 req/s | 200 | 134 ms | 9/9 steps |
| 10 req/s | 200 | 134 ms | 9/9 steps |
| 100 req/s | 200 | 134 ms | 9/9 steps |
| 10× spike | 200 | 134 ms | 9/9 steps |
| 100× spike | 200 | 134 ms | 9/9 steps |

The settings were **simulator inputs**, not independently measured sustained requests per second. The identical response durations mean that the simulation did not show performance degradation or demonstrate 3,000 successful exam starts in five minutes.

![Low-load simulation](../../evidence/load-tests/01-low-load.png)

*Low-load simulation.*
![High-load simulation](../../evidence/load-tests/02-high-load.png)

*High-load simulation.*
![Spike-load simulation](../../evidence/load-tests/03-spike-load.png)

*Spike-load simulation.*

## Architecture Analysis: potential bottleneck

The Architecture Analysis identified **database connection and throughput contention**, with multiple compute components accessing the RDS database without a dedicated proxy/cache layer. This is a **predicted risk**, not a bottleneck measured by CPU, connection count, queue length, p95 latency, or errors.

![Architecture Analysis: predicted database contention](../../evidence/load-tests/database-bottleneck.png)

*Architecture Analysis: predicted database contention.*

### Proposed mitigation : not deployed

Consider application-side PostgreSQL connection pooling, query/index optimization, or **RDS Proxy** if connection spikes warrant its additional expense. Recheck costs, application connection limits, and security. A genuine fix/retest would require the same workload before and after deployment with measured throughput, errors, p95, and RDS/ALB/EC2 metrics.

**Production-safe fix applied:** None.  
**Measured experimental improvement:** Yes, in the isolated local database; rejected for production durability.  
**CloudWatch load-test evidence:** Collected in real AWS Mumbai; see `../cloudwatch/cloudwatch-analysis.md`. This local-only section describes a separate database experiment.  
**Peak-load requirement verified:** No.

## Architecture analysis and configuration risks

![Simulator architecture analysis scores](../../evidence/load-tests/analysis-scores.png)

*Simulator architecture analysis scores.*
![Simulator single-point-of-failure warning](../../evidence/load-tests/single-point-of-failure.png)

*Simulator single-point-of-failure warning.*
![Simulator configuration findings](../../evidence/load-tests/configuration-issues.png)

*Simulator configuration findings.*

The simulator reported Availability **100%**, Resilience **45%**, Fault Tolerance **100%**, Scalability **80%**, and Security & Isolation **85%**. Its RDS standby warning did not align with the successful simulated RDS failover. Other findings concerned missing or mismatched networking, message-flow, IAM, and HTTPS connections. These should be reviewed before deployment.

## Two additional reasoned scenarios

### Concurrent autosave surge
Thousands of students may save answers together. **Expected risk:** elevated RDS connections, write latency, or failed saves. **Proposed mitigation:** bounded connection pools, indexed writes, safe retry/idempotency, and durable acknowledgements. Test autosave against the five-minute RPO objective. **Partially investigated through local k6 testing (up to 100 VUs), not at the required 3,000-student scale.**

### Submission and marking surge
Simultaneous submissions may increase SQS queue depth and marking delay. **Expected risk:** worker backlog and delayed result processing. **Proposed mitigation:** SQS buffering, worker scaling, DLQ, retries, and idempotent processing. **Simulated outcome (no timed recovery measurement).**


## Local k6 Load Testing and PostgreSQL Bottleneck Investigation

This section supplements the AWS Architecture Lab simulations with
real HTTP load tests against an isolated local PostgreSQL database
and Node.js backend.

The tests were performed locally, not on the deployed AWS infrastructure.
Therefore, the results must not be presented as AWS CloudWatch measurements.

### Test environment

- Tool: k6 HTTP load testing
- Backend: Node.js/Express, localhost port 3002
- Database: PostgreSQL 16, isolated database `university_exams_loadtest`
- Workload: Authenticated examination-answer autosave
- Test users: 100 dedicated students with separate examination attempts
- Maximum virtual users: 100
- Endpoint: `POST /api/attempts/answers`

The original examination database was not used for these experiments.

### Baseline and stress-test results

| Test | Maximum VUs | Requests | Throughput | p95 latency | HTTP failures |
|---|---:|---:|---:|---:|---:|
| Read-only baseline | 50 | 3,282 | 21.79 req/s | 7.43 ms | 0% |
| Authenticated autosave | 50 | 3,252 | 21.64 req/s | 22.14 ms | 0% |
| Autosave stress | 100 | 7,000 | 46.40 req/s | 19.10 ms | 0% |
| Autosave burst | 100 | 43,350 | 722.48 req/s | 186.89 ms | 0% |
| Monitored burst with wait events | 100 | 38,843 | 647.38 req/s | 243.87 ms | 0% |

The baseline and stress scripts included pauses between requests.
The burst script removed the pause, creating a substantially higher
request rate. Results should therefore be compared within equivalent
workload configurations.

![Read-only baseline results](../local-load-test/01-baseline-results.png)

![Authenticated autosave baseline](../local-load-test/02-autosave-before.png)

![Autosave stress test](../local-load-test/03-autosave-stress-results.png)

![Autosave burst results](../local-load-test/04-autosave-burst-results.png)

### PostgreSQL monitoring and bottleneck evidence

The Node.js PostgreSQL connection pool used its default maximum
of ten connections. During the monitored burst, the database reached
ten connections.

PostgreSQL wait-event sampling recorded:

| Observed wait event | Sample observations |
|---|---:|
| Active / LWLock / WALWrite | 282 |
| Active / IO / WALSync | 70 |
| Idle / Client / ClientRead | 256 |
| Idle in transaction / Client / ClientRead | 227 |

No row-lock waits were captured during the monitored burst.

The WALWrite and WALSync observations indicate that transaction-log
writing and synchronization contributed to database activity under
heavy autosave traffic. However, wait-event samples do not directly
measure how much HTTP response time was caused by each event.

The ten-connection pool limit alone does not establish a pool
bottleneck. Similarly, idle ClientRead waits are not evidence of
database lock contention.

![Live PostgreSQL monitoring](../local-load-test/06-live-db-monitoring.png)

![PostgreSQL wait-event investigation](../local-load-test/07-postgresql-wait-events.png)

### Experimental optimization: asynchronous commit

An isolated database experiment compared the same 100-VU,
60-second autosave burst workload with PostgreSQL
`synchronous_commit` enabled and disabled.

| Metric | Before: on | Experiment: off | Change |
|---|---:|---:|---:|
| Requests | 38,843 | 52,002 | +33.9% |
| Throughput | 647.38 req/s | 866.61 req/s | +33.9% |
| Average latency | 109.19 ms | 81.48 ms | -25.4% |
| p95 latency | 243.87 ms | 128.96 ms | -47.1% |
| HTTP failure rate | 0% | 0% | No change |

![Asynchronous commit experiment results](../local-load-test/08-wal-experiment-results.png)

The experiment demonstrated improved throughput and lower latency
in this particular test run. It supports the hypothesis that
synchronous commit and WAL flush overhead affected performance.

However, the results are not a controlled multi-run benchmark.
Natural run-to-run variation and other environmental factors may
also influence the observed improvement.

### Production decision and durability trade-off

The `synchronous_commit=off` configuration was rejected as a
production optimization.

Although it can reduce commit latency, PostgreSQL may lose recently
acknowledged transactions after a crash. Losing an acknowledged
examination answer is unacceptable for the intended system.

The database-level experimental setting was reset, and a new
database session confirmed `synchronous_commit=on`.

A safe production approach would preserve durable commits and
investigate:

1. Reducing unnecessary autosave frequency through client-side
   debouncing or batching, while defining acceptable answer-loss risk.
2. Optimizing database queries and transaction duration.
3. Measuring connection-pool queue time and transaction latency.
4. Testing appropriately sized database capacity under peak load.

These safe alternatives are recommendations, not implemented and
retested fixes.

### Evidence and limitations

Raw k6 summaries, terminal outputs, PostgreSQL monitoring CSV files,
and screenshots are stored in `evidence/local-load-test/`.

The local tests show that authenticated autosave requests completed
successfully under the tested workloads. They do not establish
production AWS throughput, CloudWatch-observed bottlenecks, RPO,
or RTO.

The experimental configuration improved measured performance but
was rejected for durability reasons. A production-safe optimization
has not yet been implemented and retested.

## Real AWS CloudWatch Validation 

The following real AWS tests complement, but must not be conflated with, the earlier local PostgreSQL tests and Architecture Lab simulations. See the dedicated [CloudWatch analysis](../cloudwatch/cloudwatch-analysis.md) for the full methodology and raw evidence index.

| Test | Requests | Rate | p95 | HTTP failures |
|---|---:|---:|---:|---:|
| Health baseline, 1 VU | 54 | 0.89/s | 364.74 ms | 0% |
| Health controlled, 5 VUs | 541 | 4.47/s | 370.73 ms | 0% |
| Health ramp, up to 10 VUs | 531 | 4.42/s | 650.83 ms | 0.18% |
| Read-only exam retrieval, 5 VUs | 266 | 4.34/s | 400.35 ms | 0% |

The ramped test had a different VU schedule and throughput, so its increased p95 is not definitive proof of saturation. EC2 CPU was approximately 0.4–0.5%, with CPU credits near 289; CloudWatch did not demonstrate CPU exhaustion. ALB target response time was low in the sampled period compared with client-observed latency.

![ALB under higher load](../cloudwatch/alb-bottleneck-metrics.png)

*Figure : Real AWS ALB metrics for the 10-VU investigation.*
![EC2 utilization](../cloudwatch/ec2-cpu-during-test.png)

*Figure : Low CPU and stable credit balance during testing.*
![Exam retrieval metrics](../cloudwatch/aws-exam-read-cloudwatch.png)

*Figure : CloudWatch metrics for the read-only exam retrieval workload.*
**Rubric limitation:** These AWS tests did not prove a backend bottleneck or a production-safe fix followed by an identical retest. The separate local asynchronous-commit experiment was deliberately rejected for exam-answer durability. Do not describe it as a deployed AWS optimization.


## AWS Auto Scaling optimization and retest — 20 November 2026

A 50% CPU target-tracking policy was added to the existing Mumbai ASG, with 180 s warmup and 1–2 instance capacity bounds. The same 120-second ramped k6 health-check script was repeated. Original: 531 requests, p95 650.83 ms, 1 failure; retest: 559 requests, p95 434.51 ms, 0 failures. This is a **33.24% lower observed p95**. Activity history showed **no new scale-out event**; therefore, the policy's causal performance benefit was **not isolated as a causal effect**. This AWS configuration change is distinct from the rejected local `synchronous_commit=off` experiment. See [CloudWatch analysis](../cloudwatch/cloudwatch-analysis.md) for screenshots, metrics and caveats.

The retest CloudWatch screenshot is included in `evidence/cloudwatch/`. The original machine-generated retest output and JSON summary are held separately on the student's laptop and can be added to the same evidence directory.


## Conclusion

The screenshots support **simulated successful request routing at several configured load levels** and a **predicted database contention risk**. The later real-AWS CloudWatch investigation, CPU target-tracking configuration and matched-script retest are documented in [`cloudwatch-analysis.md`](../cloudwatch/cloudwatch-analysis.md). The local database experiment remains a separate isolated test and was not deployed to AWS.

## Local 3,000-student exam-start acceptance retest — final evidence

**Environment:** local backend and PostgreSQL, not AWS Mumbai or Singapore. **Script:** `tests/load/exam-start-3000-retest.js`. **Workload:** 3,000 exam-start operations scheduled over five minutes; 30 configured VUs. **Result:** 3,000/3,000 HTTP 201, 0 HTTP request failures, p95 **19.13 ms**, mean **8.74 ms**, and **3,000 persisted attempts within 299.85 s** on the database verification. The terminal also reports **3,001 k6 iterations** because one iteration did not generate an HTTP request; report the **3,000 HTTP requests** as the exam-start count.

![Successful 3,000-start retest](local-exam-start/07-retest-peak-load-results.png)

![Database verification of 3,000 starts](local-exam-start/08-retest-database-verification.png)

Raw evidence: `local-exam-start/07-retest-summary.json`, `07-retest-terminal.log`, and the two screenshots above. The original local pilot and initial run are also retained.

**Scope:** This demonstrates the requested start volume in the local test, not complete simultaneous authentication, autosave, submission, grading, and AWS two-AZ throughput. The other two reasoned peak scenarios remain authenticated autosave contention and simultaneous SQS-backed submission/marking; the former has separate 100-VU local measurements, while the latter needs a timed end-to-end queue-drain test.

**CloudWatch/fix distinction:** A CPU target-tracking policy was configured in real AWS Mumbai, and the same read-only health script was rerun with lower observed p95 (650.83 → 434.51 ms). No scale-out occurred and the CloudWatch evidence did not establish CPU saturation; do **not** claim the policy caused the measured latency difference. See [`cloudwatch-analysis.md`](../cloudwatch/cloudwatch-analysis.md).