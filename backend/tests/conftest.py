"""Shared test fixtures for all backend tests.

Provides a single in-memory SQLite database, TestClient, and helper
functions so that multiple test files don't create conflicting DB
engines or dependency overrides.
"""

import os
import sys

import pytest
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, event, JSON, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import JSONB

# Ensure the app package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Set FERNET_KEY before any app imports
_TEST_FERNET_KEY = Fernet.generate_key().decode()
os.environ.setdefault("FERNET_KEY", _TEST_FERNET_KEY)

# Remap JSONB -> JSON for SQLite compatibility before importing models
import app.db_models as _dbm

for _model in [_dbm.CostCalculation, _dbm.QueryCache, _dbm.PricingRate]:
    for _col in _model.__table__.columns:
        if isinstance(_col.type, JSONB):
            _col.type = JSON()

from app.database import Base, get_db
from app.db_models import User
from app.auth import create_access_token, pwd_context
from app.main import app, api_router

from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Single shared in-memory SQLite engine
# ---------------------------------------------------------------------------

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(TEST_ENGINE, "connect")
def _set_sqlite_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=TEST_ENGINE,
)

# Pre-hash a password once to avoid bcrypt overhead on every example
CACHED_HASH = pwd_context.hash("password123")

# Create tables once
Base.metadata.create_all(bind=TEST_ENGINE)


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Wire the override once
api_router.dependency_overrides[get_db] = _override_get_db

# Single shared TestClient
client = TestClient(app)


def clear_tables(*table_names: str):
    """Delete rows from the given tables."""
    with TEST_ENGINE.begin() as conn:
        for t in table_names:
            conn.execute(text(f"DELETE FROM {t}"))


def make_user(db, username: str, email: str, name: str = "Test") -> User:
    """Insert a user into the test DB and return it."""
    user = User(
        username=username,
        password_hash=CACHED_HASH,
        name=name,
        email=email,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_header(user: User) -> dict:
    """Return an Authorization header dict for the given user."""
    token = create_access_token(user.id, user.role)
    return {"Authorization": f"Bearer {token}"}
