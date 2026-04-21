import os
import logging

logger = logging.getLogger(__name__)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_REGION = os.getenv("DB_REGION", "us-east-1")
DB_USE_IAM_AUTH = os.getenv("DB_USE_IAM_AUTH", "true").lower() == "true"

engine = None
SessionLocal = None
Base = None

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, declarative_base

    Base = declarative_base()

    if DB_USE_IAM_AUTH:
        import psycopg2
        import boto3

        def _get_iam_token():
            client = boto3.client(
                "rds",
                region_name=DB_REGION,
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            )
            return client.generate_db_auth_token(
                DBHostname=DB_HOST, Port=DB_PORT,
                DBUsername=DB_USER, Region=DB_REGION,
            )

        def _iam_creator():
            token = _get_iam_token()
            return psycopg2.connect(
                host=DB_HOST, port=DB_PORT, database=DB_NAME,
                user=DB_USER, password=token, sslmode="require",
            )

        engine = create_engine(
            "postgresql://", creator=_iam_creator,
            pool_pre_ping=True, pool_recycle=600, pool_size=3, max_overflow=5,
        )
    else:
        DB_PASSWORD = os.getenv("DB_PASSWORD", "pass")
        engine = create_engine(
            f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
            pool_pre_ping=True, pool_recycle=300,
        )

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

except Exception as e:
    logger.error("Database setup failed: %s", e)
    # Create a dummy Base so models can still be imported without crashing
    from sqlalchemy.orm import declarative_base
    if Base is None:
        Base = declarative_base()


def get_db():
    if SessionLocal is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database unavailable")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
