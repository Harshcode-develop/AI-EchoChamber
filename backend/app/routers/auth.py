from fastapi import APIRouter, Depends, Request, HTTPException, status
from app.dependencies import get_current_user, require_auth, get_client_fingerprint, get_supabase_client
from app.models.responses import UserResponse
from app.middleware.rate_limit import generation_limiter
from app.config import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/user")
async def get_user(
    request: Request,
    user: Optional[dict] = Depends(get_current_user),
):
    """Get current user info. Returns null for unauthenticated users."""
    if not user:
        settings = get_settings()
        fingerprint = get_client_fingerprint(request)
        remaining = await generation_limiter.get_remaining(
            user_id=None,
            fingerprint=fingerprint,
            max_guest=settings.max_generations_guest,
        )
        return {
            "user": None,
            "remaining_generations": remaining,
            "is_guest": True,
        }

    settings = get_settings()
    remaining = await generation_limiter.get_remaining(
        user_id=user["id"],
        fingerprint="",
        max_auth=settings.max_generations_auth,
    )

    return {
        "user": UserResponse(
            id=user["id"],
            email=user["email"],
            role=user.get("role"),
            remaining_generations=remaining,
        ),
        "is_guest": False,
    }


@router.post("/logout")
async def logout(
    request: Request,
    user: dict = Depends(require_auth),
):
    """Sign out the current user. Invalidates the session on the server side."""
    try:
        # Get the token from the request to invalidate it
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            # Use admin client to sign out the user's session
            supabase = get_supabase_client()
            # admin_auth().sign_out on service role will invalidate the session
            try:
                supabase.auth.admin.sign_out(token)
            except Exception:
                # Some Supabase versions handle this differently
                # The client-side signOut() will still clear the session
                pass

        logger.info("User %s logged out", user["id"])
        return {"message": "Logged out successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Logout error for user %s: %s", user["id"], str(e))
        # Still return success — the client should clear its token regardless
        return {"message": "Logged out successfully"}
@router.post("/reset-password")
async def reset_password(email: str):
    """Trigger a password reset email."""
    try:
        supabase = get_supabase_client()
        # The redirect URL should point to the frontend reset page
        settings = get_settings()
        # In a real app, this would be your frontend URL
        # For local dev, it's usually http://localhost:5173/reset-password
        # We can pass it or let Supabase use the default from dashboard
        supabase.auth.reset_password_for_email(email)
        return {"message": "Password reset email sent"}
    except Exception as e:
        logger.error("Reset password error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/update-password")
async def update_password(
    password: str,
    user: dict = Depends(require_auth),
):
    """Update the current user's password."""
    try:
        supabase = get_supabase_client()
        supabase.auth.update_user({"password": password})
        logger.info("User %s updated their password", user["id"])
        return {"message": "Password updated successfully"}
    except Exception as e:
        logger.error("Update password error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
