from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Environment
    environment: str = "development"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Gemini AI
    gemini_api_key: str = ""
    gemini_model_name: str = "gemini-2.5-flash"

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # File size limits (bytes)
    max_file_size_guest: int = 524_288_000  # 500MB
    max_file_size_auth: int = 3_221_225_472  # 3GB

    # Rate limits
    max_generations_guest: int = 1
    max_generations_auth: int = 2

    # Allowed video types
    allowed_video_types: list[str] = [
        "video/mp4",
        "video/quicktime",
        "video/webm",
        "video/x-msvideo",
    ]

    # SMTP Setting (For Contact Form)
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
