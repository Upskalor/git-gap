"""GitHub OAuth + webhook API router."""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.schemas import GitHubAccountResponse, RepositoryResponse
from app.models import GitHubAccount, Repository, User
from app.services.github_service import GitHubService, GitHubAppService
from app.core.database import get_db
from app.core.deps import get_current_user

logger = structlog.get_logger()
router = APIRouter(prefix="/api/github", tags=["github"])


@router.get("/auth/url")
async def get_github_auth_url(state: str = Query(...)):
    """Get GitHub OAuth authorization URL."""
    url = GitHubService.get_oauth_url(state)
    return {"authorization_url": url}


@router.post("/auth/callback")
async def handle_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Handle GitHub OAuth callback."""
    try:
        # Exchange code for token
        token_data = await GitHubService.exchange_code_for_token(code)
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to obtain access token",
            )

        # Get user info from GitHub
        user_info = await GitHubService.get_user_info(access_token)

        # Store GitHub account
        stmt = select(GitHubAccount).where(
            GitHubAccount.github_id == str(user_info["id"])
        )
        result = await session.execute(stmt)
        gh_account = result.scalar_one_or_none()

        if gh_account:
            gh_account.access_token = access_token
            gh_account.github_username = user_info["login"]
        else:
            gh_account = GitHubAccount(
                user_id=user_id,
                github_id=str(user_info["id"]),
                github_username=user_info["login"],
                access_token=access_token,
            )
            session.add(gh_account)

        await session.commit()

        return {
            "success": True,
            "message": "GitHub account connected successfully",
            "github_username": user_info["login"],
        }
    except Exception as e:
        logger.error(f"GitHub OAuth callback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process GitHub callback",
        )


@router.get("/repositories", response_model=list[RepositoryResponse])
async def get_repositories(
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get user's GitHub repositories."""
    # Get GitHub account
    stmt = select(GitHubAccount).where(GitHubAccount.user_id == user_id)
    result = await session.execute(stmt)
    gh_account = result.scalar_one_or_none()

    if not gh_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub account not connected",
        )

    # Get repositories from GitHub
    try:
        repos = await GitHubService.get_user_repos(gh_account.access_token)

        # Store/update repositories in database
        for repo_data in repos:
            stmt = select(Repository).where(
                Repository.github_id == str(repo_data["id"])
            )
            result = await session.execute(stmt)
            repo = result.scalar_one_or_none()

            if repo:
                repo.name = repo_data["name"]
                repo.full_name = repo_data["full_name"]
                repo.description = repo_data.get("description")
                repo.language = repo_data.get("language")
                repo.stars = repo_data.get("stargazers_count", 0)
            else:
                repo = Repository(
                    owner_id=user_id,
                    github_id=str(repo_data["id"]),
                    name=repo_data["name"],
                    full_name=repo_data["full_name"],
                    description=repo_data.get("description"),
                    url=repo_data["html_url"],
                    is_private=repo_data.get("private", False),
                    language=repo_data.get("language"),
                    stars=repo_data.get("stargazers_count", 0),
                )
                session.add(repo)

        await session.commit()

        # Return repositories from database
        stmt = select(Repository).where(Repository.owner_id == user_id)
        result = await session.execute(stmt)
        return result.scalars().all()

    except Exception as e:
        logger.error(f"Error fetching repositories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch repositories",
        )


@router.post("/webhook")
async def handle_github_webhook(
    payload: dict,
    session: AsyncSession = Depends(get_db),
):
    """Handle GitHub webhook events."""
    logger.info(f"Received GitHub webhook: {payload.get('action', 'unknown')}")

    event_type = payload.get("action")

    if event_type == "opened":
        # Handle pull request opened
        pass
    elif event_type == "synchronize":
        # Handle pull request updated
        pass

    return {"status": "received"}
