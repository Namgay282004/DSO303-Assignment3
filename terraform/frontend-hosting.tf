
# ==========================================================
# DSO303 Assignment 2
# React Frontend Hosting - S3 + CloudFront
# ==========================================================

# ----------------------------------------------------------
# 1. Private S3 Bucket for React Frontend
# ----------------------------------------------------------

resource "aws_s3_bucket" "frontend" {
  bucket_prefix = "dso303-assignment2-frontend-"

  tags = {
    Name    = "DSO303-Frontend"
    Project = "DSO303-Assignment2"
  }
}

# Block all public access to frontend files.
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable server-side encryption.
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ----------------------------------------------------------
# 2. CloudFront Origin Access Control
# ----------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "dso303-frontend-oac"
  description                       = "Private S3 access for DSO303 frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ----------------------------------------------------------
# 3. CloudFront Distribution
# ----------------------------------------------------------

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "DSO303 Assignment 2 Frontend and API"
  default_root_object = "index.html"
  price_class         = "PriceClass_200"

  # --------------------------------------------------------
  # Origin 1: Private S3 React Frontend
  # --------------------------------------------------------

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "frontend-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # --------------------------------------------------------
  # Origin 2: Application Load Balancer for Backend API
  # --------------------------------------------------------

  origin {
    domain_name = aws_lb.api.dns_name
    origin_id   = "backend-alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # --------------------------------------------------------
  # Default Behavior: React Frontend
  # --------------------------------------------------------

  default_cache_behavior {
    target_origin_id       = "frontend-s3"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    compress = true
  }

  # --------------------------------------------------------
  # API Behavior: Forward Requests to Backend ALB
  # --------------------------------------------------------

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "backend-alb"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = [
      "GET",
      "HEAD",
      "OPTIONS",
      "PUT",
      "POST",
      "PATCH",
      "DELETE"
    ]

    cached_methods = [
      "GET",
      "HEAD",
      "OPTIONS"
    ]

    # Forward API query strings, authentication headers,
    # content type, origin headers, and cookies.
    forwarded_values {
      query_string = true

      headers = [
        "Authorization",
        "Content-Type",
        "Origin"
      ]

      cookies {
        forward = "all"
      }
    }

    # Disable caching for dynamic API requests.
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0

    compress = true
  }

  # --------------------------------------------------------
  # Geographic Restrictions
  # --------------------------------------------------------

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # --------------------------------------------------------
  # HTTPS for CloudFront Viewers
  # --------------------------------------------------------

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name    = "DSO303-Frontend-CloudFront"
    Project = "DSO303-Assignment2"
  }
}

# ----------------------------------------------------------
# 4. S3 Bucket Policy - CloudFront Access Only
# ----------------------------------------------------------

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "AllowCloudFrontRead"
        Effect = "Allow"

        Principal = {
          Service = "cloudfront.amazonaws.com"
        }

        Action = "s3:GetObject"

        Resource = "${aws_s3_bucket.frontend.arn}/*"

        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.frontend
  ]
}
