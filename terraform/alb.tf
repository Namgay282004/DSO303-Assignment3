
# ==========================================================
# DSO303 Assignment 2
# Application Load Balancer
# Configuration only - do not apply yet
# ==========================================================

# Public Application Load Balancer
resource "aws_lb" "api" {
  name               = "dso303-assignment2-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups = [
    aws_security_group.alb.id
  ]

  subnets = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id
  ]

  enable_deletion_protection = false

  tags = {
    Name = "DSO303-Public-ALB"
  }
}

# Target group for API EC2 instances
resource "aws_lb_target_group" "api" {
  name        = "dso303-api-targets"
  port        = 3000
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200"
  }

  tags = {
    Name = "DSO303-API-Target-Group"
  }
}

# HTTPS listener will be enabled once an ACM
# certificate is available.
#
# Do not create an HTTP listener as a substitute:
# the existing ALB security group permits HTTPS 443,
# not public HTTP 80.
#
# Future configuration:
#
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.api.arn
#   port              = 443
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
#   certificate_arn   = var.alb_certificate_arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.api.arn
#   }
# }


# ==========================================================
# HTTP Listener - Temporary Assignment Demonstration
# ==========================================================

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}
