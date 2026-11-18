# DSO303 Assignment 3 — Failure Scenarios and Recovery Evidence

**Status:** Test plan; measurements must be entered from actual runs.  
**Primary pricing Region:** Singapore (`ap-southeast-1`).  
**Recovery targets:** RPO ≤ 5 minutes; RTO ≤ 60 minutes.  
**Evidence distinction:** Floci simulated results are simulation evidence, not proof of actual AWS production recovery.

## Measurement method

For each scenario, record the last successfully persisted answer timestamp (`T_last`), the latest recoverable answer timestamp (`T_recovered`), the failure start (`T_failure`), and the first successful end-to-end response after recovery (`T_restored`).

- **Observed data loss (RPO):** `T_last - T_recovered`, if the test can identify missing persisted records. If no write was lost, record 0 minutes and show before/after records. Do not infer RPO from uptime alone.
- **Observed recovery time (RTO):** `T_restored - T_failure`. Record the test's clock source and timestamps.
- If no recovery or persistence evidence exists, enter **Not measured**, not **Pass**.
- Capture the configuration, injected fault, application failure, recovery action, timestamps, and recovered records. Do not rely only on architecture screenshots.

## Scenario 1 — AZ-A outage

**Affected components:** API instance in AZ-A, marking worker in AZ-A, possibly the RDS primary if hosted there.  
**Expected impact:** ALB should route to a healthy AZ-B instance if one exists and has enough capacity; database failover may temporarily interrupt writes.  
**Likely fix:** Multi-AZ capacity, ALB health checks, RDS failover, retry logic, and appropriately sized Auto Scaling minimum capacity.  
**Cost trade-off:** A one-instance normal-month estimate does not pay for two concurrently healthy API instances; extra capacity must be priced.

**Procedure:** (1) Save a uniquely identified answer and capture timestamp; (2) record successful API health and saved answer; (3) inject AZ-A failure in Floci or a safe isolated test environment; (4) repeatedly probe the API; (5) verify the answer after recovery; (6) record measured times and any missing writes.

| Field | Actual result |
|---|---|
| Test date/environment | Not measured |
| Failure started (`T_failure`) | Not measured |
| Service restored (`T_restored`) | Not measured |
| Measured RTO | Not measured |
| Last persisted / recovered answer | Not measured |
| Measured RPO | Not measured |
| RPO ≤ 5 min? | Not assessed |
| RTO ≤ 60 min? | Not assessed |
| Fix applied / retest | Not measured |

**Evidence:** `evidence/failure-tests/01-az-a-before.png`, `01-az-a-failure.png`, `01-az-a-recovery.png`, `01-az-a-data-check.png`.

## Scenario 2 — AZ-B outage

**Expected impact:** Traffic should continue through AZ-A if adequate capacity exists; loss of the standby AZ may reduce redundancy.  
**Likely fix:** Health checks, cross-AZ Auto Scaling, adequate minimum capacity, and alarm notification.  
**Procedure:** Repeat the same timestamped persistence and recovery checks while failing AZ-B.

| Field | Actual result |
|---|---|
| Test date/environment | Not measured |
| Failure started / restored | Not measured |
| Measured RTO | Not measured |
| Measured RPO | Not measured |
| RPO ≤ 5 min? | Not assessed |
| RTO ≤ 60 min? | Not assessed |
| Fix applied / retest | Not measured |

**Evidence:** `evidence/failure-tests/02-az-b-before.png`, `02-az-b-failure.png`, `02-az-b-recovery.png`, `02-az-b-data-check.png`.

## Scenario 3 — RDS primary failure / failover

**Expected impact:** Temporary database connection failures; API writes may pause until RDS failover and connection recovery.  
**Likely fix:** RDS Multi-AZ, retry with backoff, connection re-establishment, alarms, and restore testing.  
**Procedure:** Persist a uniquely identified answer, trigger a safe database failover in a test environment, monitor failed/successful writes, and compare the last persisted record with recovered records. Avoid disrupting a live examination.

| Field | Actual result |
|---|---|
| Test date/environment | Not measured |
| Failure started / restored | Not measured |
| Measured RTO | Not measured |
| Measured RPO | Not measured |
| RPO ≤ 5 min? | Not assessed |
| RTO ≤ 60 min? | Not assessed |
| Fix applied / retest | Not measured |

**Evidence:** `evidence/failure-tests/03-rds-before.png`, `03-rds-failover.png`, `03-rds-recovery.png`, `03-rds-data-check.png`.

## Scenario 4 — API instance failure / insufficient healthy capacity

**Expected impact:** With one instance, API availability may be interrupted until replacement starts; with two healthy instances, ALB may continue serving requests.  
**Likely fix:** Multi-AZ minimum healthy capacity, ALB target health checks, Auto Scaling replacement, and a tested startup procedure.  
**Procedure:** Record API health and answer persistence, terminate or isolate one disposable test API instance, measure the outage and replacement time, then verify answer recovery and retest after the fix.

| Field | Actual result |
|---|---|
| Test date/environment | Not measured |
| Failure started / restored | Not measured |
| Measured RTO | Not measured |
| Measured RPO | Not measured |
| RPO ≤ 5 min? | Not assessed |
| RTO ≤ 60 min? | Not assessed |
| Fix applied / retest | Not measured |

**Evidence:** `evidence/failure-tests/04-api-before.png`, `04-api-failure.png`, `04-api-recovery.png`, `04-api-data-check.png`.

## Consolidated results (fill only after testing)

| Scenario | RPO observed | RTO observed | RPO pass? | RTO pass? | Fix and retest |
|---|---|---|---|---|---|
| AZ-A outage | Not measured | Not measured | Not assessed | Not assessed | Pending |
| AZ-B outage | Not measured | Not measured | Not assessed | Not assessed | Pending |
| RDS failover | Not measured | Not measured | Not assessed | Not assessed | Pending |
| API instance failure | Not measured | Not measured | Not assessed | Not assessed | Pending |

**Interpretation:** Until measurements are entered, the five-minute RPO and one-hour RTO remain unverified.
