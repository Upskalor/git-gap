"""Celery worker tasks for async repo analysis."""
from celery import Celery, Task
from celery.utils.log import get_task_logger
from typing import Dict, Any, List
import structlog

from app.core.config import settings
from app.services.deterministic import DeterministicAnalyzer
from app.services.github_service import GitHubService
from app.services.mentor_service import MentorService

logger = get_task_logger(__name__)

# Initialize Celery
celery_app = Celery(
    "dualloop",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(bind=True, name="analyze_repository")
def analyze_repository_task(
    self, analysis_id: str, repo_url: str, access_token: str
) -> Dict[str, Any]:
    """Async task to analyze a repository."""
    try:
        logger.info(f"Starting analysis for {analysis_id}")
        
        # Extract owner and repo from URL
        parts = repo_url.rstrip("/").split("/")
        owner = parts[-2]
        repo = parts[-1]
        
        # Fetch repository files
        files = GitHubService.get_user_repos(access_token)
        
        # Run deterministic analysis
        analyzer = DeterministicAnalyzer()
        findings = analyzer.analyze_repository(files)
        
        logger.info(f"Analysis completed for {analysis_id}")
        
        return {
            "analysis_id": analysis_id,
            "status": "completed",
            "findings": findings,
        }
    except Exception as e:
        logger.error(f"Error analyzing repository {analysis_id}: {str(e)}")
        return {
            "analysis_id": analysis_id,
            "status": "failed",
            "error": str(e),
        }


@celery_app.task(bind=True, name="generate_mentorship")
def generate_mentorship_task(
    self, analysis_id: str, findings: List[Dict[str, Any]], repo_name: str
) -> Dict[str, Any]:
    """Async task to generate mentorship from findings."""
    try:
        logger.info(f"Generating mentorship for {analysis_id}")
        
        mentor_service = MentorService()
        mentorship_content = mentor_service.generate_mentorship(
            findings, repo_name
        )
        
        logger.info(f"Mentorship generated for {analysis_id}")
        
        return {
            "analysis_id": analysis_id,
            "mentorship": mentorship_content,
        }
    except Exception as e:
        logger.error(f"Error generating mentorship {analysis_id}: {str(e)}")
        return {
            "analysis_id": analysis_id,
            "error": str(e),
        }


@celery_app.task(bind=True, name="sync_github_repos")
def sync_github_repos_task(self, user_id: str, access_token: str) -> Dict[str, Any]:
    """Async task to sync GitHub repositories for a user."""
    try:
        logger.info(f"Syncing repos for user {user_id}")
        
        repos = GitHubService.get_user_repos(access_token)
        
        logger.info(f"Synced {len(repos)} repos for user {user_id}")
        
        return {
            "user_id": user_id,
            "repos_synced": len(repos),
            "status": "completed",
        }
    except Exception as e:
        logger.error(f"Error syncing repos for user {user_id}: {str(e)}")
        return {
            "user_id": user_id,
            "status": "failed",
            "error": str(e),
        }
