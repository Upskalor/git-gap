import hashlib
import hmac
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Request, status

# Configure structured logging for the standalone module
logger = logging.getLogger("github.webhooks")
logging.basicConfig(level=logging.INFO)

# Router definition to easily mount onto any FastAPI app instance
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def get_webhook_secret() -> Optional[str]:
    """
    Retrieves the webhook secret from the environment.
    
    Replace or configure this function to match your project's settings system.
    """
    return os.getenv("GITHUB_WEBHOOK_SECRET")


async def verify_signature(request: Request, x_hub_signature_256: Optional[str]) -> None:
    """
    Validates that the incoming request is authentic and originated from GitHub.

    Computes the HMAC hex digest using the configured secret and compares it
    with the signature provided in the headers using a constant-time comparison.

    Args:
        request: The raw FastAPI request object containing the body payload.
        x_hub_signature_256: The signature header string sent by GitHub.

    Raises:
        HTTPException: 401 Unauthorized if the signature header is missing.
        HTTPException: 403 Forbidden if the signature validation fails.
    """
    secret = get_webhook_secret()
    
    if not secret:
        logger.warning(
            "SECURITY WARNING: GITHUB_WEBHOOK_SECRET environment variable is not set. "
            "Skipping signature validation. DO NOT USE IN PRODUCTION."
        )
        return

    if not x_hub_signature_256:
        logger.error("Signature Validation Failed: Missing X-Hub-Signature-256 header.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing GitHub signature header (X-Hub-Signature-256)",
        )

    # Read the raw request body bytes for checksum calculation
    body_bytes = await request.body()

    # Generate standard expected HMAC SHA-256 signature
    hmac_obj = hmac.new(
        key=secret.encode("utf-8"),
        msg=body_bytes,
        digestmod=hashlib.sha256
    )
    expected_signature = f"sha256={hmac_obj.hexdigest()}"

    # Perform timing-attack resistant comparison
    if not hmac.compare_digest(expected_signature, x_hub_signature_256):
        logger.error("Signature Validation Failed: HMAC SHA-256 signature mismatch.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid webhook signature validation failed",
        )


def process_webhook_payload(payload: Dict[str, Any]) -> None:
    """
    PLACEHOLDER: Custom business logic hook.
    
    Integrators should replace the contents of this function with their own 
    database persistence layer, queuing mechanism, or event dispatchers.
    
    Args:
        payload: The parsed GitHub webhook JSON payload dictionary.
    """
    # Example: Integrate your database operations here
    # e.g., session = SessionLocal() -> session.add(Commit(...)) -> session.commit()
    logger.info("Custom Logic Hook: Received validated payload ready for processing.")


@router.post("/github")
async def github_webhook_receiver(
    request: Request,
    x_github_event: Optional[str] = Header(None),
    x_hub_signature_256: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Ingestion gateway endpoint for GitHub Webhook events.

    Listens for:
      - 'ping': A handshake check triggered during webhook registration on GitHub.
      - 'push': Real-time commit push notifications. Extracts commit messages, 
                timestamps, authors, and writes them to a local JSON file.

    Args:
        request: FastAPI HTTP request wrapper.
        x_github_event: Custom header identifying the GitHub event type.
        x_hub_signature_256: HMAC security hash signature.

    Returns:
        A structured JSON response detailing the outcome of the webhook execution.
    """
    # 1. Enforce payload security signatures
    await verify_signature(request, x_hub_signature_256)

    # 2. Extract Event Header
    if not x_github_event:
        logger.error("Webhook processing aborted: Missing X-GitHub-Event header.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-GitHub-Event header",
        )

    # 3. Handle Ping Handshake
    if x_github_event == "ping":
        logger.info("GitHub Webhook handshake successful: Received ping event.")
        return {
            "status": "success",
            "message": "Connection established successfully. Webhook receiver is listening."
        }

    # 4. Handle Push Notification
    if x_github_event == "push":
        payload = await request.json()
        repo_data = payload.get("repository", {})
        repo_name = repo_data.get("full_name", "")
        short_repo_name = repo_data.get("name", "unknown_repo")

        if not repo_name:
            logger.error("Webhook processing aborted: Invalid payload repository structure.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload structure: missing repository identifiers"
            )

        # Extract branch name from payload 'ref' (e.g. 'refs/heads/main' -> 'main')
        ref = payload.get("ref", "")
        branch = ref.split("/")[-1] if ref else "unknown_branch"

        # -------------------------------------------------------------
        # Log to Local Sandbox JSON file (reponame_branch_day_timestamp.json)
        # -------------------------------------------------------------
        incoming_commits = payload.get("commits", [])
        simplified_commits = []
        
        for item in incoming_commits:
            message = item.get("message", "No message provided")
            timestamp = item.get("timestamp", "")
            author_data = item.get("author", {})
            author_name = author_data.get("name") or author_data.get("username") or "Unknown Author"
            
            # Extract lists of affected files
            added_files = item.get("added", [])
            modified_files = item.get("modified", [])
            removed_files = item.get("removed", [])
            
            simplified_commits.append({
                "commit_sha": item.get("id"),
                "commit_message": message,
                "timestamp": timestamp,
                "author": author_name,
                "changes_summary": {
                    "files_added": added_files,
                    "files_modified": modified_files,
                    "files_removed": removed_files
                }
            })

        # Calculate time metadata
        now = datetime.now()
        day_name = now.strftime("%A")
        timestamp_str = now.strftime("%Y-%m-%d_%H-%M-%S")
        
        # Prevent directory traversal anomalies in file system writing
        safe_repo_name = short_repo_name.replace("/", "_").replace("\\", "_")
        filename = f"{safe_repo_name}_{branch}_{day_name}_{timestamp_str}.json"
        
        # Build path to saved_payloads directory relative to this folder
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        saved_dir = os.path.join(base_dir, "saved_payloads")
        os.makedirs(saved_dir, exist_ok=True)
        filepath = os.path.join(saved_dir, filename)
        
        output_payload = {
            
            "repository": repo_name,
            "branch": branch,
            "total_commits": len(simplified_commits),
            "commits": simplified_commits
        }
        
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(output_payload, f, indent=2, ensure_ascii=False)
            logger.info(f"Sandbox Logging: Wrote webhook payload log to {filepath}")
        except Exception as exc_file:
            logger.error(f"Sandbox Logging Failure: Could not write file: {exc_file}")
        # -------------------------------------------------------------

        # 5. Dispatch payload to custom business logic hook
        process_webhook_payload(payload)

        return {
            "status": "success",
            "message": f"Successfully parsed {len(simplified_commits)} commits.",
            "repository": repo_name,
            "branch": branch,
            "saved_file": filename,
            "payload": output_payload
        }

    # Graceful fallback for unsupported webhooks
    logger.info(f"Ignored webhook event: Event type '{x_github_event}' is currently unhandled.")
    return {
        "status": "ignored",
        "message": f"Webhook event '{x_github_event}' is currently unhandled."
    }
