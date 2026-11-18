
# ==========================================================
# DSO303 Assignment 2 - Amazon ECR
# Backend Docker Image Repository
# ==========================================================

resource "aws_ecr_repository" "backend" {
  name                 = "dso303-assignment2-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name    = "DSO303-Backend-ECR"
    Project = "DSO303-Assignment2"
  }
}

# Keep the latest 10 Docker images to control storage costs.
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep the latest 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
