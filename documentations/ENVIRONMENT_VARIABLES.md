# Environment Variables

Complete reference of all environment variables used across the project.

---

## AI Provider

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `AI_PROVIDER` | Yes | `"gemini"` | `backend/app/ai.py` | AI backend: `"gemini"` or `"nova"` |
| `GEMINI_API_KEY` | If `AI_PROVIDER=gemini` | — | `backend/app/ai.py` | Google Gemini API key |
| `NOVA_API_KEY` | If `AI_PROVIDER=nova` | — | `backend/app/ai.py` | Amazon Nova API key |

---

## Authentication & Encryption

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `JWT_SECRET` | Yes | `"dev-secret-change-me"` | `backend/app/auth.py` | HMAC-SHA256 signing key for JWTs. Must be at least 32 chars in production |
| `FERNET_KEY` | Yes | — | `backend/app/crypto.py` | Fernet encryption key for cloud credentials. Generate with: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |

---

## Database (PostgreSQL / RDS)

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `DB_HOST` | Yes | `"localhost"` | `backend/app/database.py` | PostgreSQL host address |
| `DB_PORT` | No | `5432` | `backend/app/database.py` | PostgreSQL port |
| `DB_NAME` | No | `"postgres"` | `backend/app/database.py` | Database name |
| `DB_USER` | No | `"postgres"` | `backend/app/database.py` | Database username |
| `DB_PASSWORD` | If `DB_USE_IAM_AUTH=false` | `"pass"` | `backend/app/database.py` | Database password (local dev only) |
| `DB_REGION` | If `DB_USE_IAM_AUTH=true` | `"us-east-1"` | `backend/app/database.py`, `logging_config.py` | AWS region for RDS IAM auth |
| `DB_USE_IAM_AUTH` | No | `"true"` | `backend/app/database.py` | Use RDS IAM authentication (`"true"` / `"false"`) |

---

## AWS Credentials

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | If using IAM auth or CloudWatch | — | `backend/app/database.py`, `logging_config.py` | AWS access key for RDS IAM token generation and CloudWatch |
| `AWS_SECRET_ACCESS_KEY` | If using IAM auth or CloudWatch | — | `backend/app/database.py`, `logging_config.py` | AWS secret key |

---

## Pricing

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `PRICING_SOURCE` | No | `"ai"` | `backend/app/pricing_config.py` | Pricing data source: `"ai"` (uses Gemini/Nova) or `"api"` (uses hardcoded stubs) |

---

## CloudWatch Logging

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `CLOUDWATCH_LOG_GROUP` | No | `"CostOpsTest"` | `backend/app/logging_config.py` | CloudWatch log group name |
| `CLOUDWATCH_LOG_STREAM` | No | Auto-detected from branch | `backend/app/logging_config.py` | CloudWatch log stream name |
| `ENABLE_CLOUDWATCH` | No | `"true"` | `backend/app/logging_config.py` | Enable CloudWatch logging (`"true"` / `"false"`) |

---

## Frontend (Vite Build-Time)

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `VITE_API_BASE_URL` | No | `"/api"` | `frontend/src/services/apiService.ts`, `AuthContext.tsx`, `CostCalculator.tsx` | Backend API base URL |
| `VITE_ADMIN` | No | `"false"` | `frontend/src/context/AdminContext.tsx` | Enable admin features (`"true"` / `"false"`) |

These are injected at build time by Vite. In `vite.config.ts`:
```typescript
define: {
  'import.meta.env.VITE_ADMIN': JSON.stringify(env.VITE_ADMIN || 'false'),
}
```

---

## Frontend Server (Runtime)

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `BACKEND_URL` | No | `"http://localhost:8000"` | `frontend/server.ts` | Backend URL for API proxy |
| `NODE_ENV` | No | — | `frontend/server.ts`, `Dockerfile` | `"production"` for static serving, otherwise Vite dev middleware |
| `DISABLE_HMR` | No | — | `frontend/vite.config.ts` | Set to `"true"` to disable Vite HMR |

---

## CI/CD Environment

| Variable | Required | Default | Used In | Description |
|----------|----------|---------|---------|-------------|
| `VERCEL_GIT_COMMIT_REF` | No | — | `backend/app/logging_config.py` | Git branch name (set by Vercel) |
| `GIT_BRANCH` | No | `"local"` | `backend/app/logging_config.py` | Git branch fallback |

---

## Environment Profiles

### Local Development

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
JWT_SECRET=dev-secret-at-least-32-characters-long
FERNET_KEY=your-generated-fernet-key
PRICING_SOURCE=ai
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cost_calculator
DB_USER=user
DB_PASSWORD=pass
DB_USE_IAM_AUTH=false
ENABLE_CLOUDWATCH=false
VITE_ADMIN=true
VITE_API_BASE_URL=/api
```

### Production (RDS + CloudWatch)

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-production-key
JWT_SECRET=strong-random-secret-at-least-32-chars
FERNET_KEY=production-fernet-key
PRICING_SOURCE=ai
DB_HOST=your-cluster.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_REGION=us-east-1
DB_USE_IAM_AUTH=true
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
CLOUDWATCH_LOG_GROUP=CostOps
ENABLE_CLOUDWATCH=true
VITE_ADMIN=true
VITE_API_BASE_URL=/api
```

### CI/CD (GitHub Actions)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cost_calculator_test
DB_USER=user
DB_PASSWORD=pass
DB_USE_IAM_AUTH=false
JWT_SECRET=test-secret-key-for-ci-only
FERNET_KEY=${{ secrets.FERNET_KEY }}
AI_PROVIDER=gemini
PRICING_SOURCE=ai
```
