from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from supabase import create_client, Client
from app.config import Settings, get_settings
from functools import lru_cache
from typing import Optional
import hashlib
import logging

logger = logging.getLogger(__name__)


@lru_cache()
def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def _get_token_from_header(request: Request) -> Optional[str]:
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        # Basic token validation: must not be empty and must be reasonable length
        if token and len(token) < 10_000:
            return token
    return None


async def get_current_user(request: Request) -> Optional[dict]:
    """Extract and verify user from Supabase JWT. Returns None for guests."""
    token = _get_token_from_header(request)
    if not token:
        return None

    settings = get_settings()
    try:
        # Verify by checking with Supabase auth
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return {
                "id": str(user_response.user.id),
                "email": user_response.user.email,
                "role": user_response.user.role,
            }
    except Exception as e:
        # Log the auth failure for security monitoring, but don't expose details
        logger.warning(
            "Auth verification failed for IP %s: %s",
            request.client.host if request.client else "unknown",
            type(e).__name__,
        )
    return None


async def require_auth(user: Optional[dict] = Depends(get_current_user)) -> dict:
    """Dependency that requires authentication."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_client_fingerprint(request: Request) -> str:
    """Generate a fingerprint for guest users based on IP + User-Agent."""
    # Support X-Forwarded-For for real client IP behind proxies
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
        
    ua = request.headers.get("user-agent", "unknown")
    raw = f"{ip}:{ua}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]
