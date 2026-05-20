"""Dashboard and mentor chat API routers."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from app.schemas import DashboardResponse, DashboardStats
from app.models import Analysis, Repository, User
from app.core.database import get_db
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get dashboard data and statistics."""
    # Count repositories
    stmt = select(func.count(Repository.id)).where(Repository.owner_id == user_id)
    result = await session.execute(stmt)
    total_repos = result.scalar() or 0

    # Count analyses
    stmt = select(func.count(Analysis.id)).where(Analysis.user_id == user_id)
    result = await session.execute(stmt)
    total_analyses = result.scalar() or 0

    # Count critical issues
    stmt = select(func.count(Analysis.id)).where(
        (Analysis.user_id == user_id) & (Analysis.status == "completed")
    )
    result = await session.execute(stmt)
    critical_issues = result.scalar() or 0

    # Calculate average analysis time
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    stmt = select(Analysis).where(
        (Analysis.user_id == user_id)
        & (Analysis.status == "completed")
        & (Analysis.completed_at >= one_week_ago)
    )
    result = await session.execute(stmt)
    completed_analyses = result.scalars().all()

    avg_time = 0.0
    if completed_analyses:
        total_time = sum(
            (a.completed_at - a.created_at).total_seconds()
            for a in completed_analyses
            if a.completed_at and a.created_at
        )
        avg_time = total_time / len(completed_analyses)

    # Get recent analyses
    stmt = (
        select(Analysis)
        .where(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .limit(10)
    )
    result = await session.execute(stmt)
    recent_analyses = result.scalars().all()

    # Get top issues
    stmt = select(Analysis).where(Analysis.user_id == user_id).order_by(
        Analysis.created_at.desc()
    )
    result = await session.execute(stmt)
    all_analyses = result.scalars().all()

    top_issues = []
    for analysis in all_analyses[:5]:
        if analysis.findings:
            for finding in analysis.findings[:2]:
                top_issues.append(finding)

    stats = DashboardStats(
        total_repositories=total_repos,
        total_analyses=total_analyses,
        critical_issues=critical_issues,
        avg_analysis_time=avg_time,
    )

    return DashboardResponse(
        stats=stats,
        recent_analyses=recent_analyses,
        top_issues=top_issues[:5],
    )


@router.get("/recent-activity")
async def get_recent_activity(
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """Get recent activity for the user."""
    stmt = (
        select(Analysis)
        .options(selectinload(Analysis.repository))
        .where(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    analyses = result.scalars().all()

    return {
        "activities": [
            {
                "type": "analysis",
                "repository": a.repository.full_name if a.repository else "Unknown",
                "status": a.status,
                "created_at": a.created_at,
            }
            for a in analyses
        ]
    }
