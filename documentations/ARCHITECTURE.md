# Architecture

## High-Level Overview

CostOps AI follows a classic SPA + API architecture with three deployment targets (Vercel serverless, Docker Compose, AWS ECS Fargate).

```mermaid
graph TB
    subgraph Client
        Browser[Browser / SPA]
    end

    subgraph Frontend["Frontend (React + Vite)"]
        App[App.tsx Router]
        Pages[Pages & Components]
        ApiSvc[apiService.ts]
        AuthCtx[AuthContext]
    end

    subgraph Backend["Backend (FastAPI)"]
        Main[main.py — Routes]
        Auth[auth.py — JWT]
        Crypto[crypto.py — Fernet]
        AWSPricing[aws_pricing.py]
        AzurePricing[azure_pricing.py]
        GCPPricing[gcp_pricing.py]
        AI[ai.py — Gemini/Nova]
        DB[database.py — SQLAlchemy]
        Logging[logging_config.py]
    end

    subgraph Data
        PG[(PostgreSQL / RDS Aurora)]
        CW[CloudWatch Logs]
    end

    subgraph External
        GeminiAPI[Google Gemini API]
        NovaAPI[Amazon Nova API]
    end

    Browser --> App
    App --> Pages
    Pages --> ApiSvc
    ApiSvc -->|HTTP + JWT| Main
    AuthCtx -->|Bearer token| ApiSvc

    Main --> Auth
    Main --> AWSPricing
    Main --> AzurePricing
    Main --> GCPPricing
    Main --> Crypto
    Main --> DB

    AWSPricing --> AI
    AzurePricing --> AI
    GCPPricing --> AI
    AWSPricing --> DB
    AzurePricing --> DB
    GCPPricing --> DB

    AI --> GeminiAPI
    AI --> NovaAPI

    DB --> PG
    Logging --> CW
    Main --> Logging
```

## Request Flow — Cost Calculation

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend
    participant BE as FastAPI
    participant Cache as QueryCache (DB)
    participant Pricing as *_pricing.py
    participant AI as ai.py
    participant DB as PostgreSQL

    U->>FE: Select service, fill params, click Calculate
    FE->>BE: POST /api/calculate-cost {cloud_provider, service, parameters}
    BE->>BE: Hash request → query_hash (SHA-256)
    BE->>Cache: Check QueryCache by hash
    alt Cache hit (not expired)
        Cache-->>BE: Cached result
        BE-->>FE: Return result {cache_hit: true}
    else Cache miss
        BE->>Pricing: calculate_*_cost(service, params, db)
        Pricing->>DB: Query PricingRate table
        alt Rate cached in DB
            DB-->>Pricing: Stored rate
        else No cached rate
            Pricing->>AI: call_ai(pricing prompt)
            AI-->>Pricing: JSON rate data
            Pricing->>DB: Store PricingRate
        end
        Pricing->>AI: get_recommendation(service, params, cost)
        AI-->>Pricing: Recommendation text
        Pricing-->>BE: {cost, details, recommendation}
        BE->>Cache: Store in QueryCache (TTL 24h)
        BE->>DB: Store CostCalculation history
        BE-->>FE: Return result {cache_hit: false}
    end
    FE-->>U: Display cost, breakdown, AI recommendation
```

## Request Flow — Authentication

```mermaid
sequenceDiagram
    participant U as User
    participant FE as AuthContext
    participant BE as FastAPI
    participant DB as PostgreSQL

    U->>FE: Enter username + password
    FE->>FE: SHA-256 hash password (client-side)
    FE->>BE: POST /api/login {username, password_hash}
    BE->>DB: Query User by username or email
    BE->>BE: bcrypt.verify(password_hash, stored_hash)
    alt Valid credentials
        BE->>BE: create_access_token(user_id, role)
        BE-->>FE: {token: "eyJ..."}
        FE->>FE: Store in localStorage
        FE->>FE: Decode JWT → set user state
    else Invalid
        BE-->>FE: 401 Invalid credentials
    end
