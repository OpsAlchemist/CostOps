import hashlib
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

from app.logging_config import setup_logging
from app.models import CostRequest, LoginRequest, CalculateCostRequest, SignupRequest, ProfileUpdateRequest, CloudCredentialRequest, OnboardUserRequest
from app.pricing import calculate_cost
from app.ai import get_ai_recommendation
from app.aws_pricing import calculate_aws_cost
from app.azure_pricing import calculate_azure_cost
from app.gcp_pricing import calculate_gcp_cost
from app.database import engine, get_db, Base, DB_HOST
from app.db_models import CostCalculation, QueryCache, User, UserCloudCredential
from app.auth import create_access_token, get_current_user, pwd_context
from app.crypto import encrypt_credential

# Setup CloudWatch + stdout logging
logger = setup_logging()

# Create tables on startup (with error handling for serverless cold starts)
try:
    if engine is not None:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully")
    else:
        logger.warning("Database engine not available — skipping table creation")
except Exception as e:
    logger.error("Could not create tables on startup: %s", e)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 1)
    logger.info(
        "%s %s → %s (%sms)",
        request.method, request.url.path, response.status_code, duration,
    )
    return response


api_router = FastAPI()

@api_router.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {
        "status": "ok",
        "database": db_status,
        "db_host": DB_HOST,
        "db_iam_auth": os.getenv("DB_USE_IAM_AUTH", "not set"),
        "aws_key_set": bool(os.getenv("AWS_ACCESS_KEY_ID")),
        "ai_provider": os.getenv("AI_PROVIDER", "not set"),
    }

@api_router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(
            (User.username == req.username) | (User.email == req.username)
        ).first()
    except Exception as e:
        logger.error("Login DB error: %s", e)
        raise HTTPException(status_code=503, detail="Database unavailable")
    if not user or not pwd_context.verify(req.password, user.password_hash):
        logger.warning("Failed login attempt for: %s", req.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id, user.role)
    logger.info("User logged in: %s (id=%s)", user.username, user.id)
    return {"token": token}


@api_router.post("/signup")
ADMIN_EMAILS = {
    "admin", "admin@costops.ai", "connect.mrkc@gmail.com", "admin@opsalchemistlabs.co.in"
}


def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == req.username) | (User.email == req.email)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username or email already exists")
    hashed = pwd_context.hash(req.password)

    # Auto-assign admin role for designated accounts
    role = "admin" if req.email in ADMIN_EMAILS or req.username in ADMIN_EMAILS else "user"

    user = User(
        username=req.username,
        password_hash=hashed,
        name=req.name,
        email=req.email,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.role)
    logger.info("New user signed up: %s (id=%s, role=%s)", user.username, user.id, user.role)
    return {"token": token}

@api_router.put("/user/profile")
def update_profile(
    req: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = req.name
    user.company = req.company
    user.email = req.email
    user.bio = req.bio

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already in use")

    return {
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "company": user.company,
        "bio": user.bio,
        "role": user.role,
    }


@api_router.get("/user/profile")
def get_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "company": user.company,
        "bio": user.bio,
        "role": user.role,
    }


SUPPORTED_CLOUD_PROVIDERS = {"aws", "azure", "gcp"}


