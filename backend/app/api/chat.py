import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from ..core.security import get_current_user, UserContext
from ..schemas.chat import ChatRequest, ChatResponse, ChatSource
from ..schemas.conversation import (
    ConversationCreate,
    ConversationSummary,
    MessageResponse,
)
from ..repositories.conversation_repository import conversation_repository
from ..services.retrieval_service import retrieval_service
from ..services.n8n_service import n8n_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Student AI Chat & Conversations"])

@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def post_chat_message(
    request: ChatRequest,
    current_user: UserContext = Depends(get_current_user),
    idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    """
    Primary Student Chat Endpoint.
    1. Authenticates student and validates message.
    2. Resolves or creates persistent conversation session.
    3. Persists user message in Supabase.
    4. Performs authorized semantic retrieval via MongoDB Atlas Vector Search.
    5. Dispatches to n8n AI Agent Workflow with Gemini model.
    6. Persists assistant response and citations.
    7. Returns consistent structured response.
    """
    message_text = request.message.strip()
    if not message_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    # 1. Resolve or verify conversation session ownership
    conversation_id = request.conversation_id
    if conversation_id:
        existing_session = await conversation_repository.get_session(conversation_id, current_user.id)
        if not existing_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied.",
            )
    else:
        new_session = await conversation_repository.create_session(
            user_id=current_user.id,
            title=message_text[:45],
        )
        conversation_id = new_session["id"]

    # 2. Persist user message
    user_msg_record = await conversation_repository.save_message(
        conversation_id=conversation_id,
        user_id=current_user.id,
        role="user",
        content=message_text,
    )

    # 3. Retrieve authorized passages via MongoDB Atlas Vector Search
    passages = await retrieval_service.search_authorized_passages(
        query=message_text,
        user_id=current_user.id,
        department_id=current_user.department_id,
        user_role=current_user.role,
        requested_doc_ids=request.document_ids,
        top_k=5,
    )

    # 4. Invoke n8n AI Agent (or resilient Gemini fallback)
    try:
        agent_result = await n8n_service.invoke_agent_workflow(
            conversation_id=conversation_id,
            user_id=current_user.id,
            message=message_text,
            user_role=current_user.role,
            department_id=current_user.department_id,
            retrieved_passages=passages,
        )
    except Exception as e:
        logger.error("AI workflow failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Assistant service temporarily unavailable. Please retry in a moment.",
        )

    answer_text = agent_result.get("answer", "")
    sources_data = agent_result.get("sources", [])

    # 5. Persist assistant message with citations
    assistant_msg_record = await conversation_repository.save_message(
        conversation_id=conversation_id,
        user_id=current_user.id,
        role="assistant",
        content=answer_text,
        sources=sources_data,
        status="completed",
    )

    formatted_sources = [
        ChatSource(
            document_id=s.get("document_id", ""),
            title=s.get("title", "Study Document"),
            page=s.get("page"),
        )
        for s in sources_data
    ]

    return ChatResponse(
        conversation_id=conversation_id,
        message_id=assistant_msg_record["id"],
        answer=answer_text,
        sources=formatted_sources,
        status="completed",
    )

# ==============================================================================
# Conversation History Management
# ==============================================================================

@router.post("/conversations", response_model=ConversationSummary, status_code=status.HTTP_201_CREATED)
async def create_new_conversation(
    payload: Optional[ConversationCreate] = None,
    current_user: UserContext = Depends(get_current_user),
):
    """Creates a new active conversation session for the student."""
    title = payload.title if payload and payload.title else "New Conversation"
    session = await conversation_repository.create_session(
        user_id=current_user.id,
        title=title,
    )
    return ConversationSummary(
        id=session["id"],
        title=session["title"],
        created_at=session["created_at"],
        updated_at=session["updated_at"],
        is_active=session.get("is_active", True),
        message_count=0,
    )

@router.get("/conversations", response_model=List[ConversationSummary])
async def list_user_conversations(
    current_user: UserContext = Depends(get_current_user),
):
    """Lists all conversation sessions owned by the authenticated student."""
    sessions = await conversation_repository.list_sessions(user_id=current_user.id)
    return [
        ConversationSummary(
            id=s["id"],
            title=s.get("title", "Study Session"),
            created_at=s.get("created_at", ""),
            updated_at=s.get("updated_at", ""),
            is_active=s.get("is_active", True),
        )
        for s in sessions
    ]

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    current_user: UserContext = Depends(get_current_user),
):
    """Loads all chat messages for a specific conversation session, strictly verifying ownership."""
    messages = await conversation_repository.list_messages(
        conversation_id=conversation_id,
        user_id=current_user.id,
    )
    return [
        MessageResponse(
            id=m["id"],
            conversation_id=m["conversation_id"],
            role=m["role"],
            content=m["content"],
            sources=m.get("sources", []),
            status=m.get("status", "completed"),
            created_at=m.get("created_at", ""),
        )
        for m in messages
    ]

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: UserContext = Depends(get_current_user),
):
    """Deletes a conversation session and cascades deletion to all messages, enforcing ownership."""
    deleted = await conversation_repository.delete_session(
        session_id=conversation_id,
        user_id=current_user.id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied",
        )
    return {"success": True, "message": "Conversation deleted successfully"}
