from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UploadResponse(BaseModel):
    file_url: str
    file_id: str
    file_name: str
    file_size: int
    message: str = "File uploaded successfully"


class GeneratedContentItem(BaseModel):
    format: str
    content: str
    title: str
    character_count: int
    word_count: int


class ContentResponse(BaseModel):
    id: str
    generated_content: list[GeneratedContentItem]
    video_url: str
    remaining_generations: int
    created_at: str


class ChatResponseItem(BaseModel):
    role: str = "assistant"
    content: str


class ChatResponse(BaseModel):
    message: ChatResponseItem
    suggested_questions: list[str] = []


class UserResponse(BaseModel):
    id: str
    email: str
    role: Optional[str] = None
    remaining_generations: int = 3


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: str


class ErrorResponse(BaseModel):
    detail: str
