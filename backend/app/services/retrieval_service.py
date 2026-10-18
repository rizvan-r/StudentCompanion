import logging
from typing import Dict, Any, List, Optional
from .gemini_embedding_service import embedding_service
from .mongo_vector_service import mongo_vector_service
from .supabase_client import db_service

logger = logging.getLogger(__name__)

class RetrievalService:
    """
    Primary semantic retrieval service.
    Orchestrates query embedding via Gemini, vector search via MongoDB Atlas,
    and post-search authorization verification against Supabase document metadata.
    """

    async def search_authorized_passages(
        self,
        query: str,
        user_id: str,
        department_id: Optional[str] = None,
        user_role: str = "student",
        requested_doc_ids: Optional[List[str]] = None,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[Dict[str, Any]]:
        if not query.strip():
            return []

        # 1. Generate query embedding
        query_vector = await embedding_service.generate_embedding(query)

        # 2. Search similar chunks in MongoDB Atlas Vector Search
        raw_chunks = await mongo_vector_service.search_similar_chunks(
            query_vector=query_vector,
            user_id=user_id,
            department_id=department_id,
            user_role=user_role,
            requested_doc_ids=requested_doc_ids,
            top_k=top_k * 2,  # Fetch slightly more to account for auth filtering
            min_score=min_score,
        )

        if not raw_chunks:
            return []

        # 3. Post-search verification against Supabase document metadata
        verified_passages = []
        seen_keys = set()

        for chunk in raw_chunks:
            doc_id = chunk["document_id"]
            doc_meta = await db_service.get_document(doc_id)

            if doc_meta:
                # Exclude deleted or failed documents
                status = doc_meta.get("processing_status", "pending")
                if status not in ("ready", "completed", "pending"):
                    continue

                # Enforce department and visibility rules
                if user_role != "admin":
                    vis = doc_meta.get("visibility", "department")
                    if vis == "private" and doc_meta.get("owner_id") != user_id:
                        continue
                    if vis == "department" and department_id and doc_meta.get("department_id") != department_id:
                        continue

            # Deduplicate by document + page + first 60 chars
            dedup_key = f"{doc_id}:{chunk.get('page_number', 1)}:{chunk.get('content', '')[:60]}"
            if dedup_key in seen_keys:
                continue
            seen_keys.add(dedup_key)

            verified_passages.append({
                "chunk_id": chunk.get("chunk_id", ""),
                "document_id": doc_id,
                "title": chunk.get("title", "Study Document"),
                "page_number": chunk.get("page_number", 1),
                "content": chunk.get("content", ""),
                "score": chunk.get("score", 0.0),
            })

            if len(verified_passages) >= top_k:
                break

        return verified_passages

retrieval_service = RetrievalService()
