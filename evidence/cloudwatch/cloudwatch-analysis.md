# Failure Simulation and Resilience Evaluation

**DSO303 Assignment 3 : Four fault-injection scenarios**

## Executive findings

Four scenarios were exercised in AWS Architecture Lab using the Assignment 3 architecture: AZ-A outage, AZ-B outage, RDS primary failure and API EC2 failure. Each scenario returned a successful HTTP 200 modeled request trace. These results demonstrate the designed alternate paths under the simulator assumptions. The architecture targets **RPO ≤ 5 minutes** and **RTO ≤ 60 minutes**; the screenshots show routing outcomes rather than timestamped data-loss or elapsed-recovery calculations.

![Healthy architecture baseline](01-healthy-baseline-part1.png)

*Figure 1 — Healthy baseline before the simulated faults.*

## Test results at a glance

| Fault scenario | Recorded simulator outcome | Design conclusion |
|---|---|---|
| AZ-A outage | HTTP 200; 8/8 modeled steps; 134 ms simulated trace | Successful modeled failover path |
| AZ-B outage | HTTP 200; 9/9 modeled steps; 134 ms simulated trace | Successful modeled failover path |
| RDS primary failure | HTTP 200; 8/8 modeled steps; 134 ms simulated trace | Successful modeled failover path |
| API EC2 instance failure | HTTP 200; 9/9 modeled steps; 134 ms simulated trace | Successful modeled failover path |

## 1. AZ-A outage

**Observed result:** HTTP 200; 8/8 modeled steps; 134 ms simulated trace.

The simulator continued routing through the AZ-B path when AZ-A was unavailable. The result illustrates cross-zone routing in the modeled architecture.

![AZ-A outage: fault injection](02-az-a-outage-part1.png)

*Figure 2 : Fault-injection state for az-a outage.*

![AZ-A outage: modeled response](02-az-a-outage-part2.png)

*Figure 3 : Simulator response and route trace.*


## 2. AZ-B outage

**Observed result:** HTTP 200; 9/9 modeled steps; 134 ms simulated trace.

The simulator returned a successful route through the remaining AZ-A path. The design depends on maintaining sufficient healthy targets in both zones.

![AZ-B outage: fault injection](03-az-b-outage-part1.png)

*Figure 4 : Fault-injection state for az-b outage.*

![AZ-B outage: modeled response](03-az-b-outage-part2.png)

*Figure 5 : Simulator response and route trace.*


## 3. RDS primary failure

**Observed result:** HTTP 200; 8/8 modeled steps; 134 ms simulated trace.

The modeled Multi-AZ database-failover path completed successfully. The exercise demonstrates the intended dependency and recovery path rather than a timed production RDS promotion.

![RDS primary failure: fault injection](04-rds-primary-failed.png)

*Figure 6 : Fault-injection state for rds primary failure.*

![RDS primary failure: modeled response](04-rds-primary-result-part1.png)

*Figure 7 : Simulator response and route trace.*


## 4. API EC2 instance failure

**Observed result:** HTTP 200; 9/9 modeled steps; 134 ms simulated trace.

The modeled ALB route reached the remaining API target after the AZ-A EC2 failure. The trace evaluates route feasibility; actual availability requires healthy live capacity in both AZs.

![API EC2 instance failure: fault injection](05-ec2-az-a-failed..png)

*Figure 8 : Fault-injection state for api ec2 instance failure.*

![API EC2 instance failure: modeled response](05-ec2-failover-part1.png)

*Figure 9 : Simulator response and route trace.*

## Recovery objectives and engineering interpretation

| Objective | Evaluation approach |
|---|---|
| Availability-zone resilience | Tested through two independent AZ outage scenarios in the architecture simulator; both modeled request traces succeeded |
| Application-instance resilience | Tested through EC2 failure simulation and alternate-target routing |
| Database resilience | Tested through modeled primary failure and Multi-AZ recovery routing |
| RPO ≤ 5 minutes | Design objective supported by durable answer storage and appropriate recovery planning; a timestamped write-recovery drill would quantify the operational RPO |
| RTO ≤ 60 minutes | Design objective supported by redundant routing and database failover planning; a timed live recovery drill would quantify the operational RTO |

## Conclusions

The four simulator fault injections completed with successful modeled routing results, supporting the feasibility of the proposed multi-AZ architecture. In production, the target design should maintain healthy API capacity in both Availability Zones, use RDS Multi-AZ, and monitor ALB health and recovery events. Simulator latency values are trace outputs, not measured AWS outage durations.

## Local recovery addendum (separate environment)

After the four modeled fault tests, local Docker recovery experiments measured backend restart **7.737 s**, backend restart with verified exam-answer recovery **8.675 s**, PostgreSQL restart **7.345 s**, and archived WAL recovery startup-to-writable **7.066 s**. The local physical backup was **~6m19s old** at simulated failure, while archived WAL replay recovered a committed post-backup marker. These are **not** measurements of the four AWS Architecture Lab failovers. See [`docs/recovery-analysis.md`](../../docs/recovery-analysis.md) for timestamps, screenshots and limitations.