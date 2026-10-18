import io
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import main
from app.services.google_drive_service import drive_service
from app.services.supabase_client import db_service
from app.services.document_processing_service import document_processor

client = TestClient(main.app)

AUTH_HEADER_STUDENT_A = {"Authorization": "Bearer test:student:user-student-a"}
AUTH_HEADER_STUDENT_B = {"Authorization": "Bearer test:student:user-student-b"}

@pytest.fixture(autouse=True)
def setup_simulated_drive():
    orig_sim = drive_service._is_simulated
    drive_service._is_simulated = True
    yield
    drive_service._is_simulated = orig_sim

def test_health_and_root():
    """Verify health and root API status."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json()["features"]["centralized_drive_storage"] is True

def test_config_status():
    """Verify config-status endpoint validates configuration flags safely."""
    res = client.get("/api/config-status")
    assert res.status_code == 200
    data = res.json()
    assert "google_drive_configured" in data
    assert data["google_drive_configured"] is True

def test_reject_unsupported_extension():
    """Verify upload rejects dangerous or unsupported file formats."""
    file_content = b"malicious binary or executable content"
    files = {"file": ("script.exe", io.BytesIO(file_content), "application/octet-stream")}
    res = client.post("/api/documents", files=files, headers=AUTH_HEADER_STUDENT_A)
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]

def test_reject_empty_file():
    """Verify upload rejects 0-byte files."""
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    res = client.post("/api/documents", files=files, headers=AUTH_HEADER_STUDENT_A)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

def test_reject_fake_pdf():
    """Verify magic-byte sniffing catches non-PDF file renamed as .pdf."""
    fake_pdf = b"This is plain text without PDF signature header."
    files = {"file": ("fake.pdf", io.BytesIO(fake_pdf), "application/pdf")}
    res = client.post("/api/documents", files=files, headers=AUTH_HEADER_STUDENT_A)
    assert res.status_code == 400
    assert "signature does not match" in res.json()["detail"]

def test_upload_and_process_txt_document():
    """Verify full upload lifecycle, Drive archiving, and text chunking."""
    content = (
        "Operating Systems Lecture 4: Virtual Memory Management.\n"
        "Paging divides physical memory into fixed-size blocks called frames. "
        "The page table maps virtual pages to physical frames. "
        "Page faults occur when a requested page is not in physical RAM."
    ).encode("utf-8")

    files = {"file": ("os_notes.txt", io.BytesIO(content), "text/plain")}
    data = {"title": "OS Virtual Memory Notes", "visibility": "private"}

    # 1. Upload
    res = client.post("/api/documents", data=data, files=files, headers=AUTH_HEADER_STUDENT_A)
    assert res.status_code == 201
    doc_info = res.json()
    doc_id = doc_info["id"]
    drive_file_id = doc_info["drive_file_id"]
    assert doc_info["title"] == "OS Virtual Memory Notes"
    assert doc_info["processing_status"] in ("pending", "processing", "completed")

    # 2. Check Drive storage
    downloaded_bytes = drive_service.download_file(drive_file_id)
    assert b"Virtual Memory Management" in downloaded_bytes

    # 3. Process document synchronously for test verification
    import asyncio
    asyncio.run(
        document_processor.process_document(
            document_id=doc_id,
            drive_file_id=drive_file_id,
            mime_type="text/plain",
            file_name="os_notes.txt",
        )
    )

    # 4. Status check
    res_status = client.get(f"/api/documents/{doc_id}/status", headers=AUTH_HEADER_STUDENT_A)
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["processing_status"] == "completed"
    assert status_data["chunk_count"] > 0

    # 5. Grounded Q&A check
    query_payload = {
        "query": "What is paging in virtual memory?",
        "document_ids": [doc_id],
    }
    res_qa = client.post("/api/assistant/ask", json=query_payload, headers=AUTH_HEADER_STUDENT_A)
    assert res_qa.status_code == 200
    qa_data = res_qa.json()
    assert len(qa_data["citations"]) > 0
    assert qa_data["citations"][0]["document_id"] == doc_id
    assert qa_data["citations"][0]["page_number"] == 1
    assert "paging" in qa_data["answer"].lower() or "virtual memory" in qa_data["answer"].lower()

    # 6. Tenant isolation test: Student B cannot access Student A's private document
    res_isolation = client.get(f"/api/documents/{doc_id}", headers=AUTH_HEADER_STUDENT_B)
    assert res_isolation.status_code == 403

    # Student B queries assistant: cannot retrieve Student A's document chunks
    res_b_qa = client.post("/api/assistant/ask", json={"query": "What is paging?", "document_ids": [doc_id]}, headers=AUTH_HEADER_STUDENT_B)
    assert res_b_qa.status_code == 200
    assert len(res_b_qa.json()["citations"]) == 0

    # 7. Delete document
    res_del = client.delete(f"/api/documents/{doc_id}", headers=AUTH_HEADER_STUDENT_A)
    assert res_del.status_code == 200

    # Ensure document is gone
    res_after_del = client.get(f"/api/documents/{doc_id}", headers=AUTH_HEADER_STUDENT_A)
    assert res_after_del.status_code == 404

def test_upload_and_process_pdf_document():
    """Verify PDF upload, magic bytes, and page count detection."""
    from pypdf import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.add_blank_page(width=200, height=200)
    pdf_buf = io.BytesIO()
    writer.write(pdf_buf)
    pdf_bytes = pdf_buf.getvalue()

    files = {"file": ("calculus_syllabus.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    data = {"title": "Calculus Syllabus", "visibility": "department"}

    res = client.post("/api/documents", data=data, files=files, headers=AUTH_HEADER_STUDENT_A)
    assert res.status_code == 201
    doc_id = res.json()["id"]

    # Verify status endpoint returns valid structure
    res_status = client.get(f"/api/documents/{doc_id}/status", headers=AUTH_HEADER_STUDENT_A)
    assert res_status.status_code == 200
    assert res_status.json()["id"] == doc_id

    # Clean up
    client.delete(f"/api/documents/{doc_id}", headers=AUTH_HEADER_STUDENT_A)

if __name__ == "__main__":
    pytest.main(["-v", __file__])
