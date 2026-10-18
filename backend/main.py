import os
from typing import Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

from app.core.config import settings
from app.services.google_drive_service import drive_service
from app.services.mongo_vector_service import mongo_vector_service
from app.api import documents, assistant, requests, announcements, chat, internal, admin

app = FastAPI(
    title="Student Companion AI API",
    version="0.2.0",
    description="Student Companion AI backend with Centralized Google Drive Storage, MongoDB Atlas Vector Search & n8n AI Agent",
)

# Configure CORS for frontend access
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Modular API Routers
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(assistant.router)
app.include_router(requests.router)
app.include_router(announcements.router)
app.include_router(internal.router)
app.include_router(admin.router)

@app.get("/")
def root() -> Dict[str, Any]:
    """Root endpoint returning basic application status and features."""
    return {
        "name": "Student Companion AI API",
        "status": "online",
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "features": {
            "centralized_drive_storage": True,
            "mongodb_vector_search": True,
            "n8n_ai_orchestration": True,
            "gemini_document_qna": True,
            "campus_requests": True,
            "announcements": True,
        },
        "storage": drive_service.verify_storage_health(),
        "vector_search": mongo_vector_service.health_check(),
    }

@app.get("/health")
def health() -> Dict[str, str]:
    """Health check endpoint required for monitoring and service readiness."""
    return {"status": "ok"}

@app.get("/api/config-status")
def config_status() -> Dict[str, Any]:
    """
    Validates presence of required configuration variable names
    WITHOUT exposing any secret values.
    """
    return {
        "supabase_url_configured": bool(os.getenv("SUPABASE_URL")),
        "supabase_publishable_key_configured": bool(os.getenv("SUPABASE_PUBLISHABLE_KEY")),
        "gemini_api_key_configured": bool(os.getenv("GEMINI_API_KEY")),
        "mongodb_configured": bool(settings.MONGODB_URI),
        "mongodb_vector_index": settings.MONGODB_VECTOR_INDEX,
        "n8n_webhook_configured": bool(settings.N8N_WEBHOOK_URL),
        "google_drive_configured": drive_service.is_configured(),
        "google_drive_mode": settings.GOOGLE_DRIVE_MODE,
        "google_drive_auth_type": "oauth_user" if drive_service._is_oauth else ("service_account" if not drive_service._is_simulated else "simulator"),
        "google_drive_simulated": drive_service._is_simulated,
        "google_drive_shared_drive_set": bool(settings.GOOGLE_DRIVE_SHARED_DRIVE_ID),
        "google_drive_root_folder_set": bool(settings.GOOGLE_DRIVE_ROOT_FOLDER_ID),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)