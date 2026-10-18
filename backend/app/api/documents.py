import hashlib
import uuid
import logging
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    BackgroundTasks,
    Response,
    status,
)
from ..core.config import settings
from ..core.security import get_current_user, UserContext
from ..schemas.documents import (
    DocumentCreateResponse,
    DocumentItem,
    DocumentStatusResponse,
    DocumentVisibility,
    ProcessingStatus,
)
from ..services.google_drive_service import drive_service
from ..services.document_ingestion_service import document_ingestion_service as document_processor
from ..services.mongo_vector_service import mongo_vector_service
from ..services.supabase_client import db_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Study Documents"])

@router.post("", response_model=DocumentCreateResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=DocumentCreateResponse, status_code=status.HTTP_201_CREATED)
@router.post("/upload", response_model=DocumentCreateResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    visibility: DocumentVisibility = Form(DocumentVisibility.PRIVATE),
    current_user: UserContext = Depends(get_current_user),
):
    """
    Uploads a study document (PDF/TXT) to the college Google Drive.
    Enforces file size limits, content magic-byte sniffing, and records metadata in Supabase.
    Kicks off background text parsing and chunking.
    """
    # 1. Validate file extension
    file_name = file.filename or "untitled_document.pdf"
    ext = "." + file_name.split(".")[-1].lower() if "." in file_name else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only PDF and TXT files are allowed.",
        )

    # 2. Read file content into memory & check size
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB.",
        )

    # 3. Magic-Byte content sniffing
    mime_type = file.content_type or "application/octet-stream"
    if ext == ".pdf":
        if not file_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content signature does not match a valid PDF document.",
            )
        mime_type = "application/pdf"
    elif ext == ".txt":
        try:
            file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text file contains invalid binary encoding. Must be valid UTF-8.",
            )
        mime_type = "text/plain"

    # 4. Compute cryptographic hash
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    # 5. Upload to Centralized College Google Drive
    try:
        drive_res = drive_service.upload_file(
            file_bytes=file_bytes,
            original_filename=file_name,
            mime_type=mime_type,
        )
    except Exception as e:
        logger.error("Failed to upload file to Google Drive: %s", e)
        detail_msg = str(e) if isinstance(e, RuntimeError) else "Storage service error: Unable to store file in college Google Drive."
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail_msg,
        )

    drive_file_id = drive_res["drive_file_id"]
    doc_id = str(uuid.uuid4())
    doc_title = title.strip() if title and title.strip() else file_name

    effective_desc = description.strip() if description and description.strip() else (f"Subject: {subject.strip()}" if subject and subject.strip() else None)
    # 6. Persist metadata in Supabase
    doc_record = {
        "id": doc_id,
        "title": doc_title,
        "description": effective_desc,
        "file_name": file_name,
        "file_size_bytes": file_size,
        "mime_type": mime_type,
        "drive_file_id": drive_file_id,
        "drive_folder_id": settings.GOOGLE_DRIVE_ROOT_FOLDER_ID or "root",
        "drive_web_view_link": drive_res.get("web_view_link", ""),
        "owner_id": current_user.id,
        "department_id": current_user.department_id,
        "visibility": visibility.value,
        "processing_status": "pending",
        "file_checksum_sha256": sha256_hash,
    }

    try:
        saved_record = await db_service.insert_document(doc_record)
    except Exception as e:
        # Compensation: Delete from Drive if DB record creation failed
        logger.critical("Database insertion failed for %s. Compensating Drive deletion.", doc_id)
        drive_service.delete_file(drive_file_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while registering uploaded document.",
        )

    # 7. Dispatch background ingestion & chunking job
    background_tasks.add_task(
        document_processor.process_document,
        document_id=doc_id,
        drive_file_id=drive_file_id,
        mime_type=mime_type,
        file_name=file_name,
    )

    return DocumentCreateResponse(
        id=doc_id,
        title=doc_title,
        file_name=file_name,
        original_filename=file_name,
        file_size_bytes=file_size,
        mime_type=mime_type,
        visibility=visibility,
        processing_status=ProcessingStatus.PENDING,
        status=ProcessingStatus.PENDING.value,
        drive_file_id=drive_file_id,
        created_at=saved_record["created_at"],
    )

