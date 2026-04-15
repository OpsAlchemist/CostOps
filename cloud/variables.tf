# ========================================
# General Configuration Variables
# ========================================

variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
  default     = "costops"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# ========================================
# VPC and Network Configuration
# ========================================

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (for ALB)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (for ECS tasks)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway for cost savings (not recommended for production)"
  type        = bool
  default     = false
}

# ========================================
# ECR Configuration
# ========================================

variable "ecr_frontend_repository_url" {
  description = "ECR repository URL for frontend Docker image (e.g., 123456789012.dkr.ecr.us-east-1.amazonaws.com/costops-frontend)"
  type        = string
}

variable "ecr_backend_repository_url" {
  description = "ECR repository URL for backend Docker image (e.g., 123456789012.dkr.ecr.us-east-1.amazonaws.com/costops-backend)"
  type        = string
}

variable "frontend_image_tag" {
  description = "Docker image tag for frontend (e.g., latest, v1.0.0, commit-sha)"
  type        = string
  default     = "latest"
}

variable "backend_image_tag" {
  description = "Docker image tag for backend (e.g., latest, v1.0.0, commit-sha)"
  type        = string
  default     = "latest"
}

# ========================================
# ECS Task Configuration - Frontend
# ========================================

variable "frontend_cpu" {
  description = "CPU units for frontend task (256=0.25vCPU, 512=0.5vCPU, 1024=1vCPU, 2048=2vCPU, 4096=4vCPU)"
  type        = string
  default     = "512"
  validation {
    condition     = contains(["256", "512", "1024", "2048", "4096"], var.frontend_cpu)
    error_message = "Frontend CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "frontend_memory" {
  description = "Memory for frontend task in MB (must be compatible with CPU - see AWS Fargate documentation)"
  type        = string
  default     = "1024"
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks to run"
  type        = number
  default     = 2
  validation {
    condition     = var.frontend_desired_count >= 1 && var.frontend_desired_count <= 10
    error_message = "Frontend desired count must be between 1 and 10."
  }
}

# ========================================
# ECS Task Configuration - Backend
# ========================================

variable "backend_cpu" {
  description = "CPU units for backend task (256=0.25vCPU, 512=0.5vCPU, 1024=1vCPU, 2048=2vCPU, 4096=4vCPU)"
  type        = string
  default     = "512"
  validation {
    condition     = contains(["256", "512", "1024", "2048", "4096"], var.backend_cpu)
    error_message = "Backend CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "backend_memory" {
  description = "Memory for backend task in MB (must be compatible with CPU - see AWS Fargate documentation)"
  type        = string
  default     = "1024"
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks to run"
  type        = number
  default     = 2
  validation {
    condition     = var.backend_desired_count >= 1 && var.backend_desired_count <= 10
    error_message = "Backend desired count must be between 1 and 10."
  }
}

variable "backend_health_check_path" {
  description = "Health check path for backend service"
  type        = string
  default     = "/health"
}

variable "openai_api_key" {
  description = "OpenAI API key for AI recommendations"
  type        = string
  sensitive   = true
}

# ========================================
# Load Balancer Configuration
# ========================================

variable "enable_deletion_protection" {
  description = "Enable deletion protection for the Application Load Balancer"
  type        = bool
  default     = false
}

# ========================================
# CloudWatch Logs Configuration
# ========================================

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 7
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch Logs retention period."
  }
}

# ========================================
# DNS and SSL Configuration
# ========================================

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS"
  type        = string
}

variable "domain_name" {
  description = "Root domain name (e.g., opsalchemistlabs.co.in)"
  type        = string
  default     = ""
}

variable "subdomain" {
  description = "Full subdomain for the application (e.g., costops.opsalchemistlabs.co.in)"
  type        = string
  default     = ""
}
