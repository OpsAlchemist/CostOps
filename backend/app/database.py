import os
import boto3
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_REGION = os.getenv("DB_REGION", "us-east-1")
DB_USE_IAM_AUTH = os.getenv("DB_USE_IAM_AUTH", "false").lower() == "true"


def _get_iam_token():
    """Generate a fresh RDS IAM auth token."""
    client = boto3.client("rds", region_name=DB_REGION)
    return client.generate_db_auth_token(
        DBHostname=DB_HOST,
        Port=int(DB_PORT),
        DBUsername=DB_USER,
        Region=DB_REGION,
    )


def _build_url(password=""):
    ssl = "?sslmode=require" if DB_USE_IAM_AUTH else ""
    return f"postgresql://{DB_USER}:{password}@{DB_HOST}:{DB_PORT}/{DB_NAME}{ssl}"


if DB_USE_IAM_AUTH:
    # Use a placeholder password — the real token is injected per connection
    DATABASE_URL = _build_url("placeholder")
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=600,
        pool_size=5,
        max_overflow=10,
    )

    @event.listens_for(engine, "do_connect")
    def provide_token(dialect, conn_rec, cargs, cparams):
        """Inject a fresh IAM auth token before each new connection."""
        cparams["password"] = _get_iam_token()

else:
    # Standard password-based auth (local Docker Compose)
    DB_PASSWORD = os.getenv("DB_PASSWORD", "pass")
    DATABASE_URL = _build_url(DB_PASSWORD)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
