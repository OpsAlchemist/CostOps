# Deployment Guide

CostOps AI supports three deployment targets: Vercel (serverless), Docker Compose (local/staging), and AWS ECS Fargate (production).

---

## 1. Vercel Deployment (Serverless)

Best for: Quick deployments, preview environments, low-traffic usage.

### How It Works

- Frontend is built as a static Vite SPA via `@vercel/static-build`
- Backend runs as a Python serverless function at `api/index.py`
- `api/index.py` wraps the FastAPI app for Vercel's Python runtime
- Routing is handled by `vercel.json`

### Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.py" },
    { "src": "/(.*)", "dest": "/frontend/$1" }
  ],
  "env": {
    "VITE_ADMIN": "true",
    "VITE_API_BASE_URL": "/api"
  }
}
```

### Deploy Steps

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard:
   - `AI_PROVIDER`, `GEMINI_API_KEY` or `NOVA_API_KEY`
   - `JWT_SECRET`, `FERNET_KEY`
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_REGION`
   - `DB_USE_IAM_AUTH`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - `PRICING_SOURCE`
3. Push to `main` branch — Vercel auto-deploys

### Notes

- The frontend build script is `vercel-build: vite build`
- The backend needs network access to your RDS instance (Vercel functions run in AWS Lambda)
- Cold starts may be slow due to SQLAlchemy + boto3 imports

---

## 2. Docker Compose (Local / Staging)

Best for: Local development, staging environments, team testing.

### Architecture

```
docker-compose.yml
├── backend  (Python 3.11-slim, port 8000)
├── frontend (Node 20, port 3000)
└── postgres (optional, commented out)
```

### `docker-compose.yml`

```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: [.env]
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - FERNET_KEY=${FERNET_KEY}
      - PRICING_SOURCE=${PRICING_SOURCE:-ai}
      - DB_USE_IAM_AUTH=${DB_USE_IAM_AUTH:-false}

  frontend:
    build:
      context: ./frontend
      args: [VITE_ADMIN=true]
    ports: ["3000:3000"]
    environment:
      - BACKEND_URL=http://backend:8000
    depends_on: [backend]
```

### Deploy Steps

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your values

# 2. Build and start
docker compose up --build -d

# 3. Verify
curl http://localhost:8000/api/health
open http://localhost:3000
```

### Local Development with PostgreSQL

Uncomment the `postgres` service in `docker-compose.yml`:

```yaml
postgres:
  image: postgres:15
  environment:
    POSTGRES_DB: cost_calculator
    POSTGRES_USER: user
    POSTGRES_PASSWORD: pass
  ports: ["5432:5432"]
