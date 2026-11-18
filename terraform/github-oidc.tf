
# ==========================================================
# DSO303 Assignment 2 - GitHub Actions OIDC
# ==========================================================

# Get the AWS account ID dynamically
data "aws_caller_identity" "current" {}

# ----------------------------------------------------------
# 1. GitHub Actions OIDC Identity Provider
# ----------------------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  tags = {
    Name    = "DSO303-GitHub-OIDC"
    Project = "DSO303-Assignment2"
  }
}

# ----------------------------------------------------------
# 2. GitHub Actions Deployment IAM Role
# ----------------------------------------------------------

resource "aws_iam_role" "github_deploy" {
  name = "DSO303-Assignment2-GitHub-Deploy-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }

        Action = "sts:AssumeRoleWithWebIdentity"

        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"

            # Match the actual OIDC subject recorded in CloudTrail.
            # Restrict access to this repository and main branch.
            "token.actions.githubusercontent.com:sub" = "repo:Namgay282004@141105656/DSO303-Assignment2@1452386293:ref:refs/heads/main"
          }
        }
      }
    ]
  })

  tags = {
    Name    = "DSO303-GitHub-Deploy-Role"
    Project = "DSO303-Assignment2"
  }
}

# ----------------------------------------------------------
# 3. Amazon ECR Push Permissions
# ----------------------------------------------------------

resource "aws_iam_role_policy" "github_ecr_push" {
  name = "DSO303-GitHub-ECR-Push"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "ecr:GetAuthorizationToken"
        ]

        Resource = "*"
      },
      {
        Effect = "Allow"

        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]

        Resource = aws_ecr_repository.backend.arn
      }
    ]
  })
}

# ----------------------------------------------------------
# 4. EC2 Auto Scaling Instance Refresh Permissions
# ----------------------------------------------------------

# Allow GitHub Actions to refresh backend EC2 instances
# after publishing a new Docker image to Amazon ECR.

resource "aws_iam_role_policy" "github_asg_refresh" {
  name = "DSO303-GitHub-ASG-Refresh"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "autoscaling:StartInstanceRefresh",
          "autoscaling:DescribeInstanceRefreshes"
        ]

        Resource = aws_autoscaling_group.api.arn
      }
    ]
  })
}

# ----------------------------------------------------------
# 5. Frontend S3 and CloudFront Deployment Permissions
# ----------------------------------------------------------

resource "aws_iam_role_policy" "github_frontend_deploy" {
  name = "DSO303-GitHub-Frontend-Deploy"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "s3:ListBucket"
        ]

        Resource = aws_s3_bucket.frontend.arn
      },
      {
        Effect = "Allow"

        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]

        Resource = "${aws_s3_bucket.frontend.arn}/*"
      },
      {
        Effect = "Allow"

        Action = [
          "cloudfront:CreateInvalidation"
        ]

        Resource = aws_cloudfront_distribution.frontend.arn
      }
    ]
  })
}

# GitHub Actions: publish new EC2 launch template versions
resource "aws_iam_role_policy" "github_launch_template_deploy" {
  name = "DSO303-GitHub-Launch-Template-Deploy"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeLaunchTemplates",
          "ec2:DescribeLaunchTemplateVersions",
          "ec2:CreateLaunchTemplateVersion",
          "ec2:ModifyLaunchTemplate"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeInstanceRefreshes"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:UpdateAutoScalingGroup",
          "autoscaling:StartInstanceRefresh"
        ]
        Resource = aws_autoscaling_group.api.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "github_ec2_passrole" {
  name = "DSO303-GitHub-EC2-PassRole"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = aws_iam_role.api.arn

        Condition = {
          StringEquals = {
            "iam:PassedToService" = "ec2.amazonaws.com"
          }
        }
      }
    ]
  })
}

# Allow GitHub Actions to launch EC2 instances
# using the API launch template.

resource "aws_iam_role_policy" "github_ec2_launch" {
  name = "DSO303-GitHub-EC2-Launch"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "AllowRunInstances"
        Effect = "Allow"

        Action = [
          "ec2:RunInstances"
        ]

        Resource = [
          "arn:aws:ec2:ap-south-1::image/*",
          "arn:aws:ec2:ap-south-1:${data.aws_caller_identity.current.account_id}:instance/*",
          "arn:aws:ec2:ap-south-1:${data.aws_caller_identity.current.account_id}:volume/*",
          "arn:aws:ec2:ap-south-1:${data.aws_caller_identity.current.account_id}:network-interface/*",
          "arn:aws:ec2:ap-south-1:${data.aws_caller_identity.current.account_id}:subnet/*",
          "arn:aws:ec2:ap-south-1:${data.aws_caller_identity.current.account_id}:security-group/*",
          "arn:aws:ec2:ap-south-1:${data.aws_caller_identity.current.account_id}:launch-template/*"
        ]

        Condition = {
          ArnEquals = {
            "ec2:LaunchTemplate" = aws_launch_template.api.arn
          }
        }
      }
    ]
  })
}

# Allow tags on instances created by the deployment.

resource "aws_iam_role_policy" "github_ec2_tags" {
  name = "DSO303-GitHub-EC2-Tags"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "AllowTagsOnNewEC2Instances"
        Effect = "Allow"

        Action = [
          "ec2:CreateTags"
        ]

        Resource = "arn:aws:ec2:ap-south-1:${data.aws_caller_identity.current.account_id}:instance/*"

        Condition = {
          StringEquals = {
            "ec2:CreateAction" = "RunInstances"
          }
        }
      }
    ]
  })
}
