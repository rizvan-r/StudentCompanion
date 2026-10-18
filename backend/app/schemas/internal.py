from typing import List, Optional
from pydantic import BaseModel, Field

class InternalSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    user_id: str
    department_id: Optional[str] = None
    user_role: str = "student"
    document_ids: Optional[List[str]] = None
    top_k: int = Field(default=5, ge=1, le=20)
    min_score: float = Field(default=0.0, ge=0.0, le=1.0)

class InternalSearchPassage(BaseModel):
    chunk_id: str
    document_id: str
    title: str
    page_number: Optional[int] = None
    content: str
    score: float = 0.0

class InternalSearchResponse(BaseModel):
    query: str
    passages: List[InternalSearchPassage] = Field(default_factory=list)
    count: int = 0
