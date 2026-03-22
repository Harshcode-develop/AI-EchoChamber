from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class ContentFormat(str, Enum):
    LINKEDIN = "linkedin"
    X_THREAD = "x_thread"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    BLOG = "blog"


class ContentGenerateRequest(BaseModel):
    video_url: str = Field(..., description="URL or file reference of the uploaded video")
    formats: list[ContentFormat] = Field(
        ...,
        min_length=1,
        description="List of content formats to generate",
    )
    voice_examples: list[str] = Field(
        default=[],
        max_length=3,
        description="Up to 3 examples of the creator's writing style",
    )
    custom_instructions: str = Field(
        default="",
        max_length=500,
        description="Additional instructions for content generation",
    )


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=5000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=50)
    context: str = Field(
        default="",
        max_length=2000,
        description="Optional context about what the user is working on",
    )
