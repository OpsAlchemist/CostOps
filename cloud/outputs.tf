# ========================================
# Load Balancer Outputs
# ========================================

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "Full URL of the Application Load Balancer (HTTP)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer (for Route53 alias records)"
  value       = aws_lb.main.zone_id
}

# ========================================
# ECS Cluster Outputs
# ========================================

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

# ========================================
# ECS Service Outputs - Frontend
# ========================================

output "frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "frontend_service_id" {
  description = "ID of the frontend ECS service"
  value       = aws_ecs_service.frontend.id
}

output "frontend_task_definition_arn" {
  description = "ARN of the frontend task definition"
  value       = aws_ecs_task_definition.frontend.arn
}

output "frontend_target_group_arn" {
  description = "ARN of the frontend target group"
  value       = aws_lb_target_group.frontend.arn
}

# ========================================
# ECS Service Outputs - Backend
# ========================================

output "backend_service_name" {
  description = "Name of the backend ECS service"
  value       = aws_ecs_service.backend.name
}

output "backend_service_id" {
  description = "ID of the backend ECS service"
  value       = aws_ecs_service.backend.id
}

output "backend_task_definition_arn" {
  description = "ARN of the backend task definition"
  value       = aws_ecs_task_definition.backend.arn
}

output "backend_target_group_arn" {
  description = "ARN of the backend target group"
  value       = aws_lb_target_group.backend.arn
}

# ========================================
# VPC Outputs
# ========================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnets
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnets
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = module.vpc.natgw_ids
}

# ========================================
# Security Group Outputs
# ========================================

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_tasks_security_group_id" {
  description = "ID of the ECS tasks security group"
  value       = aws_security_group.ecs_tasks.id
}

# ========================================
# CloudWatch Logs Outputs
# ========================================

output "cloudwatch_log_group_frontend" {
  description = "Name of the CloudWatch log group for frontend"
  value       = aws_cloudwatch_log_group.frontend.name
}

output "cloudwatch_log_group_backend" {
  description = "Name of the CloudWatch log group for backend"
  value       = aws_cloudwatch_log_group.backend.name
}

output "cloudwatch_log_group_frontend_arn" {
  description = "ARN of the CloudWatch log group for frontend"
  value       = aws_cloudwatch_log_group.frontend.arn
}

output "cloudwatch_log_group_backend_arn" {
  description = "ARN of the CloudWatch log group for backend"
  value       = aws_cloudwatch_log_group.backend.arn
}

# ========================================
# IAM Role Outputs
# ========================================

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

# ========================================
# Quick Access URLs
# ========================================

output "frontend_url" {
  description = "URL to access the frontend application"
  value       = "http://${aws_lb.main.dns_name}/"
}

output "backend_api_url" {
  description = "URL to access the backend API"
  value       = "http://${aws_lb.main.dns_name}/api"
}

output "backend_health_check_url" {
  description = "URL for backend health check endpoint"
  value       = "http://${aws_lb.main.dns_name}${var.backend_health_check_path}"
}

# ========================================
# Deployment Information
# ========================================

output "deployment_summary" {
  description = "Summary of the deployment configuration"
  value = {
    region              = var.aws_region
    environment         = var.environment
    cluster_name        = aws_ecs_cluster.main.name
    frontend_tasks      = var.frontend_desired_count
    backend_tasks       = var.backend_desired_count
    frontend_cpu_memory = "${var.frontend_cpu}/${var.frontend_memory}"
    backend_cpu_memory  = "${var.backend_cpu}/${var.backend_memory}"
    alb_url             = "http://${aws_lb.main.dns_name}"
  }
}
