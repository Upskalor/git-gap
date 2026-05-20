"""Database models for all entities."""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    goals = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    repositories = relationship("Repository", back_populates="owner")
    analyses = relationship("Analysis", back_populates="user")
    github_accounts = relationship("GitHubAccount", back_populates="user")


class GitHubAccount(Base):
    """GitHub OAuth account linking."""
    __tablename__ = "github_accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    github_id = Column(String, unique=True, index=True, nullable=False)
    github_username = Column(String, nullable=False)
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="github_accounts")


class Repository(Base):
    """GitHub repository model."""
    __tablename__ = "repositories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    github_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    full_name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    url = Column(String, nullable=False)
    is_private = Column(Boolean, default=False)
    language = Column(String, nullable=True)
    stars = Column(Integer, default=0)
    repo_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="repositories")
    analyses = relationship("Analysis", back_populates="repository")


class Analysis(Base):
    """Code analysis results."""
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    repository_id = Column(String, ForeignKey("repositories.id"), nullable=False)
    analysis_type = Column(String, nullable=False)  # deterministic, ml, etc.
    status = Column(String, default="pending")  # pending, running, completed, failed
    findings = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    mentorship = Column(Text, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="analyses")
    repository = relationship("Repository", back_populates="analyses")


class AuditLog(Base):
    """Audit logging for important actions."""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(String, nullable=False)
    changes = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
