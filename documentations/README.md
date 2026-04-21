# CostOps AI — Developer Documentation

## Project Overview

CostOps AI is a multi-cloud cost estimation and optimization platform. It lets users calculate infrastructure costs across AWS, Azure, and GCP, receive AI-powered optimization recommendations, and manage cloud credentials — all from a single dashboard.

## Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript | Vite build, Tailwind CSS v4, React Router v7, Motion (Framer Motion) |
| Backend | Python 3.11 + FastAPI | Uvicorn ASGI server, Pydantic models, SQLAlchemy ORM |
| Database | PostgreSQL 15 | AWS RDS Aurora with IAM authentication, JSONB columns |
| AI | Google Gemini / Amazon Nova | Switchable via `AI_PROVIDER` env var |
| Auth | JWT (HS256) | python-jose, bcrypt password hashing, SHA-256 client-side pre-hash, 24h token expiry, RBAC with admin auto-assignment |
| Encryption | Fernet (AES-128-CBC) | Cloud credential encryption at rest |
| Logging | CloudWatch + stdout | watchtower library, environment-aware log streams |
| Infrastructure | Terraform + AWS ECS Fargate | VPC, ALB, ECS cluster, CloudWatch, VPC endpoints |
| CI/CD | GitHub Actions | Lint, test, Docker build validation on every push |
| Hosting | Vercel (serverless) / Docker Compose / ECS | Three deployment targets |

## Repository Structure

```
costops-ai/
├── api/
│   └── index.py                 # Vercel serverless entry point
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, routes, middleware
│   │   ├── auth.py              # JWT creation & validation
│   │   ├── crypto.py            # Fernet encrypt/decrypt
│   │   ├── database.py          # SQLAlchemy engine, session, IAM auth
│   │   ├── db_models.py         # ORM table definitions
│   │   ├── models.py            # Pydantic request schemas
│   │   ├── ai.py                # Gemini / Nova AI abstraction
│   │   ├── pricing.py           # Simple static pricing calculator
│   │   ├── pricing_config.py    # Runtime pricing source switch
│   │   ├── aws_pricing.py       # AWS cost calculation + AI pricing
│   │   ├── azure_pricing.py     # Azure cost calculation + AI pricing
│   │   ├── gcp_pricing.py       # GCP cost calculation + AI pricing
│   │   └── logging_config.py    # CloudWatch + stdout logging setup
│   ├── tests/                   # Pytest + Hypothesis property tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Router + provider tree
│   │   ├── main.tsx             # React DOM entry
│   │   ├── components/          # DashboardLayout, ThemeToggle
│   │   ├── context/             # AuthContext, ThemeContext, AdminContext
│   │   ├── pages/               # LandingPage, LoginPage, SignupPage, Settings
│   │   │   └── dashboard/       # Overview, Optimization, Reporting, CostCalculator, UserManagement
│   │   └── services/
│   │       └── apiService.ts    # API client with auth headers
│   ├── server.ts                # Express proxy + Vite SSR middleware
│   ├── Dockerfile
│   └── package.json
├── cloud/
│   ├── main.tf                  # ECS Fargate + ALB + VPC Terraform
│   ├── variables.tf             # Terraform input variables
│   └── outputs.tf               # Terraform outputs
├── .github/workflows/
│   └── ci-ecr.yml               # CI pipeline
├── docker-compose.yml
├── vercel.json
└── .env                         # Environment variables (not committed)
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15 (local or RDS)
- An AI API key (Gemini or Nova)

### 1. Clone and configure

```bash
git clone <repo-url>
cd costops-ai
cp .env.example .env   # Edit with your values
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# For local dev with Docker Postgres:
# DB_USE_IAM_AUTH=false DB_HOST=localhost DB_PASSWORD=pass

uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # Starts Express + Vite dev server on :3000
```

### 4. Docker Compose (full stack)

```bash
docker compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:8000/api/health
```

### 5. Run Tests

```bash
# Backend
cd backend && python -m pytest -v

# Frontend
cd frontend && npx vitest --run
```

## Quick Links

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, request flow diagrams |
| [API_REFERENCE.md](./API_REFERENCE.md) | All API endpoints with examples |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Tables, columns, relationships |
| [BACKEND_MODULES.md](./BACKEND_MODULES.md) | Python module reference |
| [FRONTEND_COMPONENTS.md](./FRONTEND_COMPONENTS.md) | React components, routing, contexts |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel, Docker, ECS deployment guides |
| [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) | Complete env var reference |
| [IMPROVEMENTS.md](./IMPROVEMENTS.md) | Known issues and improvement ideas |
