import os
from pathlib import Path
from typing import List, Set
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Base paths
    PROJECT_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    # Application Info
    APP_NAME: str = "Student Companion AI"
    APP_VERSION: str = "0.2.0"
    DEBUG: bool = False
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # Google Gemini AI API Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.7-flash"
    
    # Centralized Google Drive Configuration
    GOOGLE_DRIVE_MODE: str = "service_account"  # "service_account" or "oauth_user"
    GOOGLE_DRIVE_SHARED_DRIVE_ID: str = ""
    GOOGLE_DRIVE_ROOT_FOLDER_ID: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = "secrets/service-account.json"
    GOOGLE_DRIVE_OAUTH_TOKEN_PATH: str = "secrets/drive-token.json"
    GOOGLE_DRIVE_OAUTH_CLIENT_SECRETS_PATH: str = "secrets/client-secrets.json"
    GOOGLE_DRIVE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_DRIVE_OAUTH_CLIENT_SECRET: str = ""
    
    # File Upload Security Boundaries
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_EXTENSIONS: Set[str] = {".pdf", ".txt"}
    ALLOWED_MIME_TYPES: Set[str] = {"application/pdf", "text/plain"}
    
    # MongoDB Atlas Vector Search
    MONGODB_URI: str = ""
    MONGODB_DATABASE: str = "student_companion"
    MONGODB_VECTOR_COLLECTION: str = "study_chunks"
    MONGODB_VECTOR_INDEX: str = "vector_index"
    
    # Vector Embeddings
    EMBEDDING_PROVIDER: str = "gemini"
    EMBEDDING_MODEL: str = "text-embedding-004"
    EMBEDDING_DIMENSIONS: int = 768
    
    # n8n AI Agent Workflow
    N8N_WEBHOOK_URL: str = "http://localhost:5678/webhook/student-chat"
    N8N_WEBHOOK_URI: str = "http://localhost:5678/webhook/student-chat"
    N8N_AUTH_HEADER_NAME: str = "StudentCompanion"
    N8N_WEBHOOK_SECRET: str = "richu1@studcomp"
    INTERNAL_API_KEY: str = "sc-internal-secret-key-2026"
    
    # Text Extraction Limits
    MAX_PAGES_PER_DOCUMENT: int = 150
    CHUNK_SIZE_CHARS: int = 1200
    CHUNK_OVERLAP_CHARS: int = 150

    model_config = SettingsConfigDict(
        env_file=[
            Path(__file__).resolve().parent.parent.parent / ".env",
            Path(__file__).resolve().parent.parent.parent / "backend" / ".env",
            ".env",
        ],
        extra="ignore",
    )

settings = Settings()