```

Set in `.env`:
```
DB_USE_IAM_AUTH=false
DB_HOST=postgres       # Docker service name
DB_PASSWORD=pass
DB_NAME=cost_calculator
DB_USER=user
```

### Dockerfiles

**Backend (`backend/Dockerfile`):**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend (`frontend/Dockerfile`):**
- Multi-stage build: `node:20` builder → `node:20-alpine` runner
- Builds Vite SPA, then serves via Express (`server.ts`) with `tsx`
- Runs as non-root user (`appuser:nodejs`)
- Accepts `VITE_ADMIN` build arg

---

## 3. AWS ECS Fargate (Production)

Best for: Production workloads, auto-scaling, high availability.

### Infrastructure Overview

Managed by Terraform in the `cloud/` directory.

| Resource | Description |
|----------|-------------|
| VPC | `10.0.0.0/16` with public + private subnets across 2 AZs |
| ALB | Internet-facing, HTTPS with ACM certificate |
| ECS Cluster | Fargate launch type, Container Insights enabled |
| Frontend Service | 2 tasks (default), port 3000 |
| Backend Service | 2 tasks (default), port 8000 |
| NAT Gateway | For private subnet internet access |
| VPC Endpoints | ECR API, ECR DKR, S3, CloudWatch Logs |
| CloudWatch | Log groups with configurable retention |
| IAM Roles | Task execution role + task role |

### ALB Routing

| Rule | Target |
|------|--------|
| `/*` (default) | Frontend target group (:3000) |
| `/api/*` (priority 100) | Backend target group (:8000) |

HTTP (port 80) redirects to HTTPS (port 443) with 301.

### Deploy Steps

```bash
cd cloud

# 1. Initialize Terraform
terraform init

# 2. Create terraform.tfvars
cat > terraform.tfvars <<EOF
aws_region                  = "us-east-1"
project_name                = "costops"
environment                 = "prod"
ecr_frontend_repository_url = "123456789012.dkr.ecr.us-east-1.amazonaws.com/costops-frontend"
ecr_backend_repository_url  = "123456789012.dkr.ecr.us-east-1.amazonaws.com/costops-backend"
frontend_image_tag          = "latest"
backend_image_tag           = "latest"
acm_certificate_arn         = "arn:aws:acm:us-east-1:123456789012:certificate/xxx"
domain_name                 = "example.com"
subdomain                   = "costops.example.com"
openai_api_key              = "your-api-key"
EOF

# 3. Plan and apply
terraform plan
terraform apply

# 4. Get outputs
terraform output alb_dns_name
terraform output frontend_url
```

### Terraform Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS region |
| `project_name` | `costops` | Resource name prefix |
| `environment` | `prod` | `dev`, `staging`, or `prod` |
| `vpc_cidr` | `10.0.0.0/16` | VPC CIDR block |
| `frontend_cpu` | `512` | Frontend task CPU units |
| `frontend_memory` | `1024` | Frontend task memory (MB) |
| `frontend_desired_count` | `2` | Number of frontend tasks |
| `backend_cpu` | `512` | Backend task CPU units |
| `backend_memory` | `1024` | Backend task memory (MB) |
| `backend_desired_count` | `2` | Number of backend tasks |
| `backend_health_check_path` | `/health` | Health check endpoint |
| `log_retention_days` | `7` | CloudWatch log retention |
| `single_nat_gateway` | `false` | Use single NAT (cost savings) |
| `enable_deletion_protection` | `false` | ALB deletion protection |
| `ecr_frontend_repository_url` | — | ECR repo URL for frontend |
| `ecr_backend_repository_url` | — | ECR repo URL for backend |
| `acm_certificate_arn` | — | ACM cert ARN for HTTPS |
| `domain_name` | `""` | Root domain |
| `subdomain` | `""` | Full subdomain |
| `openai_api_key` | — | AI API key (sensitive) |

### Pushing Docker Images to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t costops-backend ./backend
docker tag costops-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/costops-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/costops-backend:latest

# Build and push frontend
docker build -t costops-frontend ./frontend
docker tag costops-frontend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/costops-frontend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/costops-frontend:latest

# Force new deployment
aws ecs update-service --cluster costops-cluster --service costops-backend-service --force-new-deployment
aws ecs update-service --cluster costops-cluster --service costops-frontend-service --force-new-deployment
```

---

## 4. CI/CD Pipeline (`.github/workflows/ci-ecr.yml`)

Runs on every push and pull request to any branch.

### Jobs

| Job | Steps |
|-----|-------|
| **Backend** | Install Python 3.11, install deps, run `pytest` with test Postgres |
| **Frontend** | Install Node 20, `npm ci`, type check (`tsc --noEmit`), `vitest --run`, `vite build` |
| **Docker** | Build both Docker images, run backend smoke test |

### CI Environment

The backend CI job spins up a PostgreSQL 15 service container:
```
POSTGRES_DB: cost_calculator_test
POSTGRES_USER: user
POSTGRES_PASSWORD: pass
```

Test environment variables:
```
DB_USE_IAM_AUTH=false (uses password auth)
JWT_SECRET=test-secret-key-for-ci-only
PRICING_SOURCE=ai
```

---

## 5. Notes

- The `documentations/` directory is tracked in version control (it is **not** listed in `.gitignore`). Documentation updates should be committed alongside code changes.
