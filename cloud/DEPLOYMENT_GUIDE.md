# ECS Fargate Deployment Guide

Complete step-by-step guide for deploying your application to AWS ECS Fargate using Terraform.

## Prerequisites Checklist

- [ ] AWS Account with admin or appropriate IAM permissions
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform >= 1.0 installed
- [ ] Docker installed locally
- [ ] Application Docker images built and tested locally

## Step-by-Step Deployment

### Phase 1: Prepare ECR Repositories

#### 1.1 Set Environment Variables

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION="us-east-1"  # Change to your preferred region
export PROJECT_NAME="costops"
```

#### 1.2 Create ECR Repositories

```bash
# Create frontend repository
aws ecr create-repository \
    --repository-name ${PROJECT_NAME}-frontend \
    --region ${AWS_REGION} \
    --image-scanning-configuration scanOnPush=true

# Create backend repository
aws ecr create-repository \
    --repository-name ${PROJECT_NAME}-backend \
    --region ${AWS_REGION} \
    --image-scanning-configuration scanOnPush=true
```

#### 1.3 Authenticate Docker to ECR

```bash
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin \
    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
```

#### 1.4 Build and Push Docker Images

**Frontend:**
```bash
# Navigate to frontend directory
cd /path/to/frontend

# Build image
docker build -t ${PROJECT_NAME}-frontend:latest .

# Tag for ECR
docker tag ${PROJECT_NAME}-frontend:latest \
    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest

# Push to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
```

**Backend:**
```bash
# Navigate to backend directory
cd /path/to/backend

# Build image
docker build -t ${PROJECT_NAME}-backend:latest .

# Tag for ECR
docker tag ${PROJECT_NAME}-backend:latest \
    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest

# Push to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest
```

#### 1.5 Verify Images in ECR

```bash
# List frontend images
aws ecr list-images --repository-name ${PROJECT_NAME}-frontend --region ${AWS_REGION}

# List backend images
aws ecr list-images --repository-name ${PROJECT_NAME}-backend --region ${AWS_REGION}
```

### Phase 2: Configure Terraform

#### 2.1 Navigate to Terraform Directory

```bash
cd /path/to/terraform
```

#### 2.2 Update terraform.tfvars

Create or edit `terraform.tfvars`:

```bash
cat > terraform.tfvars << EOF
# General Configuration
aws_region   = "${AWS_REGION}"
project_name = "${PROJECT_NAME}"
environment  = "prod"

# ECR Repository URLs
ecr_frontend_repository_url = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-frontend"
ecr_backend_repository_url  = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-backend"

# Image Tags
frontend_image_tag = "latest"
backend_image_tag  = "latest"

# Task Configuration
frontend_cpu           = "512"
frontend_memory        = "1024"
frontend_desired_count = 2

backend_cpu           = "512"
backend_memory        = "1024"
backend_desired_count = 2

# Network Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
single_nat_gateway   = false

# Monitoring
log_retention_days = 7

# Load Balancer
enable_deletion_protection = false
EOF
```

#### 2.3 Review Configuration

```bash
cat terraform.tfvars
```

### Phase 3: Deploy Infrastructure

#### 3.1 Initialize Terraform

```bash
terraform init
```

Expected output:
```
Initializing modules...
Initializing the backend...
Initializing provider plugins...
Terraform has been successfully initialized!
```

#### 3.2 Validate Configuration

```bash
terraform validate
```

#### 3.3 Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan carefully. You should see:
- VPC with public and private subnets
- Application Load Balancer
- ECS Cluster
- 2 ECS Services (frontend and backend)
- Security Groups
- IAM Roles
- CloudWatch Log Groups

#### 3.4 Apply Configuration

```bash
terraform apply tfplan
```

This will take approximately 5-10 minutes. Terraform will create:
- VPC infrastructure (~2 minutes)
- Load Balancer (~2 minutes)
- ECS Cluster and Services (~3-5 minutes)

#### 3.5 Save Outputs

```bash
terraform output > deployment-outputs.txt
cat deployment-outputs.txt
```

### Phase 4: Verify Deployment

#### 4.1 Get Application URL

```bash
export ALB_URL=$(terraform output -raw alb_url)
echo "Application URL: ${ALB_URL}"
```

#### 4.2 Wait for Services to Stabilize

```bash
# Check frontend service status
aws ecs describe-services \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-frontend-service \
    --query 'services[0].deployments[0].rolloutState' \
    --output text

# Check backend service status
aws ecs describe-services \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-backend-service \
    --query 'services[0].deployments[0].rolloutState' \
    --output text
```

Wait until both show `COMPLETED` (may take 3-5 minutes).

#### 4.3 Test Frontend

```bash
curl -I ${ALB_URL}/
```

Expected: HTTP 200 response

#### 4.4 Test Backend API

```bash
curl ${ALB_URL}/api/health
```

Expected: JSON response from your backend health endpoint

#### 4.5 Test in Browser

```bash
# On macOS
open ${ALB_URL}

# On Linux
xdg-open ${ALB_URL}

# Or copy the URL and paste in browser
echo ${ALB_URL}
```

### Phase 5: Monitor and Troubleshoot

#### 5.1 View Container Logs

**Frontend logs:**
```bash
aws logs tail /ecs/${PROJECT_NAME}-frontend --follow --region ${AWS_REGION}
```

**Backend logs:**
```bash
aws logs tail /ecs/${PROJECT_NAME}-backend --follow --region ${AWS_REGION}
```

#### 5.2 Check ECS Task Status

```bash
# List running tasks
aws ecs list-tasks \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name ${PROJECT_NAME}-frontend-service \
    --region ${AWS_REGION}

