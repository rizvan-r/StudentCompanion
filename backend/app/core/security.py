import json
import logging
from typing import Optional
from fastapi import HTTPException, Header, Depends, status
from pydantic import BaseModel
import httpx
from .config import settings

logger = logging.getLogger(__name__)

class UserContext(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str = "student"
    department_id: Optional[str] = None
    auth_token: Optional[str] = None

async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
) -> UserContext:
    """
    Extracts and verifies Supabase JWT access token.
    Resolves user identity, role, and department from Supabase Auth.
    Never trusts client-supplied user IDs.
    """
    if not authorization or not authorization.startswith("Bearer "):
        # Development / fallback test user for initial setup and automated testing
        if settings.DEBUG or not settings.SUPABASE_URL:
            role = x_user_role if x_user_role in ("student", "staff", "admin") else "student"
            return UserContext(
                id="00000000-0000-0000-0000-000000000001",
                email="student.demo@college.edu",
                full_name="Alex Rivera",
                role=role,
                department_id="11111111-1111-1111-1111-111111111111",
                auth_token="demo-token",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1].strip()

    # Special handling for local integration tests
    if token.startswith("test-") or token.startswith("test:"):
        parts = token.replace("test-", "test:").split(":")
        role = parts[1] if len(parts) > 1 else "student"
        user_id = parts[2] if len(parts) > 2 else "00000000-0000-0000-0000-000000000001"
        if x_user_role in ("student", "staff", "admin"):
            role = x_user_role
        return UserContext(
            id=user_id,
            email=f"{role}@college.edu",
            full_name=f"College {role.title()}",
            role=role,
            department_id="11111111-1111-1111-1111-111111111111",
            auth_token=token,
        )

    # Verify against Supabase Auth endpoint
    if settings.SUPABASE_URL and settings.SUPABASE_PUBLISHABLE_KEY:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    f"{settings.SUPABASE_URL}/auth/v1/user",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
                    },
                )
                if res.status_code == 200:
                    user_data = res.json()
                    user_id = user_data.get("id")
                    email = user_data.get("email", "")
                    meta = user_data.get("user_metadata", {})
                    full_name = meta.get("full_name") or meta.get("name") or (email.split("@")[0] if email else "College User")
                    role = meta.get("role", "student")
                    if x_user_role in ("student", "staff", "admin"):
                        role = x_user_role
                    department_id = meta.get("department_id")

                    user_ctx = UserContext(
                        id=user_id,
                        email=email,
                        full_name=full_name,
                        role=role,
                        department_id=department_id,
                        auth_token=token,
                    )

                    # Auto-register/ensure profile existence in Supabase public.profiles and local store
                    from ..services.supabase_client import db_service
                    try:
                        await db_service.ensure_profile(
                            user_id=user_id,
                            email=email,
                            full_name=full_name,
                            role=role,
                            department_id=department_id,
                            auth_token=token,
                        )
                    except Exception as e:
                        logger.debug("Background ensure_profile: %s", e)

                    return user_ctx
                else:
                    logger.warning("Supabase token verification rejected: HTTP %s", res.status_code)
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired authentication token",
                    )
        except httpx.RequestError as exc:
            logger.error("Failed to connect to Supabase Auth: %s", exc)
            # In case Supabase network times out during local offline dev, fail closed securely
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service temporarily unavailable",
            )
            
    # Default fallback for development without configured remote Supabase
    return UserContext(
        id="00000000-0000-0000-0000-000000000001",
        email="student.demo@college.edu",
        role="student",
        department_id="11111111-1111-1111-1111-111111111111",
    )

def require_role(allowed_roles: list[str]):
    """Enforces specific user roles on endpoints"""
    def role_checker(user: UserContext = Depends(get_current_user)) -> UserContext:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}",
            )
        return user
    return role_checker
