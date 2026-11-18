
# Database subnet group across two Availability Zones
resource "aws_db_subnet_group" "main" {
  name = "dso303-assignment2-db-subnets"

  subnet_ids = [
    aws_subnet.database_a.id,
    aws_subnet.database_b.id
  ]

  tags = {
    Name    = "DSO303-Database-Subnet-Group"
    Project = "DSO303-Assignment2"
  }
}

# PostgreSQL RDS database
resource "aws_db_instance" "postgres" {
  identifier = "dso303-assignment2-postgres"

  engine         = "postgres"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 20
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "dso303"
  username = "dso303admin"

  # AWS manages the master password in Secrets Manager
  manage_master_user_password = true

  multi_az = var.db_multi_az

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]

  publicly_accessible = false

  backup_retention_period = 0
  deletion_protection     = false
  skip_final_snapshot     = true

  auto_minor_version_upgrade = true

  tags = {
    Name    = "DSO303-PostgreSQL"
    Project = "DSO303-Assignment2"
  }
}
