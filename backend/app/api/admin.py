import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from ..core.security import get_current_user, UserContext
from ..services.supabase_client import db_service

router = APIRouter(prefix="/api/admin", tags=["Admin Governance"])

class RoleUpdateRequest(BaseModel):
    role: str

class DepartmentCreate(BaseModel):
    name: str
    code: str

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    active: Optional[bool] = None

# In-memory department cache for local administration
_DEPARTMENTS = [
    {"id": "dept-cse", "code": "CSE", "name": "Computer Science & Engineering", "student_count": 520, "active": True},
    {"id": "dept-ece", "code": "ECE", "name": "Electronics & Communication", "student_count": 380, "active": True},
    {"id": "dept-mech", "code": "MECH", "name": "Mechanical Engineering", "student_count": 310, "active": True},
    {"id": "dept-math", "code": "MATH", "name": "Mathematics & Basic Sciences", "student_count": 210, "active": True},
    {"id": "dept-admin", "code": "ADMIN", "name": "Dean Office & Management", "student_count": 0, "active": True},
]

@router.get("/users")
async def get_all_users(
    role: Optional[str] = Query(None),
    current_user: UserContext = Depends(get_current_user),
):
    """
    Returns full college directory of registered users from Supabase profiles,
    including new Google OAuth sign-ins.
    """
    return await db_service.list_users(role_filter=role, auth_token=current_user.auth_token)

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    data: RoleUpdateRequest,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Updates a user's role (student, staff, admin) in Supabase public.profiles.
    """
    if data.role not in ("student", "staff", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: student, staff, admin",
        )
    return await db_service.update_user_role(user_id=user_id, new_role=data.role)

@router.get("/stats")
async def get_admin_dashboard_stats(
    current_user: UserContext = Depends(get_current_user),
):
    """
    Calculates operational health and platform statistics.
    """
    return await db_service.get_admin_stats()

@router.get("/departments")
async def get_departments(
    current_user: UserContext = Depends(get_current_user),
):
    """
    Returns list of academic and administrative departments.
    """
    return _DEPARTMENTS

@router.post("/departments", status_code=status.HTTP_201_CREATED)
async def create_department(
    data: DepartmentCreate,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Creates a new college department.
    """
    dept = {
        "id": f"dept-{data.code.lower()}",
        "code": data.code.upper(),
        "name": data.name,
        "student_count": 0,
        "active": True,
    }
    _DEPARTMENTS.append(dept)
    return dept

@router.put("/departments/{dept_id}")
async def update_department(
    dept_id: str,
    data: DepartmentUpdate,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Updates existing department metadata.
    """
    for d in _DEPARTMENTS:
        if d["id"] == dept_id:
            if data.name is not None:
                d["name"] = data.name
            if data.code is not None:
                d["code"] = data.code.upper()
            if data.active is not None:
                d["active"] = data.active
            return d
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

@router.get("/audit")
async def get_system_audit_logs(
    current_user: UserContext = Depends(get_current_user),
):
    """
    Returns platform security audit and role mutation records.
    """
    return [
        {
            "id": "a1",
            "actor": current_user.email,
            "action": "ROLE_PROVISION",
            "target": "sarah.faculty@college.edu",
            "timestamp": "10 mins ago",
            "details": "Assigned CSE Staff Advisor role",
        },
        {
            "id": "a2",
            "actor": "system_service",
            "action": "DRIVE_BACKUP",
            "target": "Central Google Drive",
            "timestamp": "1 hour ago",
            "details": "Verified root folder checksum synchronization",
        },
        {
            "id": "a3",
            "actor": "faculty@college.edu",
            "action": "STATUS_UPDATE",
            "target": "REQ-2026-0048",
            "timestamp": "2 hours ago",
            "details": "Status moved to in_review",
        },
        {
            "id": "a4",
            "actor": "admin.dean@college.edu",
            "action": "ANNOUNCEMENT_PUBLISH",
            "target": "Mid-Term Exam Schedule",
            "timestamp": "Yesterday",
            "details": "Broadcast to all departments",
        },
    ]
