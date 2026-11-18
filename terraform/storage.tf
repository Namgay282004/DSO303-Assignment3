
resource "aws_s3_bucket" "assignments" {
  bucket_prefix = "dso303-assignment2-submissions-"

  tags = {
    Name    = "DSO303-Assignment2-Submissions"
    Project = "DSO303-Assignment2"
  }
}

resource "aws_s3_bucket_public_access_block" "assignments" {
  bucket = aws_s3_bucket.assignments.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assignments" {
  bucket = aws_s3_bucket.assignments.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
