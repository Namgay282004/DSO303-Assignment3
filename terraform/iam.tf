
# ==========================================================
# DSO303 Assignment 2
# IAM Roles, Policies, and Instance Profiles
# ==========================================================

# ----------------------------------------------------------
# 1. IAM Role for API EC2 Instances
# ----------------------------------------------------------

resource "aws_iam_role" "api" {
  name = "DSO303-Assignment2-API-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Project = "DSO303-Assignment2"
  }
}

# ----------------------------------------------------------
# 2. API Permissions for SQS and S3
# ----------------------------------------------------------

resource "aws_iam_role_policy" "api" {
  name = "DSO303-API-Policy"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.marking.arn
      },
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = [
          "${aws_s3_bucket.assignments.arn}/*"
        ]
      }
    ]
  })
}

# ----------------------------------------------------------
# 3. API Permissions for Amazon ECR
# ----------------------------------------------------------

# Allows EC2 to authenticate to ECR and pull Docker images.
resource "aws_iam_role_policy_attachment" "api_ecr_read" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPullOnly"
}

# ----------------------------------------------------------
# 4. API Permissions for AWS Secrets Manager
# ----------------------------------------------------------

# Allows the API to retrieve the RDS-managed master password.
# Access is restricted to the specific RDS secret.

resource "aws_iam_role_policy" "api_db_secret" {
  name = "DSO303-API-Database-Secret-Policy"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_db_instance.postgres.master_user_secret[0].secret_arn
      }
    ]
  })
}

# ----------------------------------------------------------
# 5. API EC2 Instance Profile
# ----------------------------------------------------------

resource "aws_iam_instance_profile" "api" {
  name = "DSO303-Assignment2-API-Profile"
  role = aws_iam_role.api.name
}

# ----------------------------------------------------------
# 6. IAM Role for Marking Worker EC2 Instances
# ----------------------------------------------------------

resource "aws_iam_role" "worker" {
  name = "DSO303-Assignment2-Worker-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Project = "DSO303-Assignment2"
  }
}

# ----------------------------------------------------------
# 7. Worker Permissions for SQS and S3
# ----------------------------------------------------------

resource "aws_iam_role_policy" "worker" {
  name = "DSO303-Worker-Policy"
  role = aws_iam_role.worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.marking.arn
      },
      {
        Effect = "Allow"
        Action = ["s3:GetObject"]
        Resource = [
          "${aws_s3_bucket.assignments.arn}/*"
        ]
      }
    ]
  })
}

# ----------------------------------------------------------
# 8. Worker EC2 Instance Profile
# ----------------------------------------------------------

resource "aws_iam_instance_profile" "worker" {
  name = "DSO303-Assignment2-Worker-Profile"
  role = aws_iam_role.worker.name
}



# ----------------------------------------------------------
# AWS Systems Manager access for backend EC2 instances
# ----------------------------------------------------------

resource "aws_iam_role_policy_attachment" "api_ssm" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# ----------------------------------------------------------
# API Permissions for JWT Signing Secret
# ----------------------------------------------------------

data "aws_secretsmanager_secret" "jwt_signing_key" {
  name = "dso303-assignment2/jwt-signing-key"
}

resource "aws_iam_role_policy" "api_jwt_secret" {
  name = "DSO303-API-JWT-Secret-Policy"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = data.aws_secretsmanager_secret.jwt_signing_key.arn
      }
    ]
  })
}
