# ECS Fargate Deployment with Terraform

This Terraform configuration deploys a complete ECS Fargate infrastructure with ECR integration for a multi-container application (frontend on port 3000, backend on port 8000).

## Architecture Overview

- **VPC**: Public and private subnets across multiple availability zones
- **Application Load Balancer**: Path-based routing (/ → frontend, /api/* → backend)
- **ECS Fargate**: Serverless container orchestration
- **ECR Integration**: Pull Docker images from Amazon ECR
- **CloudWatch**: Container insights and log aggregation
- **Security Groups**: Proper isolation between ALB and ECS tasks

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **Docker images** pushed to ECR repositories
4. **AWS Account** with necessary permissions

## Quick Start

### 1. Push Docker Images to ECR

```bash
# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"

# Create ECR repositories
aws ecr create-repository --repository-name costops-frontend --region $AWS_REGION
aws ecr create-repository --repository-name costops-backend --region $AWS_REGION

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push frontend
docker tag costops-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/costops-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/costops-frontend:latest

# Tag and push backend
docker tag costops-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/costops-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/costops-backend:latest
```

### 2. Configure Variables

Edit `terraform.tfvars` and update the ECR repository URLs:

```hcl
ecr_frontend_repository_url = "<account-id>.dkr.ecr.<region>.amazonaws.com/costops-frontend"
ecr_backend_repository_url = "<account-id>.dkr.ecr.<region>.amazonaws.com/costops-backend"
```

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply

# Get the ALB URL
terraform output alb_url
```

### 4. Access Your Application

```bash
# Frontend
curl $(terraform output -raw alb_url)/

# Backend API
curl $(terraform output -raw alb_url)/api

# Backend health check
curl $(terraform output -raw backend_health_check_url)
```

## File Structure

```
terraform/
├── main.tf              # Main infrastructure configuration
├── variables.tf         # Input variable definitions
├── outputs.tf          # Output values
├── terraform.tfvars    # Variable values (customize this)
└── README.md           # This file
```

## Configuration Options

### Environment Sizing

**Development (Cost-Optimized)**
```hcl
frontend_cpu = "256"
frontend_memory = "512"
frontend_desired_count = 1
backend_cpu = "256"
backend_memory = "512"
backend_desired_count = 1
single_nat_gateway = true
```

**Production (High Availability)**
```hcl
frontend_cpu = "1024"
frontend_memory = "2048"
frontend_desired_count = 3
backend_cpu = "1024"
backend_memory = "2048"
backend_desired_count = 3
single_nat_gateway = false
enable_deletion_protection = true
```

### Fargate CPU/Memory Combinations

| CPU (units) | Memory Options (MB) |
|-------------|---------------------|
| 256 (0.25 vCPU) | 512, 1024, 2048 |
| 512 (0.5 vCPU) | 1024, 2048, 3072, 4096 |
| 1024 (1 vCPU) | 2048-8192 (1GB increments) |
| 2048 (2 vCPU) | 4096-16384 (1GB increments) |
| 4096 (4 vCPU) | 8192-30720 (1GB increments) |

## Important Outputs

After deployment, Terraform provides these key outputs:

- `alb_url` - Application Load Balancer URL
- `ecs_cluster_name` - ECS cluster name
- `frontend_service_name` - Frontend service name
- `backend_service_name` - Backend service name
- `cloudwatch_log_group_frontend` - Frontend logs location
- `cloudwatch_log_group_backend` - Backend logs location

## Monitoring and Troubleshooting

### View Container Logs

```bash
# Frontend logs
aws logs tail /ecs/costops-frontend --follow

# Backend logs
aws logs tail /ecs/costops-backend --follow
```

### Check Service Status

```bash
# List services
aws ecs list-services --cluster costops-cluster

# Describe service
aws ecs describe-services --cluster costops-cluster --services costops-frontend-service

# List running tasks
aws ecs list-tasks --cluster costops-cluster --service-name costops-frontend-service
```

### Common Issues

**Tasks Not Starting**
- Check CloudWatch logs for container errors
- Verify ECR image URLs are correct
- Ensure task execution role has ECR pull permissions

**503 Errors from ALB**
- Verify security groups allow traffic between ALB and ECS tasks
- Check health check path is correct
- Ensure containers are listening on correct ports

**High Costs**
- Reduce task count for non-production environments
- Use single NAT Gateway (`single_nat_gateway = true`)
- Consider Fargate Spot for dev/staging (70% cost savings)

## Cost Estimation

**Monthly costs (approximate):**

| Resource | Configuration | Monthly Cost |
|----------|--------------|--------------|
| ECS Fargate (Frontend) | 2 tasks × 0.5 vCPU, 1GB | ~$30 |
| ECS Fargate (Backend) | 2 tasks × 0.5 vCPU, 1GB | ~$30 |
| Application Load Balancer | 1 ALB | ~$20 |
| NAT Gateway | 2 NAT Gateways | ~$70 |
| Data Transfer | Varies | ~$10-50 |
| CloudWatch Logs | 7-day retention | ~$5 |
| **Total** | | **~$165-205/month** |

**Cost Optimization Tips:**
- Use single NAT Gateway: Save ~$35/month
- Reduce to 1 task each: Save ~$30/month
- Use Fargate Spot: Save up to 70% on compute

## Updating the Deployment

### Update Docker Images

```bash
# Build and push new images with version tag
docker tag costops-frontend:latest $ECR_URL/costops-frontend:v1.1.0
docker push $ECR_URL/costops-frontend:v1.1.0

# Update terraform.tfvars
frontend_image_tag = "v1.1.0"

# Apply changes
terraform apply
```

### Scale Services

```bash
# Update terraform.tfvars
frontend_desired_count = 4
backend_desired_count = 4

# Apply changes
terraform apply
```

## Security Best Practices

1. **Use specific image tags** instead of `latest` in production
2. **Enable deletion protection** for production ALB
3. **Use AWS Secrets Manager** for sensitive environment variables
4. **Enable VPC Flow Logs** for network monitoring
5. **Implement WAF** rules on the ALB for production
6. **Use HTTPS** with ACM certificates

## Adding HTTPS Support

1. Request certificate in AWS Certificate Manager
2. Add to `variables.tf`:
```hcl
variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}
```

3. Add HTTPS listener to `main.tf`:
```hcl
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning:** This will permanently delete all resources including logs. Ensure you have backups if needed.

## Support and Documentation

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [AWS ECR Documentation](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html)

## License

This Terraform configuration is provided as-is for deployment purposes.
