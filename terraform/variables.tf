
variable "db_instance_class" {
  description = "RDS PostgreSQL instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ RDS deployment"
  type        = bool
  default     = false
}

variable "backend_image_tag" {
  description = "ECR image tag used by the backend EC2 instances"
  type        = string
  default     = "s3-upload-20261115-180644"
}
