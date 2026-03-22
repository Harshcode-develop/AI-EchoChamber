from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.dependencies import require_auth, get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# NOTE: In a production app, we would check a 'role' or 'is_admin' field on the user.
# For now, we allow the authenticated person to send notifications.

class NotificationCreate(BaseModel):
    user_id: str = Field(..., description="The ID of the user to notify")
    title: str = Field(..., min_length=2, max_length=100)
    message: str = Field(..., min_length=5, max_length=500)

@router.post("/notify", status_code=status.HTTP_201_CREATED)
async def send_user_notification(body: NotificationCreate, admin: dict = Depends(require_auth)):
    """
    Send a direct notification to a specific user's account.
    This effectively acts as a 'reply' in the user's dashboard.
    """
    # Replace the next block with a real admin check in production
    # if admin.get("email") != "sonic.codex@gmail.com":
    #    raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        supabase = get_supabase_client()
        response = supabase.table("notifications").insert({
            "user_id": body.user_id,
            "title": body.title,
            "message": body.message,
            "is_read": False
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to send notification")
            
        return {"status": "success", "message": "Notification sent successfully"}
        
    except Exception as e:
        logger.error(f"Failed to send admin notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not send notification: {str(e)}"
        )
