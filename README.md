# DSO303 Assignment 2 : Architecture Design and Deployment

## University Online Examination and Assignment Submission Platform

### 1. Project Overview

This project designs and implements a cloud-based examination and assignment submission platform for a university with approximately 8,000 students and 400 staff.

The platform is designed to support:

- Student, tutor, and administrator roles.
- Online examinations with MCQ and short-answer questions.
- Examination answer saving.
- Assignment submissions using PDF or ZIP files up to 50 MB.
- Asynchronous marking and notifications.
- High availability across two AWS Availability Zones.

The architecture targets 99.9% availability during examinations, a Recovery Point Objective (RPO) of 5 minutes, and a Recovery Time Objective (RTO) of 1 hour.

These are design targets and are not all verified production results.

### 2. Project Technologies

**Frontend:** React, Vite, Nginx

**Backend:** Node.js, Express

**Database:** PostgreSQL

**Containerization:** Docker, Docker Compose

**Infrastructure as Code:** Terraform

**CI/CD:** GitHub Actions

**AWS services:** Amazon VPC, EC2, Auto Scaling, Application Load Balancer, RDS PostgreSQL, S3, SQS, ECR, CloudFront, IAM, Secrets Manager, and other services documented in `docs/services.md`.

### 3. Architecture Design

The proposed production architecture uses two Availability Zones with public, private application, and isolated database subnets.

CloudFront delivers the frontend. An Application Load Balancer distributes API traffic to EC2 instances. PostgreSQL stores application data, S3 stores assignment files, and SQS supports asynchronous processing.

The architecture also includes security, monitoring, and automated deployment components.

See:

- `architecture/final-architecture.json`
- `architecture/screenshots/architecture-diagram.png`
- `architecture/peak-load-and-az-resilience.md`

### 4. Cloud Architecture Lab

The architecture was built and simulated in Cloud Architecture Lab.

The following scenarios were tested:

1. Student retrieves an examination and submits an autosave request.
2. Assignment submission confirmation and asynchronous processing through SQS.
3. Availability Zone A failure.
4. Availability Zone B failure.

The simulations returned successful responses in the documented scenarios.

The second walkthrough demonstrates asynchronous processing but does not independently verify an actual 40 MB S3 upload or tutor email delivery.

Evidence is available in `evidence/cloud-architecture-lab/`.

### 5. Repository Structure

```text
DSO303-Assignment2/
├── .github/workflows/       # GitHub Actions CI/CD
├── architecture/            # Architecture diagram and walkthroughs
├── backend/                 # Express backend
├── docs/                    # Documentation and testing results
├── evidence/                # Screenshots and implementation evidence
├── frontend/                # React frontend
├── terraform/               # AWS infrastructure configuration
├── docker-compose.yml       # Local container configuration
└── README.md                # Project documentation
```

### 6. Local Deployment

**Prerequisites**

- Git
- Docker and Docker Compose

Clone the repository:

```bash
git clone https://github.com/Namgay282004/DSO303-Assignment2.git
cd DSO303-Assignment2
```

Configure the required environment variables for the backend and database.

Do not commit passwords, JWT secrets, or database credentials to GitHub.

Build and start the local application:

```bash
docker compose up -d --build
```

Check the running containers:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs --tail=100
```

Stop the local application:

```bash
docker compose down
```

### 7. AWS Infrastructure Deployment

**Prerequisites**

- AWS account with suitable permissions
- AWS CLI
- Terraform
- Docker
- Configured AWS credentials

The Terraform configuration is located in `terraform/`.

Initialize Terraform:

```bash
cd terraform
terraform init
```

Validate the configuration:

```bash
terraform fmt -check
terraform validate
```

Review the proposed changes:

```bash
terraform plan \
  -var="enable_nat_gateways=true" \
  -var="db_multi_az=true"
