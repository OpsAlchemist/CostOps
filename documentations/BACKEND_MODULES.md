# Backend Modules

All backend code lives in `backend/app/`. The application is a FastAPI server running on Uvicorn.

---

## `main.py` — Application Entry Point & Routes

The central module that wires everything together. Creates the FastAPI app, registers middleware, and defines all API routes.

### Startup

```python
# Creates tables on import
Base.metadata.create_all(bind=engine)
```

### Middleware

- **CORS** — `allow_origins=["*"]`, all methods and headers allowed
- **Request logger** — Logs `METHOD /path → STATUS (Xms)` for every request

### Module-Level Constants

```python
ADMIN_EMAILS = {
    "admin", "admin@costops.ai", "connect.mrkc@gmail.com", "admin@opsalchemistlabs.co.in"
}
```

Used during signup to auto-assign the `"admin"` role when the registering user's email or username matches an entry in this set.

### Route Definitions

| Route | Method | Handler | Auth | Description |
|-------|--------|---------|------|-------------|
| `/api/health` | GET | `health()` | No | System health check |
| `/api/login` | POST | `login()` | No | User authentication (accepts username **or** email) |
| `/api/signup` | POST | `signup()` | No | User registration (auto-assigns admin role for `ADMIN_EMAILS`) |
| `/api/estimate` | POST | `estimate()` | No | Quick multi-cloud comparison |
| `/api/calculate-cost` | POST | `calculate_cost_endpoint()` | No | Full cost calculation with AI |
| `/api/stats` | GET | `stats()` | No | Dashboard stats (mock) |
| `/api/recommendations` | GET | `recommendations()` | No | Optimization recs (mock) |
| `/api/history` | GET | `history()` | No | Cost history (mock) |
| `/api/user/profile` | GET | `get_profile()` | JWT | Get user profile |
| `/api/user/profile` | PUT | `update_profile()` | JWT | Update user profile |
| `/api/user/connect-cloud` | POST | `connect_cloud()` | JWT | Store cloud credentials |
| `/api/admin/onboard-user` | POST | `onboard_user()` | JWT (admin) | Create user |
| `/api/admin/users` | GET | `list_users()` | JWT (admin) | List all users |
| `/api/admin/users/{user_id}` | DELETE | `delete_user()` | JWT (admin) | Delete user + cascade-delete credentials |

### Mounting

```python
app.mount("/api", api_router)
app.mount("/", api_router)   # Also serves at root for Vercel
```

### Key Call Chains

```
login() → db.query(User by username OR email) → pwd_context.verify() → create_access_token()
signup() → check ADMIN_EMAILS → pwd_context.hash() → db.add(User with role) → create_access_token()
delete_user() → delete UserCloudCredentials → delete User → commit
calculate_cost_endpoint() → QueryCache check → calculate_*_cost() → QueryCache store → CostCalculation store
connect_cloud() → encrypt_credential() → db upsert UserCloudCredential
estimate() → calculate_cost() [static] → get_ai_recommendation()
```

---

## `auth.py` — JWT Authentication

Handles JWT token creation and validation using `python-jose` and `passlib`.

### Constants

| Name | Value | Description |
|------|-------|-------------|
| `JWT_SECRET` | env `JWT_SECRET` | Signing key (fallback: `"dev-secret-change-me"`) |
| `JWT_ALGORITHM` | `"HS256"` | HMAC-SHA256 |
| `ACCESS_TOKEN_EXPIRE_HOURS` | `24` | Token lifetime |

### Functions

#### `create_access_token(user_id: int, role: str) -> str`
Creates a signed JWT with payload `{sub: str(user_id), role: str, exp: datetime}`.

#### `get_current_user(token: str) -> dict`
FastAPI dependency. Decodes and validates a JWT from the `Authorization: Bearer` header. Returns `{"user_id": int, "role": str}`.

Raises:
- `401` — Missing/invalid token
- `401` — Expired token (distinct error message: `"Token has expired"`)

### Objects

- `pwd_context` — `CryptContext(schemes=["bcrypt"])` for password hashing/verification
- `oauth2_scheme` — `OAuth2PasswordBearer(tokenUrl="/api/login")`

---

## `crypto.py` — Fernet Encryption

Provides symmetric encryption for cloud credentials using the `cryptography` library.

### Functions

#### `encrypt_credential(plaintext: str) -> str`
Encrypts a string using Fernet. Returns base64-encoded ciphertext.

#### `decrypt_credential(ciphertext: str) -> str`
Decrypts a Fernet-encrypted string. Returns plaintext.

