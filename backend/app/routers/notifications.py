from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from app.dependencies import require_auth, get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    is_read: bool
    created_at: str

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(user: dict = Depends(require_auth)):
    try:
        supabase = get_supabase_client()
        response = supabase.table("notifications") \
            .select("id, title, message, is_read, created_at") \
            .eq("user_id", user["id"]) \
            .order("created_at", desc=True) \
            .execute()
        
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch notifications: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch notifications"
        )

@router.put("/{notification_id}/read", status_code=status.HTTP_200_OK)
async def mark_notification_read(notification_id: str, user: dict = Depends(require_auth)):
    try:
        supabase = get_supabase_client()
        # The SQL RLS policies ensure users can only update their own notifications
        response = supabase.table("notifications") \
            .update({"is_read": True}) \
            .eq("id", notification_id) \
            .eq("user_id", user["id"]) \
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Notification not found")
            
        return {"status": "success", "message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update notification"
        )

@router.delete("", status_code=status.HTTP_200_OK)
async def clear_all_notifications(user: dict = Depends(require_auth)):
    try:
        supabase = get_supabase_client()
        # The SQL RLS policies ensure users can only delete their own notifications
        supabase.table("notifications") \
            .delete() \
            .eq("user_id", user["id"]) \
            .execute()
            
        return {"status": "success", "message": "All notifications cleared"}
    except Exception as e:
        logger.error(f"Failed to clear notifications: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not clear notifications"
        )
