import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

class MongoVectorService:
    """
    MongoDB Atlas Vector Search Service.
    Connects to the collection specified by MONGODB_VECTOR_COLLECTION (default: study_chunks)
    and executes $vectorSearch aggregations with department and authorization filters.
    Includes in-memory fallback store for offline tests and initial setup validation.
    """

    def __init__(self):
        self.uri = settings.MONGODB_URI
        self.db_name = settings.MONGODB_DATABASE
        self.collection_name = settings.MONGODB_VECTOR_COLLECTION
        self.index_name = settings.MONGODB_VECTOR_INDEX
        self._client = None
        self._collection = None
        self._is_connected = False
        
        # In-memory storage fallback for local development / unit tests
        self._local_chunks: Dict[str, Dict[str, Any]] = {}
        
        self._initialize_connection()

    def _initialize_connection(self):
        """Initializes PyMongo MongoClient if URI is provided."""
        if not self.uri:
            logger.info("MongoDB URI not set. Operating in local memory vector simulation mode.")
            return

        try:
            from pymongo import MongoClient
            self._client = MongoClient(self.uri, serverSelectionTimeoutMS=3000)
            # Verify connectivity
            self._client.admin.command("ping")
            self._collection = self._client[self.db_name][self.collection_name]
            self._is_connected = True
            logger.info("Connected to MongoDB Atlas: database=%s, collection=%s", self.db_name, self.collection_name)
        except Exception as e:
            logger.warning("MongoDB connection could not be established: %s. Using in-memory fallback.", e)
            self._is_connected = False

    def health_check(self) -> Dict[str, Any]:
        """Returns health status of MongoDB Atlas Vector connection."""
        return {
            "configured": bool(self.uri),
            "connected": self._is_connected,
            "database": self.db_name,
            "collection": self.collection_name,
            "vector_index": self.index_name,
            "indexed_chunks_count": (
                self._collection.count_documents({}) if self._is_connected else len(self._local_chunks)
            ),
        }

    async def upsert_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Upserts chunk documents with embeddings into MongoDB Atlas.
        """
        if not chunks:
            return 0

        now = datetime.now(timezone.utc).isoformat()
        prepared_docs = []
        for c in chunks:
            chunk_id = c.get("chunk_id") or c.get("id") or f"{c.get('document_id')}_{c.get('chunk_index', 0)}"
            doc = {
                "_id": chunk_id,
                "chunk_id": chunk_id,
                "document_id": c["document_id"],
                "chunk_index": c.get("chunk_index", 0),
                "content": c["content"],
                "embedding": c["embedding"],
                "title": c.get("title") or c.get("document_title", "Document"),
                "page_number": c.get("page_number", 1),
                "department_id": c.get("department_id"),
                "visibility": c.get("visibility", "department"),
                "is_active": c.get("is_active", True),
                "embedding_model": c.get("embedding_model", settings.EMBEDDING_MODEL),
                "created_at": c.get("created_at", now),
            }
            prepared_docs.append(doc)
            self._local_chunks[chunk_id] = doc

        if self._is_connected and self._collection is not None:
            try:
                from pymongo import UpdateOne
                ops = [
                    UpdateOne({"_id": d["_id"]}, {"$set": d}, upsert=True)
                    for d in prepared_docs
                ]
                result = self._collection.bulk_write(ops)
                return (result.upserted_count or 0) + (result.modified_count or 0)
            except Exception as e:
                logger.error("MongoDB Atlas upsert_chunks failed: %s", e)

        return len(prepared_docs)

    async def search_similar_chunks(
        self,
        query_vector: List[float],
        user_id: str,
        department_id: Optional[str] = None,
        user_role: str = "student",
        requested_doc_ids: Optional[List[str]] = None,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search against MongoDB Atlas Vector Search index.
        Applies strict authorization filtering (department, visibility, active status).
        """
        # If MongoDB Atlas is connected and vector index is available
        if self._is_connected and self._collection is not None:
            try:
                # Build filter criteria
                filter_conditions = [{"is_active": True}]
                if requested_doc_ids:
                    filter_conditions.append({"document_id": {"$in": requested_doc_ids}})

                # Role-based visibility filter
                if user_role != "admin":
                    vis_clauses = [{"visibility": "campus"}]
                    if department_id:
                        vis_clauses.append({"visibility": "department", "department_id": department_id})
                    filter_conditions.append({"$or": vis_clauses})

                search_filter = {"$and": filter_conditions} if len(filter_conditions) > 1 else filter_conditions[0]

                pipeline = [
                    {
                        "$vectorSearch": {
                            "index": self.index_name,
                            "path": "embedding",
                            "queryVector": query_vector,
                            "numCandidates": max(top_k * 10, 50),
                            "limit": top_k,
                            "filter": search_filter,
                        }
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "chunk_id": 1,
                            "document_id": 1,
                            "title": 1,
                            "page_number": 1,
                            "content": 1,
                            "department_id": 1,
                            "visibility": 1,
                            "score": {"$meta": "vectorSearchScore"},
                        }
                    },
                ]

                cursor = self._collection.aggregate(pipeline)
                results = list(cursor)
                if results:
                    return [r for r in results if r.get("score", 0.0) >= min_score]
            except Exception as e:
                logger.warning("MongoDB Atlas $vectorSearch failed or not yet indexed: %s. Using local similarity.", e)

        # In-memory vector cosine similarity fallback
        return self._search_local_chunks(
            query_vector=query_vector,
            user_id=user_id,
            department_id=department_id,
            user_role=user_role,
            requested_doc_ids=requested_doc_ids,
            top_k=top_k,
            min_score=min_score,
        )

    def _search_local_chunks(
        self,
        query_vector: List[float],
        user_id: str,
        department_id: Optional[str] = None,
        user_role: str = "student",
        requested_doc_ids: Optional[List[str]] = None,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[Dict[str, Any]]:
        scored_chunks = []
        for c in self._local_chunks.values():
            if not c.get("is_active", True):
                continue

            # Requested doc filter
            if requested_doc_ids and c.get("document_id") not in requested_doc_ids:
                continue

            # Authorization filter
            vis = c.get("visibility", "department")
            if user_role != "admin":
                if vis == "private" and c.get("owner_id") != user_id:
                    continue
                if vis == "department" and c.get("department_id") and c.get("department_id") != department_id:
                    continue

            # Compute cosine similarity
            emb = c.get("embedding", [])
            score = self._cosine_similarity(query_vector, emb)
            if score >= min_score:
                scored_chunks.append({
                    "chunk_id": c.get("chunk_id", ""),
                    "document_id": c.get("document_id", ""),
                    "title": c.get("title", "Study Document"),
                    "page_number": c.get("page_number", 1),
                    "content": c.get("content", ""),
                    "score": round(score, 4),
                })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)

    async def delete_document_chunks(self, document_id: str) -> int:
        """Deletes all chunks associated with a deleted document."""
        # Clean local
        to_remove = [k for k, v in self._local_chunks.items() if v.get("document_id") == document_id]
        for k in to_remove:
            self._local_chunks.pop(k, None)

        if self._is_connected and self._collection is not None:
            try:
                res = self._collection.delete_many({"document_id": document_id})
                return res.deleted_count
            except Exception as e:
                logger.error("MongoDB Atlas delete_document_chunks failed: %s", e)

        return len(to_remove)

mongo_vector_service = MongoVectorService()
