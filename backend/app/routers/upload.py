from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request, status
from app.config import get_settings
from app.dependencies import get_current_user, require_auth, get_client_fingerprint
from app.models.responses import UploadResponse
from typing import Optional
import uuid
import tempfile
import aiofiles
import asyncio
import os
import re
import logging
from google import genai

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["upload"])

# Only allow alphanumeric characters, hyphens, and underscores in file IDs
FILE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")

# Allowed file extensions for temp files
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi"}


def _safe_file_extension(filename: str) -> str:
    """Extract and validate file extension, defaulting to .mp4."""
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext in ALLOWED_EXTENSIONS:
        return ext
    return ".mp4"


@router.post("/upload", response_model=UploadResponse)
async def upload_video(
    request: Request,
    file: UploadFile = File(...),
    user: Optional[dict] = Depends(get_current_user),
):
    """Directly stream a video file to Google Gemini, keeping 0 bytes on your server storage."""
    settings = get_settings()

    # Validate file type
    content_type = file.content_type or ""
    if content_type not in settings.allowed_video_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {content_type}. Allowed: MP4, MOV, WebM",
        )

    # Validate file name
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename",
        )

    # Sanitize filename — strip path components to prevent directory traversal
    safe_filename = os.path.basename(file.filename)
    file_ext = _safe_file_extension(safe_filename)

    # Determine size limit
    max_size = settings.max_file_size_auth if user else settings.max_file_size_guest
    max_size_mb = max_size // (1024 * 1024)

    file_url = ""
    total_size = 0
    fd, temp_path = tempfile.mkstemp(suffix=file_ext)
    os.close(fd)

    try:
        # 1. Stream incoming bytes straight to a transient buffer file
        async with aiofiles.open(temp_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                total_size += len(chunk)
                if total_size > max_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File too large. Maximum size: {max_size_mb}MB",
                    )
                await f.write(chunk)

        # 2. Upload directly to Gemini API in background thread
        if not settings.gemini_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured",
            )

        client = genai.Client(api_key=settings.gemini_api_key)

        def _upload_to_gemini():
            # Use unique ID to prevent name collisions on Gemini
            unique_name = f"vid-{uuid.uuid4().hex[:10]}"
            return client.files.upload(
                file=temp_path, config={"name": unique_name, "mime_type": content_type}
            )

        gemini_file = await asyncio.to_thread(_upload_to_gemini)
        file_url = gemini_file.name

        logger.info(
            "Video uploaded successfully: %s (%d bytes) by %s",
            safe_filename,
            total_size,
            user["id"] if user else "guest",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Video upload failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process and upload video. Please try again.",
        )
    finally:
        # 3. Always completely destroy the transient file to protect server storage
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                logger.warning("Failed to clean up temp file: %s", temp_path)

    return UploadResponse(
        file_url=file_url,
        file_id=file_url.replace("files/", ""),
        file_name=safe_filename,
        file_size=total_size,
    )


@router.delete("/upload/{file_id}")
async def delete_video(
    file_id: str,
    user: dict = Depends(require_auth),
):
    """Manually purge a video from Gemini's servers. Requires authentication."""
    # Validate file_id to prevent injection attacks
    if not FILE_ID_PATTERN.match(file_id) or len(file_id) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file ID format",
        )

    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured",
        )

    client = genai.Client(api_key=settings.gemini_api_key)
    try:
        # Re-prefix with Gemini's files/ namespace
        client.files.delete(name=f"files/{file_id}")
        logger.info("File deleted: files/%s by user %s", file_id, user["id"])
        return {"message": "File deleted successfully"}
    except Exception as e:
        logger.error("File deletion failed for files/%s: %s", file_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file. It may have already been removed.",
        )
