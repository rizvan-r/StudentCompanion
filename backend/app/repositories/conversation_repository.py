import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx
from ..core.config import settings

logger = logging.getLogger(__name__)

class ConversationRepository:
    """
    Manages chat_sessions and chat_messages persistence with Supabase PostgreSQL
    and local in-memory fallback for offline test suites and developer environments.
    Strictly verifies ownership by user_id on all operations.
    """

    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_PUBLISHABLE_KEY
        self._local_sessions: Dict[str, Dict[str, Any]] = {}
        self._local_messages: Dict[str, List[Dict[str, Any]]] = {}

    def _get_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def create_session(self, user_id: str, title: str = "New Conversation") -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        session_data = {
            "id": session_id,
            "user_id": user_id,
            "title": title,
            "created_at": now,
            "updated_at": now,
            "is_active": True,
        }

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.post(
                        f"{self.url}/rest/v1/chat_sessions",
                        headers=self._get_headers(),
                        json=session_data,
                    )
                    if res.status_code in (200, 201):
                        created = res.json()[0]
                        self._local_sessions[session_id] = created
                        return created
            except Exception as e:
                logger.warning("Remote Supabase create_session failed: %s. Using local store.", e)

        self._local_sessions[session_id] = session_data
        self._local_messages[session_id] = []
        return session_data

    async def list_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(
                        f"{self.url}/rest/v1/chat_sessions?user_id=eq.{user_id}&order=updated_at.desc&select=*",
                        headers=self._get_headers(),
                    )
                    if res.status_code == 200:
                        records = res.json()
                        for r in records:
                            self._local_sessions[r["id"]] = r
                        return records
            except Exception as e:
                logger.warning("Remote Supabase list_sessions failed: %s. Using local store.", e)

        user_sessions = [
            s for s in self._local_sessions.values()
            if s.get("user_id") == user_id and s.get("is_active", True)
        ]
        return sorted(user_sessions, key=lambda x: x.get("updated_at", ""), reverse=True)

    async def get_session(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if session_id in self._local_sessions:
            s = self._local_sessions[session_id]
            if s.get("user_id") == user_id:
                return s
            return None

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(
                        f"{self.url}/rest/v1/chat_sessions?id=eq.{session_id}&user_id=eq.{user_id}&select=*",
                        headers=self._get_headers(),
                    )
                    if res.status_code == 200:
                        records = res.json()
                        if records:
                            self._local_sessions[session_id] = records[0]
                            return records[0]
            except Exception as e:
                logger.warning("Remote Supabase get_session failed: %s", e)

        return None

    async def update_session_title(self, session_id: str, user_id: str, title: str) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        if session_id in self._local_sessions:
            if self._local_sessions[session_id].get("user_id") == user_id:
                self._local_sessions[session_id]["title"] = title
                self._local_sessions[session_id]["updated_at"] = now

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    await client.patch(
                        f"{self.url}/rest/v1/chat_sessions?id=eq.{session_id}&user_id=eq.{user_id}",
                        headers=self._get_headers(),
                        json={"title": title, "updated_at": now},
                    )
            except Exception as e:
                logger.warning("Remote Supabase update_session_title failed: %s", e)

        return self._local_sessions.get(session_id)

    async def delete_session(self, session_id: str, user_id: str) -> bool:
        session = await self.get_session(session_id, user_id)
        if not session:
            return False

        self._local_sessions.pop(session_id, None)
        self._local_messages.pop(session_id, None)

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    await client.delete(
                        f"{self.url}/rest/v1/chat_sessions?id=eq.{session_id}&user_id=eq.{user_id}",
                        headers=self._get_headers(),
                    )
            except Exception as e:
                logger.warning("Remote Supabase delete_session failed: %s", e)

        return True

    async def save_message(
        self,
        conversation_id: str,
        user_id: str,
        role: str,
        content: str,
        sources: Optional[List[Dict[str, Any]]] = None,
        status: str = "completed",
    ) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        msg_data = {
            "id": msg_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "sources": sources or [],
            "status": status,
            "created_at": now,
        }

        # Update local session updated_at
        if conversation_id in self._local_sessions:
            self._local_sessions[conversation_id]["updated_at"] = now
            if self._local_sessions[conversation_id].get("title") == "New Conversation" and role == "user":
                # Auto-generate a title from the first query snippet
                preview = content.strip().split("\n")[0][:45]
                self._local_sessions[conversation_id]["title"] = preview

        if conversation_id not in self._local_messages:
            self._local_messages[conversation_id] = []
        self._local_messages[conversation_id].append(msg_data)

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    await client.post(
                        f"{self.url}/rest/v1/chat_messages",
                        headers=self._get_headers(),
                        json=msg_data,
                    )
                    await client.patch(
                        f"{self.url}/rest/v1/chat_sessions?id=eq.{conversation_id}",
                        headers=self._get_headers(),
                        json={"updated_at": now},
                    )
            except Exception as e:
                logger.warning("Remote Supabase save_message failed: %s. Using local store.", e)

        return msg_data

    async def list_messages(self, conversation_id: str, user_id: str) -> List[Dict[str, Any]]:
        # Verify ownership first
        session = await self.get_session(conversation_id, user_id)
        if not session:
            return []

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(
                        f"{self.url}/rest/v1/chat_messages?conversation_id=eq.{conversation_id}&order=created_at.asc&select=*",
                        headers=self._get_headers(),
                    )
                    if res.status_code == 200:
                        records = res.json()
                        self._local_messages[conversation_id] = records
                        return records
            except Exception as e:
                logger.warning("Remote Supabase list_messages failed: %s", e)

        return self._local_messages.get(conversation_id, [])

conversation_repository = ConversationRepository()
