import re
import logging
from typing import List, Dict, Any, Optional
from .supabase_client import db_service

logger = logging.getLogger(__name__)

class DocumentRetrievalService:
    """
    Retrieves authorized text chunks strictly within a student's permission boundaries.
    Guarantees no cross-tenant leakage before context is passed to Google Gemini.
    """

    async def retrieve_relevant_chunks(
        self,
        query: str,
        user_id: str,
        user_role: str,
        department_id: Optional[str] = None,
        requested_doc_ids: Optional[List[str]] = None,
        top_k: int = 4,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top relevant chunks from authorized documents only.
        """
        # 1. Fetch authorized documents for this user
        all_authorized_docs = await db_service.list_documents(
            user_id=user_id,
            user_role=user_role,
            department_id=department_id,
        )
        authorized_doc_map = {d["id"]: d for d in all_authorized_docs}

        # 2. Scope to requested doc IDs if provided (enforcing strict intersection)
        if requested_doc_ids:
            target_ids = [d_id for d_id in requested_doc_ids if d_id in authorized_doc_map]
        else:
            target_ids = list(authorized_doc_map.keys())

        if not target_ids:
            logger.info("No authorized documents available for user %s query", user_id)
            return []

        # 3. Fetch chunks for target documents
        chunks = await db_service.get_chunks_for_documents(target_ids)
        if not chunks:
            return []

        # 4. Score chunks based on query terms (relevance ranking)
        query_terms = set(re.findall(r"\w+", query.lower()))
        # Remove common stop words
        stop_words = {"the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "what", "how", "why"}
        query_terms = query_terms - stop_words

        if not query_terms:
            query_terms = set(re.findall(r"\w+", query.lower()))

        scored_chunks = []
        for c in chunks:
            content_lower = c["content"].lower()
            score = 0
            for term in query_terms:
                if term in content_lower:
                    score += content_lower.count(term)

            if score > 0:
                scored_chunks.append((score, c))

        # Sort by relevance score descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = [c for _, c in scored_chunks[:top_k]]

        # If no keyword matches found, return first few chunks as fallback context
        if not top_chunks and chunks:
            top_chunks = chunks[:min(top_k, 2)]

        return top_chunks

retrieval_service = DocumentRetrievalService()
