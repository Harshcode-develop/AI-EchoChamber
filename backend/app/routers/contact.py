from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
import smtplib
from email.message import EmailMessage
from app.config import get_settings
from app.dependencies import get_current_user, get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/contact", tags=["contact"])

class ContactRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., description="User email for replies")
    subject: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=10, max_length=1000)
    user_id: Optional[str] = None

@router.post("", status_code=status.HTTP_200_OK)
async def submit_contact_form(request: ContactRequest, user: Optional[dict] = Depends(get_current_user)):
    settings = get_settings()
    uid = user["id"] if user else request.user_id

    # 1. Save to Supabase for record-keeping and admin replies
    try:
        supabase = get_supabase_client()
        supabase.table("contact_messages").insert({
            "user_id": uid,
            "name": request.name,
            "email": request.email,
            "subject": request.subject,
            "message": request.message,
            "status": "pending"
        }).execute()
        logger.info(f"Contact message from {request.name} saved to database.")
    except Exception as e:
        logger.warning(f"Failed to save contact message to database, proceeding with email: {str(e)}")

    # 2. Send email notification to admin
    if not settings.smtp_username or not settings.smtp_password:
        logger.warning("SMTP credentials not configured, skipped email part.")
        return {"status": "success", "message": "Your message has been received."}

    try:
        msg = EmailMessage()
        msg.set_content(f"""New support request from EchoChamber:
        
Name: {request.name}
Email: {request.email}
User ID: {uid or 'Guest'}

Message:
{request.message}
""")
        msg["Subject"] = f"[EchoChamber Support] {request.subject}"
        msg["From"] = settings.smtp_username
        msg["To"] = "sonic.codex@gmail.com"
        msg["Reply-To"] = request.email

        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)

        return {"status": "success", "message": "Your message has been sent successfully."}

    except Exception as e:
        logger.error(f"SMTP error: {str(e)}")
        # We don't fail the whole request because it's already in Supabase
        return {"status": "success", "message": "Your message was received and registered."}
