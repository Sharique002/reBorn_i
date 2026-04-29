"""
reBorn_i — SQLAlchemy Database Models

Defines the database schema for users, resumes, analyses, and blueprints.
Supports both PostgreSQL and SQLite via generic String-based UUIDs.
Uses SQLAlchemy 2.0 Mapped annotations for full type-checker compatibility.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import JSON, Boolean, Float, Integer


def _generate_uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


class User(Base):
    """Authenticated user account."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)  # Null for Google OAuth users
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)
    auth_provider: Mapped[Optional[str]] = mapped_column(String(50), default="local")  # local | google
    google_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True, default=None)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    subscription_plan: Mapped[str] = mapped_column(String(50), default="free")  # free | pro
    subscription_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    analyses: Mapped[List["RejectionAnalysis"]] = relationship("RejectionAnalysis", back_populates="user", cascade="all, delete-orphan")
    blueprints: Mapped[List["Blueprint"]] = relationship("Blueprint", back_populates="user", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    """Uploaded and processed resume."""

    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    structured_data: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=None)  # Extracted structured resume data
    skills: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=None)  # List of extracted skills
    experience_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=None)
    experience_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default=None)
    embedding_vector: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=None)  # Cached embedding
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending | processed | failed
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="resumes")
    analyses: Mapped[List["RejectionAnalysis"]] = relationship("RejectionAnalysis", back_populates="resume", cascade="all, delete-orphan")


class RejectionAnalysis(Base):
    """Rejection risk analysis result."""

    __tablename__ = "rejection_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.id"), nullable=False)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    job_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    top_rejection_reasons: Mapped[Any] = mapped_column(JSON, nullable=False)  # List of reason strings
    skill_gaps: Mapped[Any] = mapped_column(JSON, nullable=False)  # List of missing skills
    component_scores: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=None)  # Individual scoring breakdown
    explanation: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=None)  # LLM-generated explanation
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="analyses")
    resume: Mapped["Resume"] = relationship("Resume", back_populates="analyses")


class MarketSnapshot(Base):
    """Point-in-time snapshot of market demand analysis."""

    __tablename__ = "market_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_generate_uuid)
    skill_frequency: Mapped[Any] = mapped_column(JSON, nullable=False)  # skill -> count
    demand_index: Mapped[Any] = mapped_column(JSON, nullable=False)  # skill -> demand_score
    top_skills: Mapped[Any] = mapped_column(JSON, nullable=False)  # Ordered list of top skills
    total_jobs_analyzed: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class Blueprint(Base):
    """Reinvention blueprint (action plan)."""

    __tablename__ = "blueprints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 30_day | 90_day
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_data: Mapped[Any] = mapped_column(JSON, nullable=False)  # Full plan JSON from LLM
    risk_score_at_creation: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=None)
    skill_gaps_at_creation: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=None)
    prompt_template_version: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="blueprints")


class CareerSimulation(Base):
    """Career simulation comparison snapshot."""

    __tablename__ = "career_simulations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.id"), nullable=False)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    original_skills: Mapped[Any] = mapped_column(JSON, nullable=False)
    modified_skills: Mapped[Any] = mapped_column(JSON, nullable=False)
    skills_added: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=None)
    skills_removed: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, default=None)
    before_metrics: Mapped[Any] = mapped_column(JSON, nullable=False)
    after_metrics: Mapped[Any] = mapped_column(JSON, nullable=False)
    risk_delta: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class Payment(Base):
    """Payment transaction record for subscription upgrades."""

    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    razorpay_order_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    razorpay_payment_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default=None, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)  # In INR paisa (900 = ₹9)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending | completed | failed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="payments")