```

## Deployment Architecture — ECS Fargate

```mermaid
graph TB
    subgraph Internet
        User[User Browser]
    end

    subgraph AWS["AWS Region (us-east-1)"]
        subgraph VPC["VPC 10.0.0.0/16"]
            subgraph Public["Public Subnets"]
                ALB[Application Load Balancer]
            end

            subgraph Private["Private Subnets"]
                subgraph ECS["ECS Fargate Cluster"]
                    FE1[Frontend Task :3000]
                    FE2[Frontend Task :3000]
                    BE1[Backend Task :8000]
                    BE2[Backend Task :8000]
                end
                NAT[NAT Gateway]
            end
        end

        RDS[(RDS Aurora PostgreSQL)]
        ECR[ECR Repositories]
        CW[CloudWatch Logs]
        ACM[ACM Certificate]
    end

    User -->|HTTPS| ALB
    ALB -->|/* → :3000| FE1
    ALB -->|/* → :3000| FE2
    ALB -->|/api/* → :8000| BE1
    ALB -->|/api/* → :8000| BE2
    BE1 --> RDS
    BE2 --> RDS
    ECS --> ECR
    ECS --> CW
    ALB --> ACM
    Private --> NAT
```

## Deployment Architecture — Vercel

```mermaid
graph LR
    subgraph Vercel
        Static[Static Frontend Build]
        Serverless[api/index.py — Serverless Function]
    end

    subgraph AWS
        RDS[(RDS Aurora)]
    end

    User[Browser] -->|/*| Static
    User -->|/api/*| Serverless
    Serverless --> RDS
```

## Module Dependency Graph

```mermaid
graph TD
    main[main.py] --> auth[auth.py]
    main --> crypto[crypto.py]
    main --> database[database.py]
    main --> db_models[db_models.py]
    main --> models[models.py]
    main --> pricing[pricing.py]
    main --> aws_pricing[aws_pricing.py]
    main --> azure_pricing[azure_pricing.py]
    main --> gcp_pricing[gcp_pricing.py]
    main --> ai[ai.py]
    main --> logging_config[logging_config.py]

    aws_pricing --> ai
    aws_pricing --> db_models
    aws_pricing --> pricing_config[pricing_config.py]

    azure_pricing --> ai
    azure_pricing --> db_models
    azure_pricing --> aws_pricing
    azure_pricing --> pricing_config

    gcp_pricing --> ai
    gcp_pricing --> db_models
    gcp_pricing --> aws_pricing
    gcp_pricing --> pricing_config

    db_models --> database
    database -.->|IAM auth| boto3[boto3 / RDS]
```

## Key Design Decisions

1. **Dual pricing source** — Pricing can come from AI (Gemini/Nova) or stub API data, switchable at runtime via `PRICING_SOURCE` env var. This allows graceful degradation when AI is unavailable.

2. **Two-layer caching** — `PricingRate` table caches raw rates per service/region. `QueryCache` table caches full calculation results (24h TTL) keyed by SHA-256 hash of the request.

3. **Client-side password hashing** — Passwords are SHA-256 hashed in the browser before transmission, then bcrypt-hashed server-side for storage. This provides defense-in-depth.

4. **Fernet encryption for credentials** — Cloud provider access keys are encrypted with Fernet (AES-128-CBC + HMAC) before storage in the database.

5. **IAM-based DB auth** — Production uses RDS IAM authentication (short-lived tokens) instead of static passwords. Falls back to password auth for local dev.

6. **Serverless + container parity** — The same FastAPI app runs on Vercel (via `api/index.py` wrapper) and in Docker/ECS containers, ensuring consistent behavior across environments.

7. **Root route redirect** — Authenticated users visiting `/` are redirected to `/overview` (the dashboard home), not the cost calculator.

8. **Admin auto-assignment** — The backend maintains an `ADMIN_EMAILS` set. Users whose email or username matches an entry are automatically assigned the `"admin"` role on signup.