#### `_get_fernet() -> Fernet`
Internal. Creates a `Fernet` instance from the `FERNET_KEY` environment variable. Raises `RuntimeError` if the key is not set.

---

## `database.py` — Database Connection

Configures SQLAlchemy engine and session factory with two authentication modes.

### Configuration (from env vars)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `postgres` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_REGION` | `us-east-1` | AWS region (for IAM auth) |
| `DB_USE_IAM_AUTH` | `true` | Enable RDS IAM authentication |

### IAM Auth Flow

```
_get_iam_token() → boto3.client("rds").generate_db_auth_token() → short-lived token
_iam_creator() → psycopg2.connect(password=token, sslmode="require")
engine = create_engine("postgresql://", creator=_iam_creator, ...)
```

### Functions

#### `get_db() -> Generator[Session]`
FastAPI dependency. Yields a SQLAlchemy session, closes it in `finally`. Raises `503` if the database is unavailable.

### Exports

- `engine` — SQLAlchemy engine (or `None` if setup failed)
- `SessionLocal` — Session factory (or `None`)
- `Base` — Declarative base for ORM models

---

## `db_models.py` — ORM Models

SQLAlchemy table definitions. See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for full column details.

| Class | Table | Description |
|-------|-------|-------------|
| `CostCalculation` | `cost_calculations` | Calculation audit log |
| `QueryCache` | `query_cache` | 24h result cache |
| `PricingRate` | `pricing_rates` | Cached pricing rates |
| `User` | `users` | User accounts |
| `UserCloudCredential` | `user_cloud_credentials` | Encrypted cloud credentials |

---

## `models.py` — Pydantic Request Schemas

Pydantic `BaseModel` classes for request validation.

| Model | Used By | Fields |
|-------|---------|--------|
| `CostRequest` | `POST /estimate` | `cpu: int`, `ram: int`, `storage: int` |
| `LoginRequest` | `POST /login` | `username: str`, `password: str` |
| `SignupRequest` | `POST /signup` | `username`, `password`, `name`, `email` |
| `CalculateCostRequest` | `POST /calculate-cost` | `cloud_provider` (default `"aws"`), `service`, `parameters: dict` |
| `ProfileUpdateRequest` | `PUT /user/profile` | `name`, `company`, `email: EmailStr`, `bio` (default `""`) |
| `CloudCredentialRequest` | `POST /user/connect-cloud` | `cloud_provider`, `access_key_id`, `secret_access_key` |
| `OnboardUserRequest` | `POST /admin/onboard-user` | `username`, `password`, `name`, `email: EmailStr`, `role` (default `"user"`) |

---

## `ai.py` — AI Provider Abstraction

Supports Google Gemini and Amazon Nova as AI backends, switchable via `AI_PROVIDER` env var.

### Functions

#### `call_ai(prompt: str) -> str`
Generic entry point. Routes to `call_gemini()` or `call_nova()` based on `PROVIDER`. Returns raw text response or error string.

#### `call_gemini(prompt: str) -> str`
Calls `generativelanguage.googleapis.com` Gemini 2.0 Flash API. Requires `GEMINI_API_KEY`.

#### `call_nova(prompt: str) -> str`
Calls Amazon Nova chat completions API. Requires `NOVA_API_KEY`. Uses model `nova-2-lite-v1`.

#### `get_ai_recommendation(data: dict) -> str`
Builds a comparison prompt from `{aws, azure, gcp}` cost data and calls `call_ai()`.

#### `build_prompt(data: dict) -> str`
Formats the multi-cloud comparison prompt.

### Call Chain

```
get_ai_recommendation(costs) → build_prompt(costs) → call_ai(prompt) → call_gemini/call_nova(prompt)
```

---

## `pricing.py` — Static Pricing Calculator

Simple static pricing for the `/estimate` endpoint. No AI, no DB.

### Data

```python
pricing = {
    "aws":   {"cpu": 8,   "ram": 1,   "storage": 0.1},
    "azure": {"cpu": 9,   "ram": 1.2, "storage": 0.12},
    "gcp":   {"cpu": 7.5, "ram": 1.1, "storage": 0.11}
}
```

### Functions

#### `calculate_cost(provider: str, cpu: int, ram: int, storage: int) -> float`
Returns `cpu * rate + ram * rate + storage * rate`, rounded to 2 decimals.

---

## `pricing_config.py` — Pricing Source Switch

Runtime-switchable configuration for choosing between AI and native API pricing.

### Functions

#### `get_pricing_source() -> str`
Returns `"ai"` or `"api"`. Reads from `PRICING_SOURCE` env var on import.

