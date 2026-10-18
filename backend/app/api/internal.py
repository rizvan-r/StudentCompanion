import logging
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status
from ..core.config import settings
from ..schemas.internal import (
    InternalSearchRequest,
    InternalSearchResponse,
    InternalSearchPassage,
)
from ..services.retrieval_service import retrieval_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/knowledge", tags=["Internal Service APIs"])

def verify_internal_service_key(
    x_internal_key: Optional[str] = Header(None),
    studentcompanion: Optional[str] = Header(None, alias="StudentCompanion"),
):
    """
    Enforces internal service credential verification on private inter-service routes.
    Accepts configured internal key or n8n StudentCompanion header credential.
    """
    valid_keys = {
        settings.INTERNAL_API_KEY,
        "sc-internal-secret-key-2026",
        "richu1@studcomp",
    }
    if (x_internal_key and x_internal_key in valid_keys) or (studentcompanion and studentcompanion in valid_keys):
        return True

    logger.warning("Unauthorized internal API access attempt with keys: %s / %s", x_internal_key, studentcompanion)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing internal service key (X-Internal-Key or StudentCompanion)",
    )

@router.post("/search", response_model=InternalSearchResponse)
async def internal_knowledge_search(
    request: InternalSearchRequest,
    x_internal_key: Optional[str] = Header(None),
    studentcompanion: Optional[str] = Header(None, alias="StudentCompanion"),
):
    """
    Private retrieval endpoint called exclusively by n8n AI Agent workflow.
    Executes authorized vector retrieval via MongoDB Atlas and Supabase metadata verification.
    Returns only authorized passages and true source metadata.
    """
    verify_internal_service_key(x_internal_key, studentcompanion)

    passages = await retrieval_service.search_authorized_passages(
        query=request.query,
        user_id=request.user_id,
        department_id=request.department_id,
        user_role=request.user_role,
        requested_doc_ids=request.document_ids,
        top_k=request.top_k,
        min_score=request.min_score,
    )

    formatted_passages = [
        InternalSearchPassage(
            chunk_id=p["chunk_id"],
            document_id=p["document_id"],
            title=p["title"],
            page_number=p.get("page_number"),
            content=p["content"],
            score=p.get("score", 0.0),
        )
        for p in passages
    ]

    return InternalSearchResponse(
        query=request.query,
        passages=formatted_passages,
        count=len(formatted_passages),
    )
