resource "aws_s3_bucket_cors_configuration" "assignments" {
  bucket = aws_s3_bucket.assignments.id

  cors_rule {
    allowed_headers = ["Content-Type"]
    allowed_methods = ["PUT"]
    allowed_origins = ["https://d1aqk07me8w74.cloudfront.net"]
    expose_headers  = ["ETag"]
    max_age_seconds = 300
  }
}
