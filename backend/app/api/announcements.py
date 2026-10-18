from fastapi import APIRouter
from ..services.supabase_client import db_service

router = APIRouter(prefix="/api/announcements", tags=["Campus Announcements"])

@router.get("")
async def list_announcements():
    """Lists campus announcements and official circulars."""
    return await db_service.list_announcements()
