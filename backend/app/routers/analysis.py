"""Analysis API router."""
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime
import structlog

from app.schemas import AnalysisRequest, AnalysisResponse, MentorshipRequest, MentorshipResponse
from app.models import Analysis, Repository, GitHubAccount, User
from app.services.deterministic import DeterministicAnalyzer
from app.services.mentor_service import MentorService
from app.services.github_service import GitHubService
from app.core.database import get_db
from app.core.deps import get_current_user

logger = structlog.get_logger()
router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/", response_model=AnalysisResponse)
async def create_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create and start a repository analysis."""
    # Verify repository exists and belongs to user
    stmt = select(Repository).where(
        (Repository.id == request.repository_id) & (Repository.owner_id == user_id)
    )
    result = await session.execute(stmt)
    repo = result.scalar_one_or_none()

    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )

    # Create analysis record
    analysis = Analysis(
        user_id=user_id,
        repository_id=request.repository_id,
        analysis_type=request.analysis_type,
        status="pending",
    )
    session.add(analysis)
    await session.commit()
    await session.refresh(analysis)

    # Start background analysis
    background_tasks.add_task(run_analysis, analysis.id, repo.full_name, user_id, session)

    return analysis


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: str,
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get analysis results."""
    stmt = (
        select(Analysis)
        .options(selectinload(Analysis.repository))
        .where((Analysis.id == analysis_id) & (Analysis.user_id == user_id))
    )
    result = await session.execute(stmt)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    return analysis


@router.post("/{analysis_id}/mentorship", response_model=MentorshipResponse)
async def get_mentorship(
    analysis_id: str,
    request: MentorshipRequest,
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get mentorship for analysis results."""
    stmt = (
        select(Analysis)
        .options(selectinload(Analysis.repository))
        .where((Analysis.id == analysis_id) & (Analysis.user_id == user_id))
    )
    result = await session.execute(stmt)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    if analysis.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis must be completed before generating mentorship",
        )

    # Fetch user goals
    user_stmt = select(User).where(User.id == user_id)
    user_result = await session.execute(user_stmt)
    user = user_result.scalar_one_or_none()
    goals = user.goals if user else None

    mentor_service = MentorService()

    if request.question:
        # Answer specific question
        content = await mentor_service.answer_question(
            request.question,
            analysis.findings or [],
            analysis.repository.full_name,
            goals=goals
        )
    else:
        # Generate general mentorship (or return cached one)
        if analysis.mentorship:
            content = analysis.mentorship
        else:
            content = await mentor_service.generate_mentorship(
                analysis.findings or [],
                analysis.repository.full_name,
                goals=goals
            )
            # Cache it
            analysis.mentorship = content
            await session.commit()

    return MentorshipResponse(
        content=content,
        analysis_id=analysis_id,
        created_at=datetime.utcnow(),
    )


async def run_analysis(analysis_id: str, repo_full_name: str, user_id: str, session: AsyncSession):
    """Background task to run analysis."""
    try:
        # Update status to running
        stmt = (
            select(Analysis)
            .options(selectinload(Analysis.repository))
            .where(Analysis.id == analysis_id)
        )
        result = await session.execute(stmt)
        analysis = result.scalar_one_or_none()

        if not analysis:
            return

        analysis.status = "running"
        await session.commit()

        # Fetch GitHub credentials
        stmt = select(GitHubAccount).where(GitHubAccount.user_id == user_id)
        result = await session.execute(stmt)
        gh_account = result.scalar_one_or_none()
        
        if not gh_account:
            raise Exception("GitHub account not connected")

        # Parse owner and repo name
        parts = repo_full_name.split("/")
        if len(parts) == 2:
            owner, repo = parts
        else:
            owner, repo = repo_full_name, repo_full_name

        # Fetch repository files
        files = await GitHubService.get_repo_files(gh_account.access_token, owner, repo)
        
        # Download files and build payload
        analyzed_files = []
        code_extensions = [".py", ".js", ".ts", ".java"]
        code_files = [f for f in files if any(f["path"].endswith(ext) for ext in code_extensions)]
        
        # Limit to 20 files to keep it responsive and avoid API timeouts
        for file_info in code_files[:20]:
            path = file_info["path"]
            try:
                content = await GitHubService.get_repo_contents(
                    gh_account.access_token, owner, repo, path
                )
                analyzed_files.append({
                    "path": path,
                    "content": content
                })
            except Exception as e:
                logger.warning(f"Failed to fetch content for file {path}: {e}")

        # Run deterministic analysis
        analyzer = DeterministicAnalyzer()
        result = await analyzer.analyze_repository(analyzed_files)

        # Store results
        analysis.findings = result["findings"]
        
        # Fetch user goals to customize mentorship
        user_stmt = select(User).where(User.id == user_id)
        user_result = await session.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        goals = user.goals if user else None

        # Pre-generate mentorship
        mentor_service = MentorService()
        mentorship = await mentor_service.generate_mentorship(
            result["findings"],
            repo_full_name,
            goals=goals
        )
        
        analysis.mentorship = mentorship
        analysis.status = "completed"
        analysis.completed_at = datetime.utcnow()
        await session.commit()

        logger.info(f"Analysis {analysis_id} completed successfully")

    except Exception as e:
        logger.error(f"Error running analysis {analysis_id}: {e}")
        try:
            # We fetch a fresh instance if needed, or update if it exists
            stmt = select(Analysis).where(Analysis.id == analysis_id)
            result = await session.execute(stmt)
            analysis = result.scalar_one_or_none()
            if analysis:
                analysis.status = "failed"
                analysis.error_message = str(e)
                await session.commit()
        except Exception as commit_err:
            logger.error(f"Failed to save error status for analysis {analysis_id}: {commit_err}")