#### `set_pricing_source(source: str) -> None`
Changes the pricing source at runtime. Raises `ValueError` for invalid values.

---

## `aws_pricing.py` — AWS Cost Calculator

Handles EC2, S3, and Lambda cost calculations with AI-powered or stub pricing.

### Public Functions

#### `calculate_aws_cost(service: str, params: dict, db: Session) -> dict`
Router function. Dispatches to `calculate_ec2`, `calculate_s3`, or `calculate_lambda`. Appends AI recommendation on success.

#### `calculate_ec2(params, db)`, `calculate_s3(params, db)`, `calculate_lambda(params, db)`
Service-specific calculators. Each:
1. Calls `get_rate()` to fetch pricing
2. Extracts relevant rate values
3. Computes total cost
4. Returns `{cost, currency, details}` or `{error}`

#### `get_rate(db, service, resource_type, region) -> dict | None`
Checks `PricingRate` table first. On miss, fetches from AI or API (based on `pricing_config`), stores in DB, returns rates.

#### `get_recommendation(service, params, cost) -> str`
Generates an AI optimization tip for the calculated cost.

### Internal Functions

- `_parse_ai_json(text)` — Extracts JSON from AI responses (handles markdown fences, extra text)
- `_is_numeric(v)` — Checks if a value can be converted to float
- `_extract_rate(rates, *keys)` — Tries multiple key names, returns first positive float
- `_fetch_rate_from_ai(service, resource_type, region)` — Prompts AI for pricing JSON
- `_fetch_rate_from_api(service, resource_type, region)` — Returns hardcoded stub rates

### Call Chain

```
calculate_aws_cost() → calculate_ec2/s3/lambda()
  → get_rate() → DB lookup → _fetch_rate_from_ai/api() → call_ai() → _parse_ai_json()
  → get_recommendation() → call_ai()
```

---

## `azure_pricing.py` — Azure Cost Calculator

Mirrors `aws_pricing.py` structure for Azure services: Virtual Machines, Blob Storage, Functions.

### Public Functions

- `calculate_azure_cost(service, params, db)` — Router
- `calculate_virtual_machines(params, db)` — VM cost
- `calculate_blob_storage(params, db)` — Storage cost
- `calculate_functions(params, db)` — Functions cost
- `get_rate(db, service, resource_type, region)` — Rate lookup (prefixes service with `azure_`)
- `get_recommendation(service, params, cost)` — AI tip

### Shared Imports from `aws_pricing`

Reuses `_parse_ai_json`, `_is_numeric`, `_extract_rate` from `aws_pricing.py`.

---

## `gcp_pricing.py` — GCP Cost Calculator

Mirrors `aws_pricing.py` structure for GCP services: Compute Engine, Cloud Storage, Cloud Functions.

### Public Functions

- `calculate_gcp_cost(service, params, db)` — Router
- `calculate_compute_engine(params, db)` — VM cost
- `calculate_cloud_storage(params, db)` — Storage cost
- `calculate_cloud_functions(params, db)` — Functions cost
- `get_rate(db, service, resource_type, region)` — Rate lookup (prefixes service with `gcp_`)
- `get_recommendation(service, params, cost)` — AI tip

### Shared Imports from `aws_pricing`

Reuses `_parse_ai_json`, `_is_numeric`, `_extract_rate` from `aws_pricing.py`.

---

## `logging_config.py` — CloudWatch Logging

Configures dual logging to stdout and AWS CloudWatch.

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLOUDWATCH_LOG_GROUP` | `"CostOpsTest"` | CloudWatch log group name |
| `AWS_REGION` | `"us-east-1"` | AWS region for CloudWatch |
| `ENABLE_CLOUDWATCH` | `"true"` | Enable/disable CloudWatch handler |

### Environment Detection

```python
BRANCH = os.getenv("VERCEL_GIT_COMMIT_REF", os.getenv("GIT_BRANCH", "local"))
ENV_LABEL = "production" if BRANCH == "main" else f"dev-{BRANCH}" if BRANCH != "local" else "local"
```

### Functions

#### `setup_logging() -> Logger`
Configures the root logger with:
1. **stdout handler** — Always active, format: `timestamp [env] [LEVEL] name: message`
2. **CloudWatch handler** — Optional, uses `watchtower.CloudWatchLogHandler` with boto3 client

---

## `api/index.py` — Vercel Entry Point

Minimal wrapper that adds `backend/` to `sys.path` and imports the FastAPI `app` for Vercel's Python runtime.

```python
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app.main import app
```
