from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class DocumentVisibility(str, Enum):
    PRIVATE = "private"
    DEPARTMENT = "department"
    CAMPUS = "campus"

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    visibility: DocumentVisibility = DocumentVisibility.PRIVATE

class DocumentCreateResponse(BaseModel):
    id: str
    title: str
    file_name: str
    original_filename: Optional[str] = None
    file_size_bytes: int
    mime_type: str
    visibility: DocumentVisibility
    processing_status: ProcessingStatus
    status: Optional[str] = None
    drive_file_id: str
    created_at: datetime

class DocumentItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    file_name: str
    original_filename: Optional[str] = None
    file_size_bytes: int
    mime_type: str
    drive_file_id: str
    drive_folder_id: Optional[str] = None
    owner_id: str
    department_id: Optional[str] = None
    visibility: DocumentVisibility
    processing_status: ProcessingStatus
    status: Optional[str] = None
    error_message: Optional[str] = None
    file_checksum_sha256: str
    page_count: int = 0
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime

class DocumentStatusResponse(BaseModel):
    id: str
    processing_status: ProcessingStatus
    status: Optional[str] = None
    error_message: Optional[str] = None
    page_count: int
    chunk_count: int

class CitationItem(BaseModel):
    document_id: str
    document_title: str
    page_number: int
    snippet: str

class DocumentQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000)
    document_ids: Optional[List[str]] = None
    top_k: int = Field(default=4, ge=1, le=10)

class DocumentQueryResponse(BaseModel):
    answer: str
    citations: List[CitationItem] = []
    query: str
    has_sufficient_context: bool
    conversation_id: Optional[str] = None
