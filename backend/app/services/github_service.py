"""GitHub App service - authentication, token exchange, repo fetching."""
import httpx
import base64
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class GitHubService:
    """GitHub OAuth and API integration service."""

    BASE_URL = "https://api.github.com"
    OAUTH_AUTH_URL = "https://github.com/login/oauth/authorize"
    OAUTH_TOKEN_URL = "https://github.com/login/oauth/access_token"

    @staticmethod
    def get_oauth_url(state: str) -> str:
        """Generate GitHub OAuth authorization URL."""
        params = {
            "client_id": settings.github_client_id,
            "redirect_uri": f"{settings.frontend_url}/github/callback",
            "scope": "repo user:email read:user",
            "state": state,
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{GitHubService.OAUTH_AUTH_URL}?{query_string}"

    @staticmethod
    async def exchange_code_for_token(code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GitHubService.OAUTH_TOKEN_URL,
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def get_user_info(access_token: str) -> Dict[str, Any]:
        """Get authenticated user information from GitHub."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GitHubService.BASE_URL}/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def get_user_repos(access_token: str, per_page: int = 100) -> List[Dict[str, Any]]:
        """Get all repositories for the authenticated user."""
        repos = []
        page = 1
        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(
                    f"{GitHubService.BASE_URL}/user/repos",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/vnd.github.v3+json",
                    },
                    params={"per_page": per_page, "page": page},
                )
                response.raise_for_status()
                data = response.json()
                if not data:
                    break
                repos.extend(data)
                page += 1
        return repos

    @staticmethod
    async def get_repo_contents(
        access_token: str, owner: str, repo: str, path: str = ""
    ) -> str:
        """Get repository contents."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/contents/{path}",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3.raw+json",
                },
            )
            response.raise_for_status()
            return response.text

    @staticmethod
    async def get_repo_files(
        access_token: str, owner: str, repo: str, extensions: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Get repository files recursively."""
        if extensions is None:
            extensions = [".py", ".js", ".ts", ".java", ".cpp", ".go"]
        
        files = []
        
        async def traverse_tree(tree_url):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    tree_url,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/vnd.github.v3+json",
                    },
                )
                response.raise_for_status()
                return response.json()

        # Get initial tree
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GitHubService.BASE_URL}/repos/{owner}/{repo}",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            response.raise_for_status()
            repo_data = response.json()
            default_branch = repo_data.get("default_branch", "main")
            tree_url = repo_data["url"] + f"/git/trees/{default_branch}?recursive=1"
            tree_data = await traverse_tree(tree_url)

        for item in tree_data.get("tree", []):
            if item["type"] == "blob":
                if any(item["path"].endswith(ext) for ext in extensions):
                    files.append({
                        "path": item["path"],
                        "url": item["url"],
                        "size": item.get("size", 0),
                    })

        return files


class GitHubAppService:
    """GitHub App service for bot functionality."""

    def __init__(self):
        self.app_id = settings.github_app_id
        self.private_key = base64.b64decode(settings.github_app_private_key).decode()

    def get_jwt_token(self) -> str:
        """Generate JWT token for GitHub App authentication."""
        import jwt
        from datetime import datetime, timedelta

        now = datetime.utcnow()
        payload = {
            "iat": now,
            "exp": now + timedelta(minutes=10),
            "iss": self.app_id,
        }
        token = jwt.encode(payload, self.private_key, algorithm="RS256")
        return token

    async def get_installation_access_token(self, installation_id: str) -> str:
        """Get access token for a specific installation."""
        jwt_token = self.get_jwt_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.github.com/app/installations/{installation_id}/access_tokens",
                headers={
                    "Authorization": f"Bearer {jwt_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["token"]
