from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
from app.database import Base


class CostCalculation(Base):
    __tablename__ = "cost_calculations"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String(50), nullable=False)
    parameters = Column(JSONB, nullable=False)
    result = Column(JSONB, nullable=False)
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class QueryCache(Base):
    __tablename__ = "query_cache"

    query_hash = Column(String(64), primary_key=True)
    result = Column(JSONB, nullable=False)
    expires_at = Column(DateTime, nullable=False)


class PricingRate(Base):
    __tablename__ = "pricing_rates"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String(50), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False)
    region = Column(String(50), nullable=False)
    rates = Column(JSONB, nullable=False)
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source = Column(String(20), default="ai")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    company = Column(String(200), default="")
    bio = Column(Text, default="")
    role = Column(String(20), default="user")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class UserCloudCredential(Base):
    __tablename__ = "user_cloud_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cloud_provider = Column(String(10), nullable=False)
    encrypted_key = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint('user_id', 'cloud_provider'),)
