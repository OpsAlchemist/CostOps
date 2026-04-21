import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Support a full DATABASE_URL (for Vercel/RDS) or individual vars (for Docker Compose)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "cost_calculator")
    DB_USER = os.getenv("DB_USER", "user")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "pass")
    DB_SSL = os.getenv("DB_SSL", "false").lower() == "true"

    ssl_suffix = "?sslmode=require" if DB_SSL else ""
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}{ssl_suffix}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
