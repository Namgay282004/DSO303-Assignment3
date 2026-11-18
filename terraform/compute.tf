
# ==========================================================
# DSO303 Assignment 2
# EC2 Launch Template and Auto Scaling Group
# Docker-based Node.js API Deployment
# ==========================================================

data "aws_region" "current" {}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

resource "aws_launch_template" "api" {
  name_prefix   = "dso303-api-"
  description   = "Docker-based Node.js API for DSO303 Assignment 2"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.api.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.api.id]
    delete_on_termination       = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 16
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -euo pipefail

    exec > >(tee /var/log/dso303-bootstrap.log | logger -t dso303-bootstrap) 2>&1

    echo "Starting DSO303 backend deployment"

    REGION="${data.aws_region.current.region}"
    ECR_REPOSITORY="${aws_ecr_repository.backend.repository_url}"
    DB_HOST="${aws_db_instance.postgres.address}"
    DB_SECRET_ARN="${aws_db_instance.postgres.master_user_secret[0].secret_arn}"
    JWT_SECRET_ARN="${data.aws_secretsmanager_secret.jwt_signing_key.arn}"

    # Install Docker and AWS CLI.
    # Requires outbound connectivity through NAT.
    dnf install -y docker awscli jq

    systemctl enable --now docker

    # Retrieve the RDS-managed credentials.
    # Never print the secret to the bootstrap log.
    set +x
    DB_SECRET=$(aws secretsmanager get-secret-value \
      --region "$REGION" \
      --secret-id "$DB_SECRET_ARN" \
      --query SecretString \
      --output text)

    DB_USER=$(printf '%s' "$DB_SECRET" | jq -r '.username')
    DB_PASSWORD=$(printf '%s' "$DB_SECRET" | jq -r '.password')
    unset DB_SECRET

    # Retrieve JWT signing key from AWS Secrets Manager.
    # Never print the secret to logs.
    JWT_SECRET_VALUE=$(aws secretsmanager get-secret-value \
      --region "$REGION" \
      --secret-id "$JWT_SECRET_ARN" \
      --query SecretString \
      --output text)

    # Create an environment file with restricted permissions.
    install -d -m 700 /etc/dso303

    ENV_FILE="/etc/dso303/backend.env"

    printf 'NODE_ENV=production\nPORT=3000\nDB_HOST=%s\nDB_PORT=5432\nDB_USER=%s\nDB_NAME=dso303\nAWS_REGION=ap-south-1\nS3_SUBMISSIONS_BUCKET=${aws_s3_bucket.assignments.bucket}\n' \
      "$DB_HOST" "$DB_USER" > "$ENV_FILE"

    # Append the password without exposing it in Terraform.
    printf 'DB_PASSWORD=%s\n' "$DB_PASSWORD" >> "$ENV_FILE"

    # Add JWT configuration.
    printf 'JWT_SECRET=%s\n' "$JWT_SECRET_VALUE" >> "$ENV_FILE"
    printf 'JWT_EXPIRES_IN=2h\n' >> "$ENV_FILE"
        printf 'SQS_MARKING_QUEUE_URL=%s\n' '${aws_sqs_queue.marking.url}' >> "$ENV_FILE"

    chmod 600 "$ENV_FILE"

    unset DB_PASSWORD
    unset JWT_SECRET_VALUE

    # Authenticate Docker to Amazon ECR.
    aws ecr get-login-password --region "$REGION" \
      | docker login \
          --username AWS \
          --password-stdin \
          "$(echo "$ECR_REPOSITORY" | cut -d/ -f1)"

    # Download the published backend image.
    docker pull "$ECR_REPOSITORY:${var.backend_image_tag}"

    # Start the actual Node.js backend.
    docker run -d \
      --name dso303-backend \
      --restart unless-stopped \
      --env-file "$ENV_FILE" \
      -p 3000:3000 \
      "$ECR_REPOSITORY:${var.backend_image_tag}"

    echo "DSO303 backend container started"
  EOF
  )

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "DSO303-API"
      Role = "Exam-API"
    }
  }

  tags = {
    Name = "DSO303-API-Launch-Template"
  }
}

resource "aws_autoscaling_group" "api" {


  instance_refresh {
    strategy = "Rolling"

    preferences {
      min_healthy_percentage = 100
      max_healthy_percentage = 200
      instance_warmup        = 180
      auto_rollback          = true
    }
  }


  name_prefix = "dso303-api-asg-"

  vpc_zone_identifier = [
    aws_subnet.private_app_a.id,
    aws_subnet.private_app_b.id
  ]

  # Keep instances stopped until deployment is ready.
  min_size         = 0
  desired_capacity = 1
  max_size         = 2

  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.api.id
    version = aws_launch_template.api.latest_version
  }

  target_group_arns = [
    aws_lb_target_group.api.arn
  ]

  tag {
    key                 = "Name"
    value               = "DSO303-API-AutoScaling"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = "DSO303-Assignment2"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true

    # GitHub Actions manages the deployed launch template version.
    ignore_changes = [
      launch_template[0].version
    ]
  }
}
