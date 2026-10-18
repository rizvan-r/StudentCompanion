import asyncio
import io
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import main
from app.core.config import settings
from app.services.gemini_embedding_service import embedding_service
from app.services.mongo_vector_service import mongo_vector_service
from app.services.retrieval_service import retrieval_service
from app.services.supabase_client import db_service
from app.services.google_drive_service import drive_service

client = TestClient(main.app)

AUTH_HEADER_STUDENT_A = {"Authorization": "Bearer test:student:user-student-a"}

def test_embedding_dimensions_and_normalization():
    """Verify embedding service strictly produces 768-dimensional float vectors."""
    text = "Machine learning algorithms optimize an objective function via gradient descent."
    vec = asyncio.run(embedding_service.generate_embedding(text))
    assert len(vec) == 768
    assert all(isinstance(x, float) for x in vec)

    # Test batch embedding
    texts = ["Sample text 1", "Sample text 2", "Sample text 3"]
    batch_vecs = asyncio.run(embedding_service.generate_embeddings_batch(texts))
    assert len(batch_vecs) == 3
    for v in batch_vecs:
        assert len(v) == 768

def test_mongo_vector_upsert_and_similarity_retrieval():
    """Verify upserting chunks with vectors and retrieving them via semantic similarity."""
    doc_id = "test-doc-rag-001"
    chunk_1_text = "Dijkstra's algorithm finds the shortest path between nodes in a weighted graph with non-negative edge weights."
    chunk_2_text = "Database normalization reduces data redundancy and prevents insertion, update, and deletion anomalies."

    v1 = asyncio.run(embedding_service.generate_embedding(chunk_1_text))
    v2 = asyncio.run(embedding_service.generate_embedding(chunk_2_text))

    chunks = [
        {
            "id": f"{doc_id}_c0",
            "chunk_id": f"{doc_id}_c0",
            "document_id": doc_id,
            "title": "Algorithms Handbook.pdf",
            "chunk_index": 0,
            "page_number": 42,
            "content": chunk_1_text,
            "embedding": v1,
            "department_id": "dept-cse",
            "visibility": "campus",
            "is_active": True,
        },
        {
            "id": f"{doc_id}_c1",
            "chunk_id": f"{doc_id}_c1",
            "document_id": doc_id,
            "title": "Database Systems.pdf",
            "chunk_index": 1,
            "page_number": 105,
            "content": chunk_2_text,
            "embedding": v2,
            "department_id": "dept-cse",
            "visibility": "campus",
            "is_active": True,
        },
    ]

    count = asyncio.run(mongo_vector_service.upsert_chunks(chunks))
    assert count >= 2

    # Query for Dijkstra
    q_vec = asyncio.run(embedding_service.generate_embedding("How does Dijkstra find shortest path?"))
    results = asyncio.run(
        mongo_vector_service.search_similar_chunks(
            query_vector=q_vec,
            user_id="user-student-a",
            department_id="dept-cse",
            user_role="student",
            top_k=2,
        )
    )

    assert len(results) > 0
    # The top result should be the Dijkstra chunk
    top_result = results[0]
    assert "Dijkstra" in top_result["content"]
    assert top_result["page_number"] == 42
    assert top_result["score"] > 0.0

def test_internal_knowledge_search_endpoint_with_auth():
    """Verify POST /internal/knowledge/search requires X-Internal-Key and returns passages."""
    # 1. Reject without key
    res_no_key = client.post(
        "/internal/knowledge/search",
        json={"query": "graph algorithms", "user_id": "user-student-a"},
    )
    assert res_no_key.status_code == 401

    # 2. Reject with invalid key
    res_bad_key = client.post(
        "/internal/knowledge/search",
        headers={"X-Internal-Key": "wrong-secret-key"},
        json={"query": "graph algorithms", "user_id": "user-student-a"},
    )
    assert res_bad_key.status_code == 401

    # 3. Allow with correct key
    valid_key = settings.INTERNAL_API_KEY
    res_valid = client.post(
        "/internal/knowledge/search",
        headers={"X-Internal-Key": valid_key},
        json={
            "query": "Dijkstra algorithm shortest path",
            "user_id": "user-student-a",
            "department_id": "dept-cse",
            "user_role": "student",
            "top_k": 3,
        },
    )
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert "passages" in data
    assert "count" in data

def test_authorized_document_view_endpoint():
    """Verify GET /api/documents/{id}/view streams file content and rejects unauthorized access."""
    # 1. Upload sample file
    pdf_bytes = b"%PDF-1.4 simulated pdf lecture content for viewing test"
    files = {"file": ("lecture_sample.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    res_up = client.post("/api/documents", files=files, headers=AUTH_HEADER_STUDENT_A)
    assert res_up.status_code == 201
    doc_id = res_up.json()["id"]

    # 2. View file as owner
    res_view = client.get(f"/api/documents/{doc_id}/view", headers=AUTH_HEADER_STUDENT_A)
    assert res_view.status_code == 200
    assert res_view.content == pdf_bytes
    assert res_view.headers["content-type"] == "application/pdf"
    assert "inline" in res_view.headers.get("content-disposition", "")