# Get task details
TASK_ARN=$(aws ecs list-tasks \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name ${PROJECT_NAME}-frontend-service \
    --query 'taskArns[0]' \
    --output text \
    --region ${AWS_REGION})

aws ecs describe-tasks \
    --cluster ${PROJECT_NAME}-cluster \
    --tasks ${TASK_ARN} \
    --region ${AWS_REGION}
```

#### 5.3 Check Target Group Health

```bash
# Get target group ARN
TG_ARN=$(terraform output -raw frontend_target_group_arn)

# Check health status
aws elbv2 describe-target-health \
    --target-group-arn ${TG_ARN} \
    --region ${AWS_REGION}
```

### Phase 6: Post-Deployment Configuration

#### 6.1 Set Up Custom Domain (Optional)

```bash
# Create Route 53 hosted zone
aws route53 create-hosted-zone \
    --name yourdomain.com \
    --caller-reference $(date +%s)

# Create alias record pointing to ALB
# (Use AWS Console or create JSON config)
```

#### 6.2 Enable HTTPS (Optional)

```bash
# Request ACM certificate
aws acm request-certificate \
    --domain-name yourdomain.com \
    --validation-method DNS \
    --region ${AWS_REGION}

# After validation, update Terraform to add HTTPS listener
```

#### 6.3 Configure Auto-Scaling (Optional)

Add to `main.tf` and reapply:
```hcl
resource "aws_appautoscaling_target" "frontend" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}
```

## Common Issues and Solutions

### Issue: Tasks Keep Restarting

**Symptoms:** Tasks start then immediately stop

**Solutions:**
1. Check CloudWatch logs for errors:
   ```bash
   aws logs tail /ecs/${PROJECT_NAME}-frontend --region ${AWS_REGION}
   ```
2. Verify container port matches task definition (3000 for frontend, 8000 for backend)
3. Ensure health check path is correct

### Issue: ALB Returns 503 Service Unavailable

**Symptoms:** ALB URL returns 503 error

**Solutions:**
1. Check target group health:
   ```bash
   aws elbv2 describe-target-health --target-group-arn $(terraform output -raw frontend_target_group_arn)
   ```
2. Verify security groups allow traffic:
   - ALB SG allows inbound 80/443
   - ECS Tasks SG allows inbound from ALB SG
3. Check if tasks are running:
   ```bash
   aws ecs list-tasks --cluster ${PROJECT_NAME}-cluster --service-name ${PROJECT_NAME}-frontend-service
   ```

### Issue: Cannot Pull ECR Images

**Symptoms:** Tasks fail with "CannotPullContainerError"

**Solutions:**
1. Verify ECR repository URLs in terraform.tfvars
2. Check task execution role has ECR permissions
3. Ensure images exist in ECR:
   ```bash
   aws ecr describe-images --repository-name ${PROJECT_NAME}-frontend
   ```

### Issue: High Costs

**Solutions:**
1. Use single NAT Gateway for non-production:
   ```hcl
   single_nat_gateway = true
   ```
2. Reduce task count:
   ```hcl
   frontend_desired_count = 1
   backend_desired_count = 1
   ```
3. Use smaller task sizes:
   ```hcl
   frontend_cpu = "256"
   frontend_memory = "512"
   ```

## Updating Your Application

### Update Docker Images

```bash
# Build new version
docker build -t ${PROJECT_NAME}-frontend:v1.1.0 .

# Tag and push
docker tag ${PROJECT_NAME}-frontend:v1.1.0 \
    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-frontend:v1.1.0
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-frontend:v1.1.0

# Update terraform.tfvars
frontend_image_tag = "v1.1.0"

# Apply changes
terraform apply
```

### Scale Services

```bash
# Edit terraform.tfvars
frontend_desired_count = 4

# Apply changes
terraform apply
```

## Cleanup

To destroy all resources:

```bash
# Review what will be destroyed
terraform plan -destroy

# Destroy infrastructure
terraform destroy

# Delete ECR repositories (optional)
aws ecr delete-repository --repository-name ${PROJECT_NAME}-frontend --force
aws ecr delete-repository --repository-name ${PROJECT_NAME}-backend --force
```

## Cost Monitoring

Set up billing alerts:

```bash
aws cloudwatch put-metric-alarm \
    --alarm-name ecs-high-cost-alert \
    --alarm-description "Alert when estimated charges exceed $200" \
    --metric-name EstimatedCharges \
    --namespace AWS/Billing \
    --statistic Maximum \
    --period 21600 \
    --evaluation-periods 1 \
    --threshold 200 \
    --comparison-operator GreaterThanThreshold
```

## Next Steps

1. **Set up CI/CD**: Integrate with GitHub Actions or AWS CodePipeline
2. **Add monitoring**: Configure CloudWatch dashboards and alarms
3. **Implement secrets**: Use AWS Secrets Manager for sensitive data
4. **Enable auto-scaling**: Configure target tracking policies
5. **Add HTTPS**: Request ACM certificate and add HTTPS listener
6. **Custom domain**: Configure Route 53 with your domain

## Support Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Support](https://console.aws.amazon.com/support/)

## Deployment Checklist

- [ ] ECR repositories created
- [ ] Docker images pushed to ECR
- [ ] terraform.tfvars configured with correct ECR URLs
- [ ] Terraform initialized
- [ ] Infrastructure deployed successfully
- [ ] Frontend accessible via ALB URL
- [ ] Backend API responding correctly
- [ ] CloudWatch logs showing container output
- [ ] Target groups showing healthy targets
- [ ] Cost monitoring configured
