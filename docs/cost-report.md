# DSO303 Assignment 3 — Cost and Service Report



## 1. Introduction



This report evaluates the estimated AWS operating costs, affordability, and resilience of the university examination platform developed in Assignment 2.



The primary AWS Region is ****Asia Pacific (Singapore), ap-southeast-1****.



The report considers two workload profiles:



- ****Normal month:**** 300–500 concurrent users, for 10 months per year.

- ****Exam month:**** Up to 3,000 students starting an examination within five minutes, for 2 months per year.



The university's budget is ****USD 1,000 per month on average****, equivalent to USD 12,000 annually.



### 1.1 Revised Cost-Optimized Architecture

The Assignment 3 architecture builds on the two-Availability-Zone university examination platform developed in Assignment 2. The primary pricing Region is Asia Pacific (Singapore), `ap-southeast-1`.

The revised design retains the Application Load Balancer, EC2 Auto Scaling, RDS PostgreSQL Multi-AZ, S3, SQS marking jobs, and CloudWatch monitoring. It evaluates three principal cost optimizations: a one-year Compute Savings Plan for predictable EC2 usage, S3 Gateway Endpoints and selected PrivateLink interface endpoints to reduce suitable NAT traffic, and lifecycle transitions of older examination records to S3 Glacier Deep Archive.

The architecture distinguishes proposed services from those covered by the baseline calculator estimates. In particular, the normal-month estimate prices one EC2 instance, while the two-AZ design shows additional application and marking capacity. The USD 83.09 normal-month estimate must therefore not be treated as the fully priced cost of the complete diagram. A single priced EC2 instance does not independently provide two-AZ application redundancy.

**Architecture files:** `architecture/DSO303_A3_Cost_Optimized_Architecture_v2.json`, `architecture/change-log.md`, and `evidence/architecture/revised-architecture.png`.

The design is a proposal; peak capacity, RPO, RTO, and actual implementation remain subject to testing and verification.

## 2. AWS Pricing Calculator Estimates



The normal-month figures were verified against the exported AWS Pricing Calculator CSV. The exam-month figures are taken from the previously captured estimate summary.



****Primary Region:**** Asia Pacific (Singapore), ap-southeast-1.



| AWS service | Normal month (USD) | Exam month (USD) |

|---|---:|---:|

| Amazon EC2 | 11.18 | 28.91 |

| Amazon RDS for PostgreSQL | 46.40 | 68.48 |

| Application Load Balancer | 18.98 | 24.24 |

| Amazon S3 | 2.51 | 2.51 |

| Amazon CloudWatch | 4.02 | 14.57 |

| ****Total**** | ****83.09**** | ****138.71**** |



**Note: Displayed service costs are rounded to two decimal places. Totals use the AWS Pricing Calculator's unrounded figures.**



The normal-month estimate uses one EC2 t3.micro instance, an RDS db.t3.micro Multi-AZ deployment, one Application Load Balancer, 100 GB of S3 Standard storage, and CloudWatch monitoring.



The exam-month estimate uses three EC2 t3.micro instances, a larger database storage allocation, and increased load-balancer and monitoring usage.



These estimates are incomplete because certain networking, encryption, data-transfer and backup charges have not yet been included. Therefore, they should not be presented as the final total cost of ownership.



