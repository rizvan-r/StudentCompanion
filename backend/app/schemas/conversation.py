from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class ConversationCreate(BaseModel):
    title: Optional[str] = Field("Study Session", max_length=200)

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "completed"
    created_at: str

class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    is_active: bool = True
    message_count: Optional[int] = 0

class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[MessageResponse] = Field(default_factory=list)
