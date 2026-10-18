from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class ChatSource(BaseModel):
    document_id: str
    title: str
    page: Optional[int] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Student query or syllabus question")
    conversation_id: Optional[str] = Field(None, description="Existing conversation UUID, or None to start new")
    document_ids: Optional[List[str]] = Field(None, description="Optional specific document IDs to scope search")

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    answer: str
    sources: List[ChatSource] = Field(default_factory=list)
    status: str = "completed"

class N8nWorkflowPayload(BaseModel):
    conversation_id: str
    user_id: str
    user_role: str = "student"
    department_id: Optional[str] = None
    message: str
    retrieved_passages: List[Dict[str, Any]] = Field(default_factory=list)