@api_router.post("/admin/onboard-user")
def onboard_user(
    req: OnboardUserRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if req.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")

    existing = db.query(User).filter(
        (User.username == req.username) | (User.email == req.email)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = User(
        username=req.username,
        password_hash=pwd_context.hash(req.password),
        name=req.name,
        email=req.email,
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


@api_router.get("/admin/users")
def list_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "email": u.email,
            "role": u.role,
        }
        for u in users
    ]


@api_router.delete("/admin/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if current_user["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete associated credentials
    db.query(UserCloudCredential).filter(UserCloudCredential.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    logger.info("User deleted: %s (id=%s) by admin (id=%s)", user.username, user_id, current_user["user_id"])
    return {"status": "deleted"}


@api_router.post("/user/connect-cloud")
def connect_cloud(
    req: CloudCredentialRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.cloud_provider not in SUPPORTED_CLOUD_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported cloud provider: {req.cloud_provider}. Supported: aws, azure, gcp",
        )

    # Encrypt credentials as a JSON string
    credentials_json = json.dumps({
        "access_key_id": req.access_key_id,
        "secret_access_key": req.secret_access_key,
    })
    encrypted = encrypt_credential(credentials_json)

    # Upsert: check if credential already exists for this user/provider
    existing = db.query(UserCloudCredential).filter(
        UserCloudCredential.user_id == current_user["user_id"],
        UserCloudCredential.cloud_provider == req.cloud_provider,
    ).first()

    if existing:
        existing.encrypted_key = encrypted
    else:
        credential = UserCloudCredential(
            user_id=current_user["user_id"],
            cloud_provider=req.cloud_provider,
            encrypted_key=encrypted,
        )
        db.add(credential)

    db.commit()
    return {"status": "connected", "cloud_provider": req.cloud_provider}


@api_router.post("/estimate")
def estimate(req: CostRequest):
    aws = calculate_cost("aws", req.cpu, req.ram, req.storage)
    azure = calculate_cost("azure", req.cpu, req.ram, req.storage)
    gcp = calculate_cost("gcp", req.cpu, req.ram, req.storage)

    costs = {"aws": aws, "azure": azure, "gcp": gcp}
    recommendation = get_ai_recommendation(costs)

    return {"costs": costs, "recommendation": recommendation}

@api_router.post("/calculate-cost")
def calculate_cost_endpoint(req: CalculateCostRequest, db: Session = Depends(get_db)):
    if req.cloud_provider not in SUPPORTED_CLOUD_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported cloud provider: {req.cloud_provider}. Supported: aws, azure, gcp",
        )

    try:
        # Build cache key from request (include cloud_provider)
        cache_key_data = json.dumps(
            {"cloud_provider": req.cloud_provider, "service": req.service, "parameters": req.parameters},
            sort_keys=True,
        )
        query_hash = hashlib.sha256(cache_key_data.encode()).hexdigest()

        # Check cache
        now = datetime.now(timezone.utc)
        cached = db.query(QueryCache).filter(QueryCache.query_hash == query_hash).first()
        if cached and cached.expires_at.replace(tzinfo=timezone.utc) > now:
            result = cached.result
            result["cache_hit"] = True
            return result

        # Route to the correct provider pricing module
        provider_calculators = {
            "aws": calculate_aws_cost,
            "azure": calculate_azure_cost,
            "gcp": calculate_gcp_cost,
        }
        calculate_fn = provider_calculators[req.cloud_provider]
        result = calculate_fn(req.service, req.parameters, db)

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        result["cache_hit"] = False

        # Store in cache (TTL = 24h)
        if cached:
            cached.result = result
            cached.expires_at = now + timedelta(hours=24)
        else:
            db.add(QueryCache(
                query_hash=query_hash,
                result=result,
                expires_at=now + timedelta(hours=24)
            ))

        # Store calculation history
        db.add(CostCalculation(
            service=req.service,
            parameters=req.parameters,
            result=result
        ))

        db.commit()
        return result

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Cost calculation failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")

@api_router.get("/stats")
def stats():
    return {
        "monthlySpend": 142850.20,
        "potentialSavings": 28400.00,
        "efficiencyScore": 92,
        "spendTrend": "+ 4.2% vs last month",
        "savingsTrend": "↓ 12 identified risks"
    }

@api_router.get("/recommendations")
def recommendations():
    return [
        {
            "id": 1,
            "title": "Resize r5.large Instances",
            "region": "us-east-1",
            "savings": "$12,400/yr",
            "status": "Critical",
            "tag": "tag-blue",
            "desc": "Avg CPU utilization under 5% for the last 30 days. Recommend downsizing to t3.medium."
        },
        {
            "id": 2,
            "title": "Active S3 Lifecycle Policy",
            "region": "Global",
            "savings": "$4,200/yr",
            "status": "Medium",
            "tag": "tag-amber",
            "desc": "Move 4.2TB of standard storage to Intelligent-Tiering to auto-optimize access costs."
        },
        {
            "id": 3,
            "title": "Cleanup EBS Volumes",
            "region": "us-west-2",
            "savings": "$850/yr",
            "status": "Low",
            "tag": "tag-green",
            "desc": "12 unattached volumes identified in development account that haven't been touched in 60 days."
        }
    ]

@api_router.get("/history")
def history():
    return {
        "months": ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
        "values": [40, 45, 42, 55, 60, 75, 70, 68, 62, 58, 50, 48]
    }

app.mount("/api", api_router)
app.mount("/", api_router)