```

Do **not** run `terraform apply` on the live deployment until the launch-template drift and full plan have been reviewed and reconciled.

**Important:** The current AWS deployment includes launch template changes made outside Terraform. The configuration must be reconciled before applying a full Terraform plan. An unreviewed apply could replace the working launch template configuration.

See `docs/deployment-guide.md` for further deployment details.

### 8. CI/CD Pipeline

The GitHub Actions workflow is defined in:

`.github/workflows/deploy.yml`

The workflow includes:

- Docker image builds.
- Backend image publishing to Amazon ECR.
- AWS authentication using GitHub OIDC.
- EC2 launch template version management.
- Auto Scaling instance refresh.
- Frontend deployment to Amazon S3.
- CloudFront cache invalidation.

A push to `main` successfully completed all three GitHub Actions jobs: build, backend ECR publication and Auto Scaling instance refresh, and frontend S3 deployment with CloudFront invalidation. See `evidence/cicd/github-actions-success.png`.

### 9. Current AWS Deployment

The project has deployed infrastructure including:

- VPC networking across two Availability Zones.
- Amazon EC2 and Auto Scaling.
- Application Load Balancer.
- Amazon ECR backend image repository.
- Amazon RDS PostgreSQL.
- Amazon S3 buckets.
- Amazon SQS queues.
- CloudFront frontend hosting.

The backend `/health` endpoint has returned HTTP 200 through the Application Load Balancer.

Verified in AWS: frontend and API HTTP 200 health checks, RDS database connectivity, exam submission and SQS-driven MCQ marking, 40 MB presigned S3 uploads and database confirmation, SQS-driven assignment processing and a tutor notification database record. Live AZ failover, peak throughput and email delivery were not verified.

### 10. Testing and Evidence

Evidence is organized into:

- `evidence/cloud-architecture-lab/`
- `evidence/aws-deployment/`
- `evidence/cicd/`
- `evidence/terraform/`

### 10.1 AWS Console evidence 

The following screenshots are original AWS Console captures of the deployed configuration:

| Component | Evidence |
|---|---|
| VPC and six subnets in two AZs | [VPC resource map](evidence/aws-deployment/vpc-resource-map.png), [subnet list](evidence/aws-deployment/vpc-subnets.png) |
| RDS PostgreSQL Multi-AZ | [RDS configuration](evidence/aws-deployment/rds-multi-az.png) |
| EC2 Auto Scaling | [ASG details](evidence/aws-deployment/auto-scaling-group.png), [healthy instance](evidence/aws-deployment/ec2-instance.png) |
| ALB and target group | [Resource map](evidence/aws-deployment/alb-resource-map.png), [healthy target](evidence/aws-deployment/alb-target-group.png) |
| 40 MB S3 objects | [S3 submission objects](evidence/aws-deployment/s3-submissions.png) |
| SQS and DLQ | [Main queue](evidence/aws-deployment/sqs-marking-queue.png), [DLQ](evidence/aws-deployment/sqs-dead-letter-queue.png) |
| CloudFront and ECR | [CloudFront](evidence/aws-deployment/cloudfront-distribution.png), [ECR images](evidence/aws-deployment/ecr-images.png) |
| Automatic deployment | [GitHub Actions success](evidence/cicd/github-actions-success.png) |
| Background assignment processing | [Database verification](evidence/aws-deployment/assignment-processing-test.md) |

The AWS screenshots establish resource configuration; application test records provide separate evidence of functional behavior.

Additional testing documentation is available in:

- `docs/testing-results.md`
- `architecture/walkthrough-1-exam-autosave.md`
- `architecture/walkthrough-2-assignment-upload.md`

### 11. Tear-Down Instructions

**Local environment**

Stop the application:

```bash
docker compose down
```

**AWS environment**

Before destroying AWS resources:

1. Save required screenshots and deployment evidence.
2. Back up any important database records and assignment files.
3. Review S3 bucket contents and retention requirements.
4. Review Terraform state and any resources created outside Terraform.
5. Generate and inspect a Terraform destroy plan.

From the `terraform/` directory:

```bash
terraform plan -destroy \
  -var="enable_nat_gateways=true" \
  -var="db_multi_az=true"
```

After reviewing the plan and confirming that resource deletion is permitted, the infrastructure can be removed using:

```bash
terraform destroy \
  -var="enable_nat_gateways=true" \
  -var="db_multi_az=true"
```

**Warning:** These are destructive commands. Do not execute them during assignment testing or before submission. Resources outside Terraform state may require separate cleanup.

### 12. Limitations

The Cloud Architecture Lab simulations demonstrate modeled system behavior. They do not prove production performance.

The 40 MB upload, asynchronous worker and automatic GitHub Actions deployment have been verified. Remaining gaps: result-release email, measured peak capacity and real AWS failover/RPO/RTO, a verified 30-second periodic autosave schedule (the UI currently saves about 700 ms after a change), five-year retention enforcement, and end-to-end HTTPS on the API path. The current Auto Scaling desired capacity of one does not guarantee uninterrupted service during an AZ failure.

### 13. Conclusion

This project demonstrates the design and tested AWS deployment of a scalable university examination and assignment submission platform using AWS.

It combines cloud architecture design, infrastructure as code, containerization, simulated failure testing, and a CI/CD workflow.

The repository includes architecture documentation, implementation code, screenshots and test evidence, with unverified production targets clearly identified.