import logging
from fastapi import APIRouter, Depends, HTTPException, status
from ..core.security import get_current_user, UserContext
from ..schemas.documents import DocumentQueryRequest, DocumentQueryResponse
from ..services.document_retrieval_service import retrieval_service
from ..services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assistant", tags=["AI Study Assistant"])

@router.post("/ask", response_model=DocumentQueryResponse)
async def ask_study_assistant(
    request: DocumentQueryRequest,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Submits a student query to the AI assistant.
    If document_ids are provided or authorized documents exist, answers are
    strictly grounded in retrieved chunks with exact citations.
    Otherwise, provides general syllabus tutoring.
    """
    query = request.query.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty",
        )

    # 1. Retrieve authorized chunks if document grounding is requested or available
    retrieved_chunks = await retrieval_service.retrieve_relevant_chunks(
        query=query,
        user_id=current_user.id,
        user_role=current_user.role,
        department_id=current_user.department_id,
        requested_doc_ids=request.document_ids,
        top_k=request.top_k,
    )

    # 2. If we have chunks, generate grounded answer with citations
    if retrieved_chunks:
        result = await gemini_service.answer_document_question(
            query=query,
            retrieved_chunks=retrieved_chunks,
        )
        return DocumentQueryResponse(
            answer=result["answer"],
            citations=result["citations"],
            query=query,
            has_sufficient_context=result["has_sufficient_context"],
        )

    # 3. Otherwise, if user has no documents or asked a general concept question
    general_answer = await gemini_service.answer_general_study_question(query)
    return DocumentQueryResponse(
        answer=general_answer,
        citations=[],
        query=query,
        has_sufficient_context=True,
    )
