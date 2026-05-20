"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    goals: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema."""
    password: str


class UserUpdate(BaseModel):
    """User update schema."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    goals: Optional[str] = None


class UserResponse(UserBase):
    """User response schema."""
    id: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Authentication Schemas
class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


# GitHub Schemas
class GitHubAccountResponse(BaseModel):
    """GitHub account response."""
    id: str
    github_username: str
    github_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class RepositoryBase(BaseModel):
    """Base repository schema."""
    name: str
    full_name: str
    description: Optional[str] = None
    url: str
    language: Optional[str] = None


class RepositoryCreate(RepositoryBase):
    """Repository creation schema."""
    github_id: str
    is_private: bool = False


class RepositoryResponse(RepositoryBase):
    """Repository response schema."""
    id: str
    github_id: str
    is_private: bool
    stars: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Analysis Schemas
class Finding(BaseModel):
    """Individual finding schema."""
    category: str
    severity: str  # critical, high, medium, low
    description: str
    location: Optional[str] = None
    code_snippet: Optional[str] = None


class Recommendation(BaseModel):
    """Recommendation schema."""
    title: str
    description: str
    priority: int
    implementation_steps: List[str]
    estimated_effort: str


class AnalysisRequest(BaseModel):
    """Analysis request schema."""
    repository_id: str
    analysis_type: str = "deterministic"


class AnalysisResponse(BaseModel):
    """Analysis response schema."""
    id: str
    status: str
    findings: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    mentorship: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MentorshipRequest(BaseModel):
    """Request for mentorship based on analysis."""
    analysis_id: str
    question: Optional[str] = None


class MentorshipResponse(BaseModel):
    """Mentorship response schema."""
    content: str
    analysis_id: str
    created_at: datetime


# Dashboard Schemas
class DashboardStats(BaseModel):
    """Dashboard statistics."""
    total_repositories: int
    total_analyses: int
    critical_issues: int
    avg_analysis_time: float


class DashboardResponse(BaseModel):
    """Dashboard data response."""
    stats: DashboardStats
    recent_analyses: List[AnalysisResponse]
    top_issues: List[Finding]
