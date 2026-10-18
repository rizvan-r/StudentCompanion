import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx
from ..core.config import settings

logger = logging.getLogger(__name__)

class DatabaseService:
    """
    Data service managing Supabase PostgreSQL operations with fallback
    to local state for seamless offline testing and local development.
    """

    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_PUBLISHABLE_KEY
        # In-memory document & chunk registry for immediate local testing & offline development
        self._local_docs: Dict[str, Dict[str, Any]] = {}
        self._local_chunks: Dict[str, List[Dict[str, Any]]] = {}
        self._local_requests: List[Dict[str, Any]] = []
        self._local_announcements: List[Dict[str, Any]] = []
        self._local_profiles: Dict[str, Dict[str, Any]] = {}
        self._seed_default_announcements()
        self._seed_default_profiles()

    def _seed_default_profiles(self):
        self._local_profiles = {
            "00000000-0000-0000-0000-000000000001": {
                "id": "00000000-0000-0000-0000-000000000001",
                "email": "alex.student@college.edu",
                "full_name": "Alex Rivera",
                "role": "student",
                "department": "CSE",
                "student_id_number": "CS-2023-042",
                "created_at": "2026-10-18T00:00:00Z",
            },
            "00000000-0000-0000-0000-000000000002": {
                "id": "00000000-0000-0000-0000-000000000002",
                "email": "sarah.faculty@college.edu",
                "full_name": "Dr. Sarah Jenkins",
                "role": "staff",
                "department": "CSE",
                "created_at": "2026-10-18T00:00:00Z",
            },
            "00000000-0000-0000-0000-000000000003": {
                "id": "00000000-0000-0000-0000-000000000003",
                "email": "admin.dean@college.edu",
                "full_name": "Prof. Marcus Vance",
                "role": "admin",
                "department": "ADMIN",
                "created_at": "2026-10-18T00:00:00Z",
            },
        }

    def _seed_default_announcements(self):
        self._local_announcements = [
            {
                "id": "ann-1",
                "title": "Central Library 24/7 Hours During Mid-Terms",
                "content": "The central library reading rooms and computing kiosks on 2nd & 3rd floors will remain open 24/7 starting Oct 20.",
                "category": "facilities",
                "department": "Dean of Academic Affairs",
                "is_pinned": True,
                "created_at": "2026-10-18T09:00:00Z",
            },
            {
                "id": "ann-2",
                "title": "Annual Campus Project Expo & Hackathon Registration",
                "content": "Student project abstracts for hardware and software prototypes are due Oct 30. Cash awards and industry mentorship provided.",
                "category": "academic",
                "department": "Computer Science & Engineering",
                "is_pinned": False,
                "created_at": "2026-10-17T14:30:00Z",
            },
        ]

    async def insert_document(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Inserts a new study document record."""
        doc_id = doc_data["id"]
        now = datetime.now(timezone.utc).isoformat()
        record = {
            **doc_data,
            "created_at": now,
            "updated_at": now,
            "processing_status": doc_data.get("processing_status", "pending"),
            "page_count": 0,
            "chunk_count": 0,
            "error_message": None,
        }

        # Try remote Supabase if credentials are provided
        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.post(
                        f"{self.url}/rest/v1/study_documents",
                        headers={
                            "apikey": self.key,
                            "Authorization": f"Bearer {self.key}",
                            "Content-Type": "application/json",
                            "Prefer": "return=representation",
                        },
                        json=record,
                    )
                    if res.status_code in (200, 201):
                        remote_record = res.json()[0]
                        self._local_docs[doc_id] = remote_record
                        return remote_record
            except Exception as e:
                logger.warning("Remote Supabase insert failed: %s. Using local store.", e)

        self._local_docs[doc_id] = record
        return record

    async def update_document_status(
        self,
        doc_id: str,
        status: str,
        page_count: int = 0,
        chunk_count: int = 0,
        error_message: Optional[str] = None,
    ):
        """Updates document processing status, page count, and chunk counts."""
        now = datetime.now(timezone.utc).isoformat()
        if doc_id in self._local_docs:
            self._local_docs[doc_id]["processing_status"] = status
            self._local_docs[doc_id]["status"] = status
            self._local_docs[doc_id]["page_count"] = page_count
            self._local_docs[doc_id]["chunk_count"] = chunk_count
            self._local_docs[doc_id]["error_message"] = error_message
            self._local_docs[doc_id]["updated_at"] = now

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    await client.patch(
                        f"{self.url}/rest/v1/study_documents?id=eq.{doc_id}",
                        headers={
                            "apikey": self.key,
                            "Authorization": f"Bearer {self.key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "processing_status": status,
                            "page_count": page_count,
                            "chunk_count": chunk_count,
                            "error_message": error_message,
                            "updated_at": now,
                        },
                    )
            except Exception as e:
                logger.warning("Remote Supabase status update failed: %s", e)

    async def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single study document by ID."""
        if doc_id in self._local_docs:
            return self._local_docs[doc_id]

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(
                        f"{self.url}/rest/v1/study_documents?id=eq.{doc_id}&select=*",
                        headers={
                            "apikey": self.key,
                            "Authorization": f"Bearer {self.key}",
                        },
                    )
                    if res.status_code == 200:
                        records = res.json()
                        if records:
                            self._local_docs[doc_id] = records[0]
                            return records[0]
            except Exception as e:
                logger.warning("Remote Supabase get_document failed: %s", e)

        return None

    async def list_documents(
        self, user_id: str, user_role: str, department_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lists documents visible to the user under RLS rules."""
        # Check local registry first
        visible = []
        for doc in self._local_docs.values():
            if user_role == "admin":
                visible.append(doc)
            elif doc["owner_id"] == user_id:
                visible.append(doc)
            elif doc["visibility"] == "campus":
                visible.append(doc)
            elif doc["visibility"] == "department" and doc.get("department_id") == department_id:
                visible.append(doc)

        return sorted(visible, key=lambda x: x.get("created_at", ""), reverse=True)

    async def delete_document(self, doc_id: str) -> bool:
        """Deletes document and cascades deletion to chunks."""
        self._local_docs.pop(doc_id, None)
        self._local_chunks.pop(doc_id, None)

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    await client.delete(
                        f"{self.url}/rest/v1/study_documents?id=eq.{doc_id}",
                        headers={
                            "apikey": self.key,
                            "Authorization": f"Bearer {self.key}",
                        },
                    )
            except Exception as e:
                logger.warning("Remote Supabase delete failed: %s", e)

        return True

    async def insert_chunks(self, doc_id: str, chunks: List[Dict[str, Any]]):
        """Stores extracted text chunks."""
        self._local_chunks[doc_id] = chunks

        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=6.0) as client:
                    await client.post(
                        f"{self.url}/rest/v1/document_chunks",
                        headers={
                            "apikey": self.key,
                            "Authorization": f"Bearer {self.key}",
                            "Content-Type": "application/json",
                        },
                        json=chunks,
                    )
            except Exception as e:
                logger.warning("Remote Supabase insert_chunks failed: %s", e)

    async def get_chunks_for_documents(self, doc_ids: List[str]) -> List[Dict[str, Any]]:
        """Retrieves chunks across a list of authorized documents."""
        results = []
        for d_id in doc_ids:
            if d_id in self._local_chunks:
                doc = self._local_docs.get(d_id, {})
                title = doc.get("title", "Study Document")
                for c in self._local_chunks[d_id]:
                    results.append({
                        **c,
                        "document_title": title,
                    })
        return results

    def _clean_uuid(self, val: Any) -> Optional[str]:
        if not val:
            return None
        val_str = str(val).strip()
        if val_str.startswith("00000000") or val_str.startswith("11111111") or val_str.startswith("dept-"):
            return None
        try:
            uuid.UUID(val_str)
            return val_str
        except (ValueError, TypeError):
            return None

    async def ensure_profile(
        self,
        user_id: str,
        email: str,
        full_name: Optional[str] = None,
        role: str = "student",
        department_id: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Guarantees that a user record exists in public.profiles.
        Critical for newly signed in Google OAuth students and foreign key integrity.
        """
        now = datetime.now(timezone.utc).isoformat()
        name = full_name or (email.split("@")[0] if email else "College Student")
        clean_dept = self._clean_uuid(department_id)

        profile_data = {
            "id": user_id,
            "email": email,
            "full_name": name,
            "role": role if role in ("student", "staff", "admin") else "student",
            "department_id": clean_dept,
            "updated_at": now,
        }

        # Cache locally
        self._local_profiles[user_id] = {
            **self._local_profiles.get(user_id, {}),
            **profile_data,
        }

        if self.url and (auth_token or self.key):
            try:
                token = auth_token or self.key
                headers = {
                    "apikey": settings.SUPABASE_PUBLISHABLE_KEY or self.key,
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates,return=representation",
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.post(
                        f"{self.url}/rest/v1/profiles",
                        headers=headers,
                        json=profile_data,
                    )
                    if res.status_code in (200, 201):
                        records = res.json()
                        if records:
                            self._local_profiles[user_id] = records[0]
                            return records[0]
                    else:
                        logger.debug("Supabase ensure_profile status %s: %s", res.status_code, res.text)
            except Exception as e:
                logger.warning("Remote Supabase ensure_profile failed: %s", e)

        return self._local_profiles[user_id]

    async def list_announcements(self) -> List[Dict[str, Any]]:
        if self.url and self.key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(
                        f"{self.url}/rest/v1/announcements?select=*&order=is_pinned.desc,created_at.desc",
                        headers={
                            "apikey": self.key,
                            "Authorization": f"Bearer {self.key}",
                        },
                    )
                    if res.status_code == 200:
                        records = res.json()
                        if records:
                            return records
            except Exception as e:
                logger.warning("Remote Supabase list_announcements failed: %s", e)
        return self._local_announcements

    async def list_requests(
        self,
        user_id: str,
        user_role: str,
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetches student requests from Supabase PostgreSQL with fallback to local store.
        """
        remote_records = []
        if self.url and (auth_token or self.key):
            try:
                query = "select=*"
                if user_role not in ("admin", "staff") and user_id:
                    query += f"&student_id=eq.{user_id}"
                query += "&order=created_at.desc"

                token = auth_token or self.key
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(
                        f"{self.url}/rest/v1/student_requests?{query}",
                        headers={
                            "apikey": settings.SUPABASE_PUBLISHABLE_KEY or self.key,
                            "Authorization": f"Bearer {token}",
                        },
                    )
                    if res.status_code == 200:
                        records = res.json()
                        for r in records:
                            # Map ticket number and readable category
                            r["reference_number"] = r.get("ticket_number") or f"REQ-{r['id'][:8]}"
                            if not r.get("category"):
                                r["category"] = "Campus Complaint" if r.get("request_type") == "grievance" else r.get("request_type", "General").title()
                            if not r.get("department_name"):
                                r["department_name"] = "Computer Science & Engineering"
                        remote_records = records
            except Exception as e:
                logger.warning("Remote Supabase list_requests failed: %s", e)

        # Merge local requests
        local_matched = self._local_requests if user_role in ("admin", "staff") else [
            r for r in self._local_requests if r.get("student_id") == user_id
        ]
        
        seen_ids = {r["id"] for r in remote_records}
        for r in local_matched:
            if r["id"] not in seen_ids:
                remote_records.append(r)

        return remote_records if remote_records else local_matched

    async def create_request(
        self,
        req_data: Dict[str, Any],
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Persists student complaints, grievances, leaves, and requests directly to Supabase.
        """
        req_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        ticket_number = req_data.get("ticket_number") or f"REQ-{now[:4]}-{abs(hash(req_id)) % 100000:05d}"

        # Map to valid PostgreSQL request_type enum: 'grievance', 'leave', 'certificate', 'facility', 'other'
        raw_type = str(req_data.get("request_type", "other")).lower().strip()
        type_mapping = {
            "complaint": "grievance",
            "service": "facility",
            "grievance": "grievance",
            "leave": "leave",
            "certificate": "certificate",
            "facility": "facility",
            "other": "other",
        }
        normalized_type = type_mapping.get(raw_type, "other")
        clean_dept_id = self._clean_uuid(req_data.get("department_id"))

        # Clean payload for Supabase student_requests table
        db_record = {
            "id": req_id,
            "ticket_number": ticket_number,
            "student_id": req_data["student_id"],
            "department_id": clean_dept_id,
            "request_type": normalized_type,
            "title": req_data["title"],
            "description": req_data["description"],
            "status": req_data.get("status", "pending"),
            "priority": req_data.get("priority", "normal"),
            "created_at": now,
            "updated_at": now,
        }

        # Keep client display fields
        display_record = {
            **db_record,
            "reference_number": ticket_number,
            "department_name": req_data.get("department_name", "Computer Science & Engineering"),
            "category": req_data.get("category", "Campus Complaint" if normalized_type == "grievance" else normalized_type.title()),
            "metadata": req_data.get("metadata", {}),
        }

        self._local_requests.insert(0, display_record)

        if self.url and (auth_token or self.key):
            try:
                token = auth_token or self.key
                headers = {
                    "apikey": settings.SUPABASE_PUBLISHABLE_KEY or self.key,
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.post(
                        f"{self.url}/rest/v1/student_requests",
                        headers=headers,
                        json=db_record,
                    )
                    if res.status_code in (200, 201):
                        created = res.json()[0]
                        display_record.update(created)
                        display_record["reference_number"] = created.get("ticket_number") or ticket_number
                        return display_record
                    else:
                        logger.warning("Supabase student_requests insert returned HTTP %s: %s", res.status_code, res.text)
            except Exception as e:
                logger.warning("Remote Supabase create_request failed: %s. Stored locally.", e)

        return display_record

    async def list_users(
        self,
        role_filter: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Returns all registered college users from Supabase profiles table,
        merged with locally registered session profiles.
        """
        users = []
        if self.url and (auth_token or self.key):
            try:
                q = "select=*,departments(name,code)&order=created_at.desc"
                if role_filter and role_filter != "all":
                    q += f"&role=eq.{role_filter}"
                token = auth_token or self.key
                headers = {
                    "apikey": settings.SUPABASE_PUBLISHABLE_KEY or self.key,
                    "Authorization": f"Bearer {token}",
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(
                        f"{self.url}/rest/v1/profiles?{q}",
                        headers=headers,
                    )
                    if res.status_code == 200:
                        records = res.json()
                        for r in records:
                            dept = r.get("departments") or {}
                            users.append({
                                "id": r["id"],
                                "full_name": r.get("full_name") or r.get("email", "").split("@")[0],
                                "email": r.get("email"),
                                "role": r.get("role", "student"),
                                "department": dept.get("code") or dept.get("name") or "CSE",
                                "active": True,
                                "created_at": r.get("created_at"),
                            })
            except Exception as e:
                logger.warning("Remote Supabase list_users failed: %s", e)

        # Merge with local profiles (guaranteeing Google sign-in users are displayed)
        seen_ids = {u["id"] for u in users}
        for u_id, p in self._local_profiles.items():
            if u_id not in seen_ids:
                if not role_filter or role_filter == "all" or p.get("role") == role_filter:
                    users.append({
                        "id": p["id"],
                        "full_name": p.get("full_name") or p.get("email", "").split("@")[0],
                        "email": p.get("email"),
                        "role": p.get("role", "student"),
                        "department": p.get("department", "CSE"),
                        "active": True,
                        "created_at": p.get("created_at"),
                    })

        return users

    async def update_user_role(self, user_id: str, new_role: str) -> Dict[str, Any]:
        """
        Updates role for a specific user in Supabase public.profiles.
        """
        if user_id in self._local_profiles:
            self._local_profiles[user_id]["role"] = new_role

        if self.url and self.key:
            try:
                headers = {
                    "apikey": self.key,
                    "Authorization": f"Bearer {self.key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.patch(
                        f"{self.url}/rest/v1/profiles?id=eq.{user_id}",
                        headers=headers,
                        json={"role": new_role},
                    )
                    if res.status_code == 200:
                        return res.json()[0]
            except Exception as e:
                logger.warning("Remote Supabase update_user_role failed: %s", e)

        return {"id": user_id, "role": new_role}

    async def get_admin_stats(self) -> Dict[str, Any]:
        """
        Calculates live administrative summary metrics.
        """
        users = await self.list_users()
        requests = await self.list_requests(user_id="", user_role="admin")
        
        return {
            "totalStudents": len([u for u in users if u.get("role") == "student"]),
            "totalStaff": len([u for u in users if u.get("role") == "staff"]),
            "totalDepartments": 5,
            "totalOpenRequests": len([r for r in requests if r.get("status") in ("pending", "in_review")]),
            "requestsByStatus": {
                "pending": len([r for r in requests if r.get("status") == "pending"]),
                "in_review": len([r for r in requests if r.get("status") == "in_review"]),
                "needs_info": len([r for r in requests if r.get("status") == "needs_info"]),
                "resolved": len([r for r in requests if r.get("status") in ("resolved", "approved")]),
            },
        }

db_service = DatabaseService()
