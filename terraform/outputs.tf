
# ==========================================================
# DSO303 Assignment 2 - Terraform Outputs
# ==========================================================

output "vpc_id" {
  description = "Assignment 2 VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id
  ]
}

output "private_app_subnet_ids" {
  description = "Private application subnet IDs"
  value = [
    aws_subnet.private_app_a.id,
    aws_subnet.private_app_b.id
  ]
}

output "database_subnet_ids" {
  description = "Isolated database subnet IDs"
  value = [
    aws_subnet.database_a.id,
    aws_subnet.database_b.id
  ]
}

output "alb_dns_name" {
  description = "Public ALB DNS name"
  value       = aws_lb.api.dns_name
}

output "api_autoscaling_group_name" {
  description = "API Auto Scaling Group name"
  value       = aws_autoscaling_group.api.name
}

output "api_target_group_arn" {
  description = "API target group ARN"
  value       = aws_lb_target_group.api.arn
}


# GitHub Actions deployment role ARN
output "github_actions_role_arn" {
  description = "IAM role assumed by GitHub Actions using OIDC"
  value       = aws_iam_role.github_deploy.arn
}

# Backend ECR repository URL
output "backend_ecr_repository_url" {
  description = "ECR repository for the Node.js backend"
  value       = aws_ecr_repository.backend.repository_url
}


# ==========================================================
# Frontend Deployment Outputs
# ==========================================================

output "frontend_s3_bucket_name" {
  description = "S3 bucket used for React frontend hosting"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_frontend_url" {
  description = "HTTPS URL for the deployed React frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}
