from fastapi import APIRouter, HTTPException, Request, Depends, status
from app.models.requests import ChatRequest
from app.models.responses import ChatResponse, ChatResponseItem
from app.services.ai_service import ai_service
from app.dependencies import get_current_user
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chatbot"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: Request,
    body: ChatRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """Send a message to the Echo AI assistant."""
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in body.messages]

        response_text, suggested = await ai_service.chat_response(
            messages=messages,
            context=body.context,
        )

        return ChatResponse(
            message=ChatResponseItem(content=response_text),
            suggested_questions=suggested,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Chat failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat service is temporarily unavailable. Please try again.",
        )
