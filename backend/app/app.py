from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime, timezone
import logging
import os

from app.config import get_settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security import SecurityHeadersMiddleware, RequestSizeLimitMiddleware
from app.routers import upload, content, chatbot, auth, contact, notifications, history, admin

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Only expose docs in development
is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"

app = FastAPI(
    title="EchoChamber API",
    description="AI-powered content repurposing platform for creators",
    version="1.0.0",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    # Hide default openapi.json in production
    openapi_url=None if is_production else "/openapi.json",
)

# CORS — restricted to specific methods and headers
settings = get_settings()
origins = [o.strip() for o in settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["X-RateLimit-Remaining"],
)

# Security headers
app.add_middleware(SecurityHeadersMiddleware)

# Request body size limit (protects against memory exhaustion)
app.add_middleware(RequestSizeLimitMiddleware)

# Rate limiting
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)

# Routers
app.include_router(upload.router)
app.include_router(content.router)
app.include_router(chatbot.router)
app.include_router(auth.router)
app.include_router(contact.router)
app.include_router(notifications.router)
app.include_router(history.router)
app.include_router(admin.router)

logger.info(
    "EchoChamber API started (env=%s, docs=%s)",
    "production" if is_production else "development",
    "disabled" if is_production else "enabled",
)


@app.get("/")
def read_root():
    return {
        "name": "EchoChamber API",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }