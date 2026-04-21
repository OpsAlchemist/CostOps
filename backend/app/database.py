import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_REGION = os.getenv("DB_REGION", "us-east-1")
DB_SSL = os.getenv("DB_SSL", "false").lower() == "true"
DB_USE_IAM_AUTH = os.getenv("DB_USE_IAM_AUTH", "false").lower() == "true"

# Priority: DATABASE_URL > IAM auth > password auth
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Full connection string provided (e.g., Vercel, Heroku)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

elif DB_USE_IAM_AUTH:
    # RDS IAM auth (for ECS/EC2 with AWS credentials available)
    import boto3

    def _get_iam_token():
        client = boto3.client("rds", region_name=DB_REGION)
        return client.generate_db_auth_token(
            DBHostname=DB_HOST, Port=int(DB_PORT),
            DBUsername=DB_USER, Region=DB_REGION,
        )

    url = f"postgresql://{DB_USER}:placeholder@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
    engine = create_engine(url, pool_pre_ping=True, pool_recycle=600)

    @event.listens_for(engine, "do_connect")
    def provide_token(dialect, conn_rec, cargs, cparams):
        cparams["password"] = _get_iam_token()

else:
    # Standard password auth (local dev, or RDS with password)
    ssl = "?sslmode=require" if DB_SSL else ""
    url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}{ssl}"
    engine = create_engine(url, pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
