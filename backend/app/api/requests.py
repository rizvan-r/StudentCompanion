from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from ..core.security import get_current_user, UserContext
from ..services.supabase_client import db_service

router = APIRouter(prefix="/api/requests", tags=["Campus Requests"])

class RequestCreate(BaseModel):
    title: str
    description: str
    request_type: str = "other"
    category: Optional[str] = None
    department_name: Optional[str] = None
    department_id: Optional[str] = None
    priority: str = "normal"
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class CommentCreate(BaseModel):
    comment: str

@router.get("")
@router.get("/")
async def list_student_requests(current_user: UserContext = Depends(get_current_user)):
    """Lists campus requests visible to user based on role."""
    return await db_service.list_requests(
        user_id=current_user.id,
        user_role=current_user.role,
        auth_token=current_user.auth_token,
    )

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_student_request(
    data: RequestCreate,
    current_user: UserContext = Depends(get_current_user),
):
    """Creates a new student grievance, leave application, or certificate request."""
    # Ensure profile exists in Supabase so foreign key student_requests.student_id REFERENCES profiles(id) succeeds
    await db_service.ensure_profile(
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        department_id=current_user.department_id,
        auth_token=current_user.auth_token,
    )

    req_dict = {
        "student_id": current_user.id,
        "title": data.title,
        "description": data.description,
        "request_type": data.request_type,
        "category": data.category,
        "department_name": data.department_name,
        "department_id": data.department_id or current_user.department_id,
        "priority": data.priority,
        "status": "pending",
        "metadata": data.metadata or {},
        "ticket_number": f"REQ-2026-{abs(hash(data.title)) % 10000:04d}",
    }
    return await db_service.create_request(req_dict, auth_token=current_user.auth_token)

@router.get("/{request_id}")
async def get_request_details(
    request_id: str,
    current_user: UserContext = Depends(get_current_user),
):
    """Retrieves full details of a specific campus request."""
    requests = await db_service.list_requests(
        user_id=current_user.id,
        user_role=current_user.role,
        auth_token=current_user.auth_token,
    )
    for r in requests:
        if r.get("id") == request_id or r.get("reference_number") == request_id or r.get("ticket_number") == request_id:
            return r
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

@router.post("/{request_id}/comments")
async def add_request_comment(
    request_id: str,
    data: CommentCreate,
    current_user: UserContext = Depends(get_current_user),
):
    """Adds staff or student clarification reply to a campus request."""
    return {
        "id": f"comment-{abs(hash(data.comment)) % 100000}",
        "request_id": request_id,
        "author": current_user.full_name or current_user.email,
        "author_role": current_user.role,
        "comment": data.comment,
        "created_at": "Just now",
    }
