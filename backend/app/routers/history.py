from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Any
from app.dependencies import require_auth, get_supabase_client
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/history", tags=["history"])


class HistoryRename(BaseModel):
    video_name: str


class HistoryEntryCreate(BaseModel):
    video_name: str
    formats: List[str]
    content: Any  # List of GeneratedContentItem dicts stored as JSONB


class HistoryEntryResponse(BaseModel):
    id: str
    video_name: str
    formats: List[str]
    content: Any
    created_at: str


@router.get("", response_model=List[HistoryEntryResponse])
async def get_history(user: dict = Depends(require_auth)):
    """Fetch all generation history entries for the authenticated user."""
    try:
        supabase = get_supabase_client()
        response = (
            supabase.table("generation_history")
            .select("id, video_name, formats, content, created_at")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch generation history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch generation history",
        )


@router.post("", response_model=HistoryEntryResponse, status_code=status.HTTP_201_CREATED)
async def save_history_entry(body: HistoryEntryCreate, user: dict = Depends(require_auth)):
    """Save a new generation history entry for the authenticated user."""
    try:
        supabase = get_supabase_client()
        
        # Unique naming format: FORMAT_ID_OriginalName
        format_prefix = body.formats[0].split('_')[0].upper() if body.formats else "GEN"
        unique_id = uuid.uuid4().hex[:4].upper()
        unique_video_name = f"{format_prefix}_{unique_id}_{body.video_name}"
        
        response = (
            supabase.table("generation_history")
            .insert(
                {
                    "user_id": user["id"],
                    "video_name": unique_video_name,
                    "formats": body.formats,
                    "content": body.content,
                }
            )
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=500, detail="Insert returned no data")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save generation history entry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save generation history entry",
        )


@router.delete("/{entry_id}", status_code=status.HTTP_200_OK)
async def delete_history_entry(entry_id: str, user: dict = Depends(require_auth)):
    """Delete a single generation history entry."""
    try:
        supabase = get_supabase_client()
        response = (
            supabase.table("generation_history")
            .delete()
            .eq("id", entry_id)
            .eq("user_id", user["id"])
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="History entry not found")
        return {"status": "success", "message": "Entry deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete history entry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete history entry",
        )


@router.delete("", status_code=status.HTTP_200_OK)
async def clear_history(user: dict = Depends(require_auth)):
    """Clear all generation history entries for the authenticated user."""
    try:
        supabase = get_supabase_client()
        supabase.table("generation_history").delete().eq("user_id", user["id"]).execute()
        return {"status": "success", "message": "All history cleared"}
    except Exception as e:
        logger.error(f"Failed to clear history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not clear generation history",
        )


@router.patch("/{entry_id}/rename", response_model=HistoryEntryResponse)
async def rename_history_entry(entry_id: str, body: HistoryRename, user: dict = Depends(require_auth)):
    """Rename a generation history entry."""
    try:
        supabase = get_supabase_client()
        logger.info(f"Renaming entry {entry_id} for user {user['id']} to {body.video_name}")
        
        response = (
            supabase.table("generation_history")
            .update({"video_name": body.video_name})
            .eq("id", entry_id)
            .eq("user_id", user["id"])
            .execute()
        )
        
        if not response.data:
            logger.warning(f"No entry found or unauthorized for ID {entry_id}")
            raise HTTPException(status_code=404, detail="History entry not found")
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to rename history entry {entry_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rename failed: {str(e)}",
        )
