import os
import logging
import boto3
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_REGION = os.getenv("DB_REGION", "us-east-1")
DB_USE_IAM_AUTH = os.getenv("DB_USE_IAM_AUTH", "true").lower() == "true"


def _get_iam_token():
    """Generate a fresh RDS IAM auth token."""
    client = boto3.client(
        "rds",
        region_name=DB_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    token = client.generate_db_auth_token(
        DBHostname=DB_HOST,
        Port=int(DB_PORT),
        DBUsername=DB_USER,
        Region=DB_REGION,
    )
    return token


if DB_USE_IAM_AUTH:
    # RDS IAM auth — token injected per connection via do_connect event
    # Use connect_args for SSL instead of query string to avoid psycopg2 issues
    engine = create_engine(
        f"postgresql://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
        connect_args={"sslmode": "require"},
        pool_pre_ping=True,
        pool_recycle=600,
        pool_size=3,
        max_overflow=5,
    )

    @event.listens_for(engine, "do_connect")
    def provide_token(dialect, conn_rec, cargs, cparams):
        """Inject a fresh IAM auth token before each new DB connection."""
        token = _get_iam_token()
        cparams["password"] = token
        logger.info("IAM auth token generated for RDS connection")

else:
    # Local dev — password-based auth
    DB_PASSWORD = os.getenv("DB_PASSWORD", "pass")
    engine = create_engine(
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
        pool_pre_ping=True,
        pool_recycle=300,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