@router.get("", response_model=List[DocumentItem])
@router.get("/", response_model=List[DocumentItem])
async def list_documents(
    current_user: UserContext = Depends(get_current_user),
):
    """Lists study documents accessible to the authenticated user."""
    docs = await db_service.list_documents(
        user_id=current_user.id,
        user_role=current_user.role,
        department_id=current_user.department_id,
    )
    for d in docs:
        if not d.get("original_filename"):
            d["original_filename"] = d.get("file_name", "")
        if not d.get("subject"):
            desc = d.get("description") or ""
            d["subject"] = desc.replace("Subject: ", "") if desc.startswith("Subject: ") else (desc or "General")
        d["status"] = d.get("processing_status", "pending")
    return docs

@router.get("/{document_id}", response_model=DocumentItem)
async def get_document(
    document_id: str,
    current_user: UserContext = Depends(get_current_user),
):
    """Retrieves document details with authorization check."""
    doc = await db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Authorization verification
    is_owner = doc["owner_id"] == current_user.id
    is_admin = current_user.role == "admin"
    is_campus = doc.get("visibility") == "campus"
    is_dept = doc.get("visibility") == "department" and doc.get("department_id") == current_user.department_id

    if not (is_owner or is_admin or is_campus or is_dept):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this document")

    if not doc.get("original_filename"):
        doc["original_filename"] = doc.get("file_name", "")
    if not doc.get("subject"):
        desc = doc.get("description") or ""
        doc["subject"] = desc.replace("Subject: ", "") if desc.startswith("Subject: ") else (desc or "General")
    doc["status"] = doc.get("processing_status", "pending")

    return doc

@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: str,
    current_user: UserContext = Depends(get_current_user),
):
    """Polls document processing status."""
    doc = await db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    proc_status = doc.get("processing_status", ProcessingStatus.PENDING)
    return DocumentStatusResponse(
        id=doc["id"],
        processing_status=proc_status,
        status=proc_status if isinstance(proc_status, str) else proc_status.value,
        error_message=doc.get("error_message"),
        page_count=doc.get("page_count", 0),
        chunk_count=doc.get("chunk_count", 0),
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: UserContext = Depends(get_current_user),
):
    """Deletes document from Google Drive and removes database records."""
    doc = await db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc["owner_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner or admin can delete this document")

    # 1. Delete from Google Drive
    drive_file_id = doc["drive_file_id"]
    drive_service.delete_file(drive_file_id)

    # 2. Delete from Database
    await db_service.delete_document(document_id)

    # 3. Delete chunks from MongoDB Atlas Vector Search
    await mongo_vector_service.delete_document_chunks(document_id)

    return {"success": True, "message": "Document deleted successfully"}

@router.get("/{document_id}/view")
async def view_document_content(
    document_id: str,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Authorized document view endpoint.
    Re-verifies access permissions and streams the file content securely from Google Drive.
    Never exposes raw, unrestricted Google Drive download links.
    """
    doc = await db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    is_owner = doc["owner_id"] == current_user.id
    is_admin = current_user.role == "admin"
    is_campus = doc.get("visibility") == "campus"
    is_dept = doc.get("visibility") == "department" and doc.get("department_id") == current_user.department_id

    if not (is_owner or is_admin or is_campus or is_dept):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to view this document")

    file_bytes = drive_service.download_file(doc["drive_file_id"])
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file binary could not be retrieved")

    mime = doc.get("mime_type", "application/pdf")
    filename = doc.get("file_name", "document.pdf")

    return Response(
        content=file_bytes,
        media_type=mime,
        headers={
            "Content-Disposition": f"inline; filename=\"{filename}\"",
            "Cache-Control": "private, max-age=300",
        },
    )

@router.post("/{document_id}/retry")
@router.post("/{document_id}/retry-processing")
async def retry_document_processing(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserContext = Depends(get_current_user),
):
    """Re-queues text extraction and chunking for a failed document."""
    doc = await db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc["owner_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    background_tasks.add_task(
        document_processor.retry_processing,
        document_id=document_id,
    )

    return {"success": True, "message": "Document processing re-queued"}
