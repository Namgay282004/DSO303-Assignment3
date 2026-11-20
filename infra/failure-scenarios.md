# Assignment 3 : Failure Scenarios and Simulation Results

**Environment:** AWS Architecture Lab simulation of the revised university examination architecture.  
**Test request:** `GET /api/exams/current`, with route-table and gateway assumptions enabled.  
**Recovery targets:** RPO ≤ 5 minutes; RTO ≤ 60 minutes.

## Healthy baseline

The healthy simulation returned **HTTP 200**, **134 ms simulated request duration**, and completed **9/9** modeled steps.

![Healthy baseline: request settings and initial trace](../evidence/failure-tests/01-healthy-baseline-part1.png)

*Healthy baseline: request settings and initial trace.*

## Observed failure simulations

| Scenario | Observed outcome | Request trace | 
|---|---|---|
| AZ-A unavailable | ALB routed to API EC2 in AZ-B; modeled RDS failover | HTTP 200; 8/8 steps; 134 ms | Not measured |
| AZ-B unavailable | ALB routed to API EC2 in AZ-A | HTTP 200; 9/9 steps; 134 ms | Not measured |
| RDS primary failed | Simulator modeled Multi-AZ database failover | HTTP 200; 8/8 steps; 134 ms | Not measured |
| API EC2 in AZ-A failed | ALB trace routed to AZ-B API EC2 | HTTP 200; 9/9 steps; 134 ms | Not measured |

## Scenario 1 : Availability Zone A outage

**Expected impact:** AZ-A application and possibly database primary become unavailable.  
**Observed:** Successful modeled rerouting to AZ-B and simulated RDS failover.  
**Likely mitigation:** Healthy compute in both AZs, ALB health checks, sufficient Auto Scaling minimum capacity, and retryable database connections.

![AZ-A outage: successful modeled request trace](../evidence/failure-tests/02-az-a-outage-part2.png)

*AZ-A outage: successful modeled request trace.*

## Scenario 2 : Availability Zone B outage

**Expected impact:** AZ-B compute becomes unavailable; remaining AZ must serve requests.  
**Observed:** Successful modeled request through AZ-A.  
**Likely mitigation:** Maintain adequate AZ-A capacity and monitor target health.

![AZ-B outage: successful modeled request trace](../evidence/failure-tests/03-az-b-outage-part2.png)

*AZ-B outage: successful modeled request trace.*

## Scenario 3 : RDS primary failure

**Expected impact:** Database connections may briefly fail while standby is promoted.  
**Observed:** The simulator indicated Multi-AZ automated failover; the modeled request returned HTTP 200.  
**Likely mitigation:** RDS Multi-AZ, application retry/backoff, reconnection logic, backups, and restoration drills.

![Injected RDS primary failure](../evidence/failure-tests/04-rds-primary-failed.png)

*Injected RDS primary failure.*
![RDS failover simulation result](../evidence/failure-tests/04-rds-primary-result-part2.png)

*RDS failover simulation result.*

## Scenario 4 : EC2 application instance failure

**Expected impact:** ALB must avoid the failed target; capacity may be reduced.  
**Observed:** The modeled request trace successfully routed to AZ-B and returned HTTP 200. A separate simulator warning suggested that redundant compute was unavailable and a 502 could occur; this **conflicts with the successful trace** and is reported as a simulator inconsistency.  
**Likely mitigation:** Ensure two healthy AZ-distributed targets, target health checks, and capacity-based scaling.

![Injected EC2 failure in AZ-A](../evidence/failure-tests/05-ec2-az-a-failed..png)

*Injected EC2 failure in AZ-A.*
![Successful modeled EC2 failover trace](../evidence/failure-tests/05-ec2-failover-part2.png)

*Successful modeled EC2 failover trace.*

## Recovery objectives and limitations

The **134 ms value is simulated request duration**, not elapsed failover or recovery time. These screenshots do **not** measure when the fault began, when service was restored, or whether the last saved answer survived. Therefore, neither **RPO ≤ 5 minutes** nor **RTO ≤ 1 hour** is verified. No fix was deployed and retested in real AWS.

**Conclusion:** Four fault-injection scenarios were exercised and successful modeled request paths were observed. Actual recovery performance and persistence still require controlled tests with timestamps and database record verification.

## Additional visual fault-injection evidence and measurement audit

The four scenarios above were run in **AWS Architecture Lab**, not by terminating real AWS production resources. The additional before/after captures below make the fault injection and observed simulated response paths auditable.

| Scenario | Fault / expected user impact | Observed modeled result | Corrective action |
|---|---|---|---|
| AZ-A outage | One zone unavailable; temporary capacity reduction | HTTP 200, 8/8 modeled steps | Keep two healthy targets across AZs; verify RDS failover |
| AZ-B outage | Remaining zone serves all traffic | HTTP 200, 9/9 modeled steps | Minimum per-AZ capacity and ALB health checks |
| RDS primary failure | Connection interruption while standby promotes | HTTP 200, 8/8 modeled steps | Multi-AZ, retries/backoff, actual recovery drill |
| API EC2 AZ-A failure | Target loss; possible reduced capacity | HTTP 200, 9/9 modeled steps; contradictory simulator warning | Two active healthy targets and tested replacement |

**Do not interpret 134 ms as RTO.** It is modeled request duration, not elapsed recovery time. A real RPO measurement requires writing a timestamped answer, injecting a controlled fault, restoring service, and checking the latest durable answer. RTO requires start/end timestamps of outage and restoration. The evidence does not prove the five-minute RPO or one-hour RTO targets.

![Healthy modeled trace](../evidence/failure-tests/01-healthy-baseline-part2.png)

*Figure — Healthy baseline confirmation before injected faults.*
![AZ-A fault settings](../evidence/failure-tests/02-az-a-outage-part1.png)

*Figure — Fault injection configuration for AZ-A outage.*
![AZ-B fault settings](../evidence/failure-tests/03-az-b-outage-part1.png)

*Figure — Fault injection configuration for AZ-B outage.*
![RDS baseline](../evidence/failure-tests/04-rds-primary-before.png)

*Figure — Database state before modeled primary failure.*
![RDS failover result](../evidence/failure-tests/04-rds-primary-result-part1.png)

*Figure — Modeled RDS primary failure result, first evidence view.*
![EC2 baseline](../evidence/failure-tests/05-ec2-az-a-before.png)

*Figure — Application instance state before injected EC2 fault.*
![EC2 modeled failover](../evidence/failure-tests/05-ec2-failover-part1.png)

*Figure — First modeled response trace after EC2 fault.*
