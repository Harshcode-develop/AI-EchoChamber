from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.config import get_settings
from app.dependencies import get_current_user, get_client_fingerprint, get_supabase_client
from app.models.requests import ContentGenerateRequest
from app.models.responses import ContentResponse, GeneratedContentItem
from app.services.ai_service import ai_service
from app.middleware.rate_limit import generation_limiter
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["content"])


@router.post("/generate", response_model=ContentResponse)
async def generate_content(
    request: Request,
    body: ContentGenerateRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """Generate platform-specific content from a video."""
    settings = get_settings()
    fingerprint = get_client_fingerprint(request)
    user_id = user["id"] if user else None

    # Check rate limits
    await generation_limiter.check_and_increment(
        user_id=user_id,
        fingerprint=fingerprint,
        max_guest=settings.max_generations_guest,
        max_auth=settings.max_generations_auth,
    )

    # Process video to extract transcript
    try:
        transcript = await ai_service.process_video_content(body.video_url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Video processing failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process video. Please try again later.",
        )

    # Generate content for each format
    try:
        results = await ai_service.generate_content(
            transcript=transcript,
            formats=body.formats,
            voice_examples=body.voice_examples,
            custom_instructions=body.custom_instructions,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Content generation failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Content generation failed. Please try again later.",
        )

    # Get remaining generations
    remaining = await generation_limiter.get_remaining(
        user_id=user_id,
        fingerprint=fingerprint,
        max_guest=settings.max_generations_guest,
        max_auth=settings.max_generations_auth,
    )

    # Build response
    generated_items = [
        GeneratedContentItem(**item_data) for item_data in results.values()
    ]

    # Persistent history if user is authenticated
    if user_id:
        try:
            supabase = get_supabase_client()
            # Extract filename from URL if possible, otherwise use a default
            video_name = body.video_url.split("/")[-1]
            if "?" in video_name:
                video_name = video_name.split("?")[0]
            
            supabase.table("generation_history").insert({
                "user_id": user_id,
                "video_name": video_name,
                "formats": [f.value for f in body.formats],
                "content": [item.dict() for item in generated_items]
            }).execute()
        except Exception as e:
            # Don't fail the whole request if history save fails, just log it
            logger.error("Failed to save generation history: %s", str(e))

    logger.info(
        "Content generated for %s: %d formats",
        user_id or f"guest:{fingerprint[:8]}",
        len(generated_items),
    )

    return ContentResponse(
        id=str(uuid.uuid4()),
        generated_content=generated_items,
        video_url=body.video_url,
        remaining_generations=remaining,
        created_at=datetime.now(timezone.utc).isoformat(),
    )



@router.get("/generation-status")
async def get_generation_status(
    request: Request,
    user: Optional[dict] = Depends(get_current_user),
):
    """Get remaining generations for the current user/guest."""
    settings = get_settings()
    fingerprint = get_client_fingerprint(request)
    user_id = user["id"] if user else None

    remaining = await generation_limiter.get_remaining(
        user_id=user_id,
        fingerprint=fingerprint,
        max_guest=settings.max_generations_guest,
        max_auth=settings.max_generations_auth,
    )

    max_allowed = (
        settings.max_generations_auth if user else settings.max_generations_guest
    )

    return {
        "remaining": remaining,
        "max_allowed": max_allowed,
        "is_authenticated": user is not None,
    }
