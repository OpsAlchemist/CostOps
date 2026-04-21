# API Reference

Base URL: `/api` (all endpoints are mounted under this prefix)

## Authentication

Authenticated endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Tokens are JWTs signed with HS256, valid for 24 hours. The payload contains `sub` (user ID), `role`, and `exp`.

---

## Public Endpoints

### `GET /api/health`

Health check — returns system status.

**Auth:** None

**Response `200`:**
```json
{
  "status": "ok",
  "database": "connected",
  "db_host": "database-1.cluster-xxx.us-east-1.rds.amazonaws.com",
  "db_iam_auth": "true",
  "aws_key_set": true,
  "ai_provider": "gemini"
}
```

---

### `POST /api/login`

Authenticate a user and receive a JWT.

**Auth:** None

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "sha256-hashed-password-hex"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Username **or** email address (the backend queries by both) |
| `password` | string | SHA-256 hex hash of the plaintext password (hashed client-side before sending) |

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `401` — Invalid credentials
- `503` — Database unavailable

---

### `POST /api/signup`

Register a new user account.

**Auth:** None

**Request Body:**
```json
{
  "username": "jane_doe",
  "password": "sha256-hashed-password-hex",
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Unique username |
| `password` | string | SHA-256 hex hash of the plaintext password |
| `name` | string | Display name |
| `email` | string | Unique email address |

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `409` — Username or email already exists

---

### `POST /api/estimate`

Quick multi-cloud cost comparison using static pricing rates.

**Auth:** None

**Request Body:**
```json
{
  "cpu": 4,
  "ram": 16,
  "storage": 500
}
```

| Field | Type | Description |
|-------|------|-------------|
| `cpu` | int | Number of CPU cores |
| `ram` | int | RAM in GB |
| `storage` | int | Storage in GB |

**Response `200`:**
```json
{
  "costs": {
    "aws": 48.10,
    "azure": 52.80,
    "gcp": 45.55
  },
  "recommendation": "GCP is the cheapest option for this configuration..."
}
```

---

### `GET /api/stats`

Dashboard statistics (currently returns mock data).

**Auth:** None

**Response `200`:**
```json
{
  "monthlySpend": 142850.20,
  "potentialSavings": 28400.00,
  "efficiencyScore": 92,
  "spendTrend": "+ 4.2% vs last month",
  "savingsTrend": "↓ 12 identified risks"
}
```

---

### `GET /api/recommendations`

Optimization recommendations (currently returns mock data).

**Auth:** None

**Response `200`:**
```json
[
  {
    "id": 1,
    "title": "Resize r5.large Instances",
    "region": "us-east-1",
    "savings": "$12,400/yr",
    "status": "Critical",
    "tag": "tag-blue",
    "desc": "Avg CPU utilization under 5% for the last 30 days..."
  }
]
```

---

### `GET /api/history`

Cost history data for charts (currently returns mock data).

**Auth:** None

**Response `200`:**
```json
{
  "months": ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  "values": [40, 45, 42, 55, 60, 75, 70, 68, 62, 58, 50, 48]
}
```

---

## Cost Calculation

### `POST /api/calculate-cost`

Calculate cloud service cost with AI-powered pricing and recommendations.

**Auth:** None (but uses DB session)

**Request Body:**
```json
{
  "cloud_provider": "aws",
  "service": "ec2",
  "parameters": {
    "instance_type": "t2.micro",
    "region": "us-east-1",
    "hours": 720,
    "operating_system": "linux"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `cloud_provider` | string | `"aws"`, `"azure"`, or `"gcp"` |
| `service` | string | Service identifier (see below) |
| `parameters` | object | Service-specific parameters |

#### Supported Services & Parameters

**AWS:**
| Service | Parameters |
|---------|-----------|
| `ec2` | `instance_type`, `region`, `hours` (default 720), `operating_system` (linux/windows) |
| `s3` | `storage_gb`, `region`, `access_frequency` (frequent/infrequent/rare) |
| `lambda` | `requests`, `duration_ms`, `memory_mb`, `region` |

**Azure:**
| Service | Parameters |
|---------|-----------|
| `virtual_machines` | `vm_size`, `region`, `hours`, `operating_system` |
| `blob_storage` | `storage_gb`, `region`, `access_frequency` |
| `functions` | `executions`, `duration_ms`, `memory_mb`, `region` |

**GCP:**
| Service | Parameters |
|---------|-----------|
| `compute_engine` | `machine_type`, `region`, `hours`, `operating_system` |
| `cloud_storage` | `storage_gb`, `region`, `access_frequency` |
| `cloud_functions` | `invocations`, `duration_ms`, `memory_mb`, `region` |

**Response `200`:**
```json
{
  "cost": 8.35,
  "currency": "USD",
  "details": {
    "instance_type": "t2.micro",
    "region": "us-east-1",
    "operating_system": "linux",
    "hourly_rate": 0.0116,
    "total_hours": 720
  },
  "recommendation": "Consider using t3.micro for 10% savings with better burst performance...",
  "cache_hit": false
}
```

**Error Responses:**
- `400` — Unsupported cloud provider or service, or pricing fetch failure
- `500` — Internal calculation error

---

## Authenticated Endpoints

### `GET /api/user/profile`

Get the current user's profile.

**Auth:** Required (Bearer JWT)

**Response `200`:**
```json
{
  "username": "john_doe",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "bio": "Cloud architect",
  "role": "user"
}
```

**Error Responses:**
- `401` — Not authenticated / token expired
- `404` — User not found

---

### `PUT /api/user/profile`

Update the current user's profile.

**Auth:** Required (Bearer JWT)

**Request Body:**
```json
{
  "name": "John Doe",
  "company": "Acme Corp",
  "email": "john@example.com",
  "bio": "Senior cloud architect"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name |
| `company` | string | Yes | Company name |
| `email` | EmailStr | Yes | Valid email address |
| `bio` | string | No | Short biography (default `""`) |

**Response `200`:**
```json
{
  "username": "john_doe",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "bio": "Senior cloud architect",
  "role": "user"
}
```

**Error Responses:**
- `401` — Not authenticated
- `404` — User not found
- `409` — Email already in use

---

### `POST /api/user/connect-cloud`

Store encrypted cloud provider credentials.

**Auth:** Required (Bearer JWT)

**Request Body:**
```json
{
  "cloud_provider": "aws",
  "access_key_id": "AKIA...",
  "secret_access_key": "wJalr..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `cloud_provider` | string | `"aws"`, `"azure"`, or `"gcp"` |
| `access_key_id` | string | Provider access key |
| `secret_access_key` | string | Provider secret key |

Credentials are Fernet-encrypted before storage. If a credential already exists for the user/provider pair, it is updated (upsert).

**Response `200`:**
```json
{
  "status": "connected",
  "cloud_provider": "aws"
}
```

**Error Responses:**
- `400` — Unsupported cloud provider
- `401` — Not authenticated

---

## Admin Endpoints

### `POST /api/admin/onboard-user`

Create a new user (admin only).

**Auth:** Required (Bearer JWT, role must be `"admin"`)

**Request Body:**
```json
{
  "username": "new_user",
  "password": "hashed-password",
  "name": "New User",
  "email": "new@example.com",
  "role": "user"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Unique username |
| `password` | string | Yes | Password (will be bcrypt-hashed) |
| `name` | string | Yes | Display name |
| `email` | EmailStr | Yes | Unique email |
| `role` | string | No | `"user"` (default) or `"admin"` |

**Response `200`:**
```json
{
  "id": 5,
  "username": "new_user",
  "name": "New User",
  "email": "new@example.com",
  "role": "user"
}
```

**Error Responses:**
- `400` — Invalid role
- `403` — Admin access required
- `409` — Username or email already exists

---

### `GET /api/admin/users`

List all users (admin only).

**Auth:** Required (Bearer JWT, role must be `"admin"`)

**Response `200`:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  {
    "id": 2,
    "username": "john_doe",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
]
```

**Error Responses:**
- `403` — Admin access required

---

### `DELETE /api/admin/users/{user_id}`

Delete a user and their associated cloud credentials (admin only).

**Auth:** Required (Bearer JWT, role must be `"admin"`)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | int | ID of the user to delete |

**Response `200`:**
```json
{
  "status": "deleted"
}
```

**Error Responses:**
- `400` — Cannot delete yourself
- `403` — Admin access required
- `404` — User not found

**Notes:**
- Associated `user_cloud_credentials` are cascade-deleted before the user record is removed.
- Admins cannot delete their own account.
