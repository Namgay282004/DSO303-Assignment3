
# NAT Gateway configuration for the final Multi-AZ deployment.
# Disabled by default to avoid hourly AWS charges.

variable "enable_nat_gateways" {
  description = "Deploy two NAT Gateways for the application subnets"
  type        = bool
  default     = false
}

# Elastic IP for NAT Gateway A
resource "aws_eip" "nat_a" {
  count  = var.enable_nat_gateways ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "DSO303-NAT-EIP-A"
  }
}

# Elastic IP for NAT Gateway B
resource "aws_eip" "nat_b" {
  count  = var.enable_nat_gateways ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "DSO303-NAT-EIP-B"
  }
}

# NAT Gateway A
resource "aws_nat_gateway" "nat_a" {
  count         = var.enable_nat_gateways ? 1 : 0
  allocation_id = aws_eip.nat_a[0].id
  subnet_id     = aws_subnet.public_a.id

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "DSO303-NAT-Gateway-A"
  }
}

# NAT Gateway B
resource "aws_nat_gateway" "nat_b" {
  count         = var.enable_nat_gateways ? 1 : 0
  allocation_id = aws_eip.nat_b[0].id
  subnet_id     = aws_subnet.public_b.id

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "DSO303-NAT-Gateway-B"
  }
}

# Separate private route tables for AZ A and AZ B.
# The existing private_app route table is reused for AZ A.

resource "aws_route_table" "private_app_b" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "Private-App-Route-Table-B"
  }
}

# Move Private App Subnet B to its own route table.
# IMPORTANT: Remove the old private_app_b association
# from main.tf before using this replacement.

resource "aws_route_table_association" "private_app_b" {
  subnet_id      = aws_subnet.private_app_b.id
  route_table_id = aws_route_table.private_app_b.id
}

# Outbound internet route for AZ A
resource "aws_route" "private_nat_a" {
  count                  = var.enable_nat_gateways ? 1 : 0
  route_table_id         = aws_route_table.private_app.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_a[0].id
}

# Outbound internet route for AZ B
resource "aws_route" "private_nat_b" {
  count                  = var.enable_nat_gateways ? 1 : 0
  route_table_id         = aws_route_table.private_app_b.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_b[0].id
}
