
resource "aws_sqs_queue" "marking_dlq" {
  name = "DSO303-Assignment2-Marking-DLQ"

  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true

  tags = {
    Project = "DSO303-Assignment2"
  }
}

resource "aws_sqs_queue" "marking" {
  name = "DSO303-Assignment2-Marking-Jobs"

  visibility_timeout_seconds = 180
  message_retention_seconds  = 345600
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.marking_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Project = "DSO303-Assignment2"
  }
}