****Pricing source:**** AWS Pricing Calculator export, \`DSO303 Assignment 3 - Normal Month(2).csv\`. Exam-month figures must be verified against the separate exam-month export.



## 3. Annual Cost Calculation



Normal-month cost:



10 × USD 83.09 = ****USD 830.90****



Exam-month cost:



2 × USD 138.71 = ****USD 277.42****



Estimated annual cost:



USD 830.90 + USD 277.42 = ****USD 1,108.32****



Average monthly cost:



USD 1,108.32 ÷ 12 = ****USD 92.36****



Annual cost per student, assuming 8,000 students:



USD 1,108.32 ÷ 8,000 = ****USD 0.14 per student****



These are preliminary calculations, not the final total cost of ownership.



## 4. Hidden and Additional AWS Costs



The AWS Pricing Calculator estimates include the main application services, but additional costs must be considered to understand the full operating cost.



The following analysis is based on the normal-month and exam-month CSV exports for Asia Pacific (Singapore), ap-southeast-1.



| Cost component | Current evidence | Assessment |

|---|---|---|

| Data transfer out | Normal-month Data Transfer entry is $0.00; EC2 outbound transfer is not selected in either profile | Actual internet traffic costs are not fully estimated |

| NAT Gateway | Not included in either complete workload estimate | Hourly charges and data-processing costs remain unpriced |

| CloudWatch Logs | 5 GB standard log ingestion in normal months; 15 GB in exam months | Log ingestion is included in the existing CloudWatch totals |

| AWS KMS | No separate KMS service estimate | Request charges and applicable key charges remain unpriced |

| RDS backups | Exam-month estimate specifies 0 GB additional backup storage | Extra backup storage and longer retention costs require assessment |

| Long-term S3 storage | S3 Standard baseline and a separate lifecycle optimization estimate are available | Storage savings have been estimated, but five-year growth and retrieval costs are not fully modeled |



### 4.1 Data Transfer



The normal-month estimate includes a Data Transfer entry costing USD 0.00. The EC2 configurations do not specify outbound internet transfer volumes.



Actual costs will depend on the amount of examination content, results, and other data transferred to users.



Therefore, USD 0.00 should not be interpreted as proof that internet data transfer will be free.



### 4.2 NAT Gateway and Private Connectivity

A separate AWS Pricing Calculator scenario modeled **two standard NAT Gateways**, each running 730 hours per month and processing 5 GB monthly, producing **USD 86.72 per month** in the calculator's expanded calculation view. The calculator's configuration validation prevented saving a NAT CSV export, so this value is supported by screenshot evidence rather than a saved estimate.

The separate PrivateLink estimate costs **USD 19.08 per month** for one interface endpoint deployed across two Availability Zones, with 10 GB of monthly data processing. The modeled difference is **USD 67.64 per month (approximately 78.0%)**.

These options are not functionally equivalent: PrivateLink supports connectivity to compatible services, while NAT Gateways may still be required for general outbound internet access. An S3 Gateway Endpoint is proposed for applicable S3 traffic. The modeled difference is **not guaranteed net savings**, and neither network scenario is included in the USD 83.09 / USD 138.71 workload baseline.

**Evidence:** Expanded NAT Gateway calculator screenshot and the separate PrivateLink CSV export. The NAT screenshot should be retained under `evidence/cost-optimizations/` using its actual saved filename.

### 4.3 CloudWatch Logs



The CSV exports confirm the following CloudWatch configurations:



| Usage | Normal month | Exam month |

|---|---:|---:|

| Standard log ingestion | 5 GB | 15 GB |

| Total CloudWatch estimate | $4.02 | $14.57 |



The CloudWatch totals already include the configured monitoring and logging usage.



Additional ingestion, log retention, metric usage, and alarms beyond the configured amounts could increase costs.



### 4.4 AWS KMS



AWS KMS may be used to manage encryption keys for supported services.



The existing estimates do not include a separate KMS cost calculation.



Potential charges depend on the number and type of customer-managed keys, request volumes, and the encryption configuration.



KMS costs remain an unpriced component of the current estimate.



### 4.5 RDS Backup Storage



Amazon RDS provides database backup capabilities, but additional backup storage and retention requirements can introduce charges.



The exam-month calculator configuration specifies 0 GB of additional backup storage.



This does not prove that long-term backup and recovery requirements are fully covered.



The final architecture must confirm how database recovery meets the five-minute RPO and one-hour RTO targets.



### 4.6 Long-Term S3 Retention



The baseline estimate includes 100 GB of S3 Standard storage at USD 2.51 per month.



The lifecycle optimization estimates 20 GB in S3 Standard and 80 GB in S3 Glacier Deep Archive, costing USD 0.68 per month.



This represents an estimated USD 1.83 monthly reduction under the selected storage assumptions.



However, five-year record retention requires consideration of future storage growth, lifecycle transition charges, minimum storage durations, and retrieval costs.



### 4.7 Hidden-Cost Conclusion



The current workload estimates total USD 1,108.32 annually, or USD 92.36 per month averaged over the year.



These figures include the configured CloudWatch Logs ingestion but exclude or incompletely model several networking, encryption, backup, and long-term storage costs.



The estimates therefore provide a preliminary baseline rather than a complete total cost of ownership.



The university's annual budget is USD 12,000. The currently priced services leave USD 10,891.68 annually for additional costs before the budget limit is reached. This is budget headroom, not a forecast of the missing charges.



A final affordability verdict must consider these additional costs alongside the required resilience and performance tests.



## 5. Three Most Expensive Components



Based on the current exam-month estimate:



1. ****Amazon RDS — USD 68.48/month.**** The database provides persistent storage for examinations, student answers, and results.

2. ****Amazon EC2 — USD 28.91/month.**** EC2 runs the application backend and supports request processing.

3. ****Application Load Balancer — USD 24.24/month.**** The load balancer distributes incoming requests across application instances.



These rankings may change after missing networking, storage, and backup costs are added.



## 6. AWS Service Alternatives Comparison



Five AWS service choices were compared to identify a suitable balance between cost, performance, resilience, and implementation effort.



The primary Region is Asia Pacific (Singapore), ap-southeast-1. Where available, costs are taken from the AWS Pricing Calculator exports. Alternatives without calculator estimates are evaluated qualitatively rather than assigned unsupported prices.



### 6.1 Backend Compute: EC2 Auto Scaling vs AWS Lambda



| Criteria | EC2 Auto Scaling | AWS Lambda |

|---|---|---|

| Cost | Normal-month EC2 estimate: $11.18/month; exam-month: $28.91/month | Request-based and execution-duration pricing; not separately estimated |

| Performance | Supports continuously running APIs; scaling may require instance startup time | Automatically scales concurrent executions, subject to quotas and concurrency limits |

| Resilience | Instances can be distributed across multiple AZs | AWS manages the underlying infrastructure availability |

| Implementation effort | Lower effort for the existing Express backend | Requires adapting deployment, request handling, and database connections |



****Recommendation:**** Retain EC2 Auto Scaling for the existing backend because it requires fewer application changes. Configure capacity across at least two AZs and verify scaling behavior during examination peaks.



The current calculator figures estimate EC2 instance costs; they do not prove that Auto Scaling is configured or that 3,000 simultaneous students can be supported.



### 6.2 Database: RDS PostgreSQL Multi-AZ vs Aurora Serverless v2



| Criteria | RDS PostgreSQL Multi-AZ | Aurora Serverless v2 |

|---|---|---|

| Cost | $46.40/month normal; $68.48/month exam | Separate estimate not available; capacity-based pricing |

| Performance | Predictable provisioned database capacity | Can adjust database capacity within configured limits |

| Resilience | Multi-AZ deployment supports database failover | Supports resilient configurations, depending on deployment topology |

| Implementation effort | Lower effort because PostgreSQL is already used | Requires migration planning, compatibility checks, and capacity configuration |



****Recommendation:**** Retain RDS PostgreSQL Multi-AZ for the current design, subject to performance testing and verification of the required RPO and RTO.



The db.t3.micro configuration may become a bottleneck during examination peaks. Multi-AZ improves availability but does not automatically increase database write capacity.



### 6.3 Private Networking: NAT Gateway vs AWS PrivateLink



| Criteria | NAT Gateway | AWS PrivateLink |

|---|---|---|

| Cost | $86.72/month for two NAT Gateways, based on screenshot evidence | $19.08/month from the exported estimate |

| Performance | Supports outbound connections from private subnets | Provides private connectivity to supported AWS services |

| Resilience | One NAT Gateway per AZ can reduce cross-AZ dependency | Interface endpoints can be deployed across AZs |

| Implementation effort | Requires NAT Gateways and appropriate routing | Requires endpoint configuration, security groups, and service-specific connectivity |



The NAT Gateway estimate assumes two standard NAT Gateways, each processing 5 GB monthly. The AWS Pricing Calculator displayed a total of $86.72 per month.



The PrivateLink estimate models one interface endpoint across two AZs, processing 10 GB monthly, at $19.08 per month.



The modeled monthly cost difference is $67.64, approximately 78.0%.



However, these configurations do not provide identical networking functionality. PrivateLink cannot replace NAT Gateway access to arbitrary internet destinations. Therefore, the difference is not a guaranteed infrastructure saving.



****Recommendation:**** Use S3 Gateway Endpoints where suitable, evaluate interface endpoints for supported AWS services, and retain NAT Gateways where general outbound internet connectivity is necessary.



### 6.4 EC2 Purchasing: On-Demand vs Compute Savings Plans



| Criteria | EC2 On-Demand | Compute Savings Plans |

|---|---|---|

| Cost | $11.18/month for the normal-month EC2 configuration | $6.94/month for the separately estimated configuration |

| Performance | Same EC2 instance performance | Same EC2 instance performance |

| Resilience | Depends on deployment and AZ distribution | Depends on deployment and AZ distribution |

| Implementation effort | Simple, without long-term spending commitment | Requires commitment planning and usage monitoring |



The one-year, no-upfront Compute Savings Plan estimate reduces the modeled monthly EC2 cost by $4.24, or approximately 37.9%.



Savings Plans affect purchasing costs rather than the resilience or performance of the application.



****Recommendation:**** Consider a one-year Compute Savings Plan for predictable baseline usage, while retaining flexibility for additional exam-month capacity.



### 6.5 Long-Term Storage: S3 Standard vs S3 Glacier Deep Archive



| Criteria | S3 Standard | S3 Standard + Glacier Deep Archive |

|---|---|---|

| Cost | $2.51/month for 100 GB | $0.68/month for 20 GB Standard and 80 GB Deep Archive |

| Performance | Immediate access to stored objects | Archived objects require restoration before access |

| Resilience | Designed for durable object storage | Designed for durable archival storage |

| Implementation effort | Simple storage management | Requires lifecycle policies, retention planning, and retrieval procedures |



The lifecycle estimate shows a modeled monthly reduction of $1.83, approximately 72.9%.



However, the estimate does not fully represent future data growth, all transition and retrieval charges, or the operational effects of delayed archive retrieval.



****Recommendation:**** Keep active examination files in S3 Standard and transition older records to Glacier Deep Archive when immediate access is no longer required.



Retention policies must ensure that university records are preserved for the required five-year period.



### 6.6 Overall Service Selection



Based on the current estimates and architecture requirements, the preferred service choices are:



1. EC2 Auto Scaling for backend application hosting, with capacity distributed across two AZs.

2. RDS PostgreSQL Multi-AZ for persistent examination data.

3. Selective use of VPC endpoints to reduce unnecessary NAT Gateway traffic.

4. Compute Savings Plans for predictable baseline compute usage.

5. S3 lifecycle policies for lower-cost long-term record retention.



These recommendations are provisional. Their final suitability depends on measured load-test performance, failure-test results, and complete infrastructure costs.



## 7. Cost Optimizations



Three cost optimization alternatives were evaluated using AWS Pricing Calculator in Asia Pacific (Singapore), ap-southeast-1.



The estimates are based on the normal-month and exam-month workload profiles specified in the Assignment 3 guide. All amounts are in USD.



### 7.1 Optimization 1 — EC2 Compute Savings Plan



The original normal-month configuration uses one EC2 t3.micro instance with On-Demand pricing.



A one-year Compute Savings Plan with no upfront payment was evaluated as an alternative.



| Metric | Original | Optimized |

|---|---:|---:|

| Monthly EC2 estimate | $11.18 | $6.94 |

| Annual equivalent | $134.16 | $83.28 |

| Monthly cost reduction | | ****$4.24**** |

| Annual cost reduction | | ****$50.88**** |

| Percentage reduction | | ****37.92%**** |



****Benefits:**** The purchasing option can reduce the cost of a predictable baseline compute workload without changing the application architecture.



****Limitations:**** Savings Plans involve a spending commitment. Additional exam-month capacity may require On-Demand pricing or additional covered usage. The calculation represents the estimated reduction for the selected baseline configuration, not the entire application's annual savings.



****Recommendation:**** Consider a Savings Plan for predictable baseline compute usage after confirming the appropriate hourly commitment.



### 7.2 Optimization 2 — NAT Gateway versus AWS PrivateLink



The existing architecture uses private subnets and may require NAT Gateways for outbound connectivity.



AWS PrivateLink was evaluated as an alternative for accessing supported AWS services privately.



| Metric | NAT Gateway estimate | PrivateLink estimate |

|---|---:|---:|

| Monthly cost | $86.72 | $19.08 |

| Annual equivalent | $1,040.64 | $228.96 |

| Potential monthly difference | | ****$67.64**** |

| Potential annual difference | | ****$811.68**** |

| Potential percentage reduction | | ****78.00%**** |



The NAT scenario models two standard NAT Gateways, each with 730 operating hours and 5 GB of processed traffic monthly; its USD 86.72 result is supported by a calculator screenshot because the estimate could not be saved. The PrivateLink estimate uses one interface endpoint deployed across two Availability Zones, processing 10 GB per month.



****Benefits:**** PrivateLink provides private access to supported services. S3 Gateway Endpoints may also reduce NAT processing charges for S3 traffic without endpoint hourly charges.



****Limitations:**** PrivateLink is not a general replacement for internet access. The NAT Gateway and PrivateLink estimates are not functionally equivalent. The calculated difference is a potential scenario comparison, not a verified net saving. Actual savings depend on which NAT Gateways can be removed, which traffic remains, and whether additional endpoints are needed.



****Recommendation:**** Use S3 Gateway Endpoints for applicable S3 traffic and evaluate interface endpoints for other supported AWS services. Retain NAT Gateways wherever general outbound internet access is required.



### 7.3 Optimization 3 — S3 Lifecycle Storage



The original estimate stores 100 GB of data in S3 Standard.



An optimized configuration was evaluated using:



- 20 GB in S3 Standard for recently accessed files.

- 80 GB in S3 Glacier Deep Archive for older records.



| Metric | Original | Optimized |

|---|---:|---:|

| Monthly S3 estimate | $2.51 | $0.68 |

| Annual equivalent | $30.12 | $8.16 |

| Monthly cost reduction | | ****$1.83**** |

| Annual cost reduction | | ****$21.96**** |

| Percentage reduction | | ****72.91%**** |



****Benefits:**** Older examination and assignment records can be stored at a lower monthly cost while supporting the five-year retention objective.



****Limitations:**** Glacier Deep Archive has minimum storage-duration requirements, retrieval delays, and possible retrieval and transition charges. This comparison assumes a steady 100 GB storage footprint and does not model five years of data growth or all possible retrieval activity.



****Recommendation:**** Keep active examination records in S3 Standard and apply lifecycle transitions to historical records that are rarely accessed. Define retention and deletion rules according to the five-year requirement.



### 7.4 Optimization Summary



| Optimization | Monthly reduction or difference | Status |

|---|---:|---|

| EC2 Compute Savings Plan | $4.24 | Estimated baseline reduction; commitment-dependent |

| NAT Gateway vs PrivateLink | $67.64 | Potential difference; not verified net savings |

| S3 Lifecycle Storage | $1.83 | Estimated reduction under storage assumptions |



These figures must not be added together as guaranteed infrastructure savings. Each comparison has different assumptions, and the optimized network configuration has not been proven to replace the original NAT Gateway functionality.



The final cost recommendation must also consider application performance, availability, recovery requirements, and long-term data retention.



## 8. AWS Region Comparison



The university examination platform uses Asia Pacific (Singapore), ap-southeast-1, as the primary AWS Region, as specified in the Assignment 3 instructions.



Asia Pacific (Mumbai), ap-south-1, was selected as an alternative Region because of its geographical proximity to Bhutan and relevance to the previous Assignment 2 deployment.



### 8.1 Region Comparison



| Criteria | Singapore (ap-southeast-1) | Mumbai (ap-south-1) |

|---|---|---|

| Role | Required primary Region | Alternative Region |

| Monthly infrastructure cost | $83.09 normal; $138.71 exam | $77.84 normal (exam not estimated) |

| Annual baseline cost | $1,108.32 | Normal-month annualized equivalent $934.08; full 10+2 profile not estimated |

| Performance | Potentially suitable for users in Bhutan | Potentially suitable for users in Bhutan |

| Availability | Multiple Availability Zones available | Multiple Availability Zones available |

| Resilience | Supports Multi-AZ architecture | Supports Multi-AZ architecture |

| Implementation effort | Existing Assignment 3 pricing assumptions | Requires region-specific configuration and deployment validation |



AWS pricing varies by Region. Therefore, the Singapore estimate cannot be assumed to represent Mumbai pricing.



### 8.2 Latency Comparison for Users in Bhutan



Network latency was measured using CloudPing (https\://cloudping.net/) on 18 November 2026, from a browser connected to the user's network in Bhutan.



Three test runs were conducted for Asia Pacific (Singapore), ap-southeast-1, and Asia Pacific (Mumbai), ap-south-1.



| Test run | Singapore (ms) | Mumbai (ms) |

|---|---:|---:|

| Run 1 | 115.18 | 127.98 |

| Run 2 | 117.16 | 125.56 |

| Run 3 | 118.86 | 134.48 |

| ****Average**** | ****117.07**** | ****129.34**** |



Singapore recorded an average latency 12.27 ms lower than Mumbai, approximately 9.5% lower relative to Mumbai's average.



Although Mumbai is geographically closer to Bhutan, the measurements show that geographical distance alone does not determine network performance. Internet routing, network congestion, and service-provider connectivity can influence latency.



****Finding:**** Singapore performed better across all three browser-based tests and is a reasonable primary Region for the examination platform.



****Limitation:**** These measurements were taken from one browser and network connection. They do not represent all Bhutanese users or directly measure examination API response times. Further testing from multiple networks would provide stronger evidence.



****Evidence:**** \`evidence/region-comparison/cloudping-run-1.png\`, \`cloudping-run-2.png\`, and \`cloudping-run-3.png\`.



### 8.3 Cost Comparison



AWS Pricing Calculator estimates were prepared for Asia Pacific (Singapore), ap-southeast-1, and Asia Pacific (Mumbai), ap-south-1, using the normal-month workload profile.



| AWS Service | Singapore (USD/month) | Mumbai (USD/month) |

|---|---:|---:|

| Amazon EC2 | 11.18 | 9.64 |

| Amazon RDS for PostgreSQL | 46.40 | 43.20 |

| Application Load Balancer | 18.98 | 18.62 |

| Amazon S3 | 2.51 | 2.51 |

| Amazon CloudWatch | 4.02 | 3.87 |

| Data Transfer | 0.00 | 0.00 |

| ****Total**** | ****83.09**** | ****77.84**** |



The Mumbai estimate is USD 5.25 per month cheaper than Singapore, representing approximately 6.32% of the Singapore monthly cost.



The updated Mumbai estimate uses one Linux t3.micro instance with EC2 monitoring disabled, an RDS PostgreSQL Multi-AZ deployment, one Application Load Balancer, 100 GB of S3 Standard storage, and CloudWatch monitoring.



Both estimates now have EC2 monitoring disabled. However, detailed Application Load Balancer traffic assumptions cannot be fully verified from the CSV exports.



The measured average browser latency was 117.07 ms for Singapore and 129.34 ms for Mumbai. Singapore therefore performed better in the three recorded tests, despite having a higher estimated monthly cost.



****Recommendation:**** Retain Singapore as the primary Region for Assignment 3 because it is required by the assignment and demonstrated lower latency in the recorded measurements. Mumbai remains a potentially cheaper alternative.



Both estimates remain preliminary because certain networking, encryption, backup, and data-transfer costs are not fully modeled.



### 8.4 Resilience and Operational Considerations



Both Regions support architectures distributed across multiple Availability Zones.



However, selecting a Region does not automatically ensure resilience. The platform must have correctly configured load balancing, application capacity, database failover, backups, and recovery procedures.



The requirement to survive one Availability Zone failure must be tested independently of the Region choice.



### 8.5 Final Region Recommendation



Based on the AWS Pricing Calculator estimates and browser-based latency measurements, Asia Pacific (Singapore), ap-southeast-1, is recommended as the primary AWS Region for the university examination platform.



****Cost comparison:****



- Singapore normal-month estimate: USD 83.09.

- Mumbai normal-month estimate: USD 77.84.

- Mumbai is USD 5.25 cheaper per normal month, approximately 6.32%.



****Latency comparison:****



- Singapore average latency: 117.07 ms.

- Mumbai average latency: 129.34 ms.

- Singapore demonstrated 12.27 ms lower average latency across three tests conducted from a browser in Bhutan.



Although Mumbai offers a small estimated cost advantage, Singapore demonstrated better latency in the recorded tests. Singapore is also the required primary Region for Assignment 3.



Both Regions support Multi-AZ architectures, but resilience depends on the actual deployment configuration rather than Region selection alone.



****Final recommendation:**** Retain Singapore as the primary Region. Consider Mumbai as an alternative if future pricing, network measurements, or operational requirements justify a change.



This recommendation is based on the available cost and latency evidence. It does not establish that either Region meets the required peak-load capacity, five-minute RPO, or one-hour RTO. Those requirements must be validated separately through testing.



## 9. Feasibility Assessment



This section evaluates whether the university examination platform is financially and technically feasible under the requirements of DSO303 Assignment 3.



The assessment uses AWS Pricing Calculator estimates for Asia Pacific (Singapore), ap-southeast-1, and the available performance evidence.



### 9.1 Financial Feasibility



The university has an average operating budget of USD 1,000 per month, equivalent to USD 12,000 annually.



| Metric | Estimated value |

|---|---:|

| Normal-month cost | USD 83.09 |

| Exam-month cost | USD 138.71 |

| Number of normal months | 10 |

| Number of exam months | 2 |

| Estimated annual baseline | USD 1,108.32 |

| Average monthly baseline | USD 92.36 |

| Annual budget | USD 12,000 |

| Remaining annual budget headroom | USD 10,891.68 |

| Percentage of annual budget used | 9.24% |

| Annual baseline cost per student (8,000 students) | USD 0.14 |



The currently priced services are significantly below the university's annual budget.



However, the estimates do not fully include NAT Gateway charges, internet data transfer, KMS costs, additional backups, and long-term storage growth.



Furthermore, the estimated resources have not yet been proven sufficient for the examination workload. Additional capacity could increase the final cost.



****Financial verdict:**** Provisionally affordable based on the current calculator estimates. Final affordability depends on completing the infrastructure cost model and verifying sufficient capacity.



### 9.2 Peak-Load Feasibility



The platform must support up to 3,000 students starting an examination within five minutes.



The exam-month AWS Pricing Calculator estimate includes three EC2 t3.micro instances and an RDS PostgreSQL database.



However, estimated resource costs do not demonstrate that the infrastructure can handle the required request volume.



A load test must measure application response times, request throughput, error rates, and resource utilization.



The test must identify a bottleneck, demonstrate an improvement, and repeat the test to verify the effect.



****Peak-load verdict:**** Not yet verified.



### 9.3 Availability Zone Resilience



The platform must continue operating when one Availability Zone becomes unavailable.



The proposed architecture uses an Application Load Balancer, EC2 instances across Availability Zones, and RDS PostgreSQL Multi-AZ.



However, these design choices alone do not prove successful failover.



Failure testing must demonstrate how the platform behaves during an AZ outage and whether examination activity can continue or recover within the required limits.



****Availability verdict:**** Designed for resilience, but not yet validated by Assignment 3 failure-test evidence.



### 9.4 Recovery Point Objective (RPO)



The maximum permitted data loss is five minutes.



The platform must ensure that examination answers and other important records can be recovered without exceeding this limit.



Multi-AZ database replication supports availability, but does not replace the need to verify application-level data persistence, backup policies, and recovery procedures.



****RPO verdict:**** Not yet verified against the five-minute target.



### 9.5 Recovery Time Objective (RTO)



The required Recovery Time Objective is one hour.



Failure scenarios must measure or estimate recovery time, identify dependencies, and explain how recovery can be completed within the target.



The results should distinguish measured recovery times from theoretical expectations.



****RTO verdict:**** Not yet verified against the one-hour target.



### 9.6 Five-Year Data Retention



The university requires examination files and records to be retained for five years.



The S3 lifecycle optimization demonstrates a potential reduction in storage costs by moving older files to Glacier Deep Archive.



However, lifecycle policies, retention controls, database record retention, and long-term storage growth must be addressed before compliance can be confirmed.



****Retention verdict:**** A suitable storage approach has been identified, but full five-year retention has not been verified.



### 9.7 Overall Feasibility Verdict



The AWS Pricing Calculator results indicate that the examination platform may be financially affordable within the university's USD 1,000 average monthly budget.



Singapore also demonstrated lower average browser latency than Mumbai during the three recorded CloudPing tests.



However, the available evidence does not yet prove that the proposed infrastructure can support 3,000 students starting an examination within five minutes, survive a complete Availability Zone outage, or meet the required RPO and RTO.



****Overall verdict: Conditionally feasible.****



The platform is financially promising based on the partial cost estimates, but final technical feasibility depends on successful load testing, failure testing, recovery validation, and completion of the missing cost assumptions.



## 10. Evidence and Validation Checklist

The final submission should include:

- Normal-month and exam-month AWS Pricing Calculator exports and/or available estimate evidence.
- Three cost optimizations, calculations, and supporting CSV exports or calculator screenshots.
- Singapore versus Mumbai cost estimates and three Bhutan-origin CloudPing measurement screenshots.
- Revised architecture JSON, generated diagram screenshot, and `architecture/change-log.md`.
- Four failure scenarios documenting the failure, expected or measured impact, recovery action, RPO/RTO comparison, and evidence. Distinguish simulation evidence from production measurements.
- Load-test results showing the initial bottleneck, CloudWatch observations, the proposed or implemented fix, and a retest. Do not claim measurements that have not been performed.
- A comprehensive written report with clearly named evidence files and explanations. **The tutor has confirmed that a demonstration video is not required**, although it appeared in the original assignment guide.

The failure and load-test evidence remains to be completed or verified before final submission.

## 11. Conclusion



The initial AWS Pricing Calculator estimates suggest that the university examination platform may operate within the specified annual budget. However, a complete cost analysis must account for hidden charges, the required resilience design, and additional resources needed during examination peaks.



The final recommendation will depend on the completed cost calculations, optimization comparisons, failure tests, and load-test evidence.