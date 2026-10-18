import io
import uuid
import logging
from typing import List, Dict, Any
from .google_drive_service import drive_service
from .supabase_client import db_service
from ..core.config import settings

logger = logging.getLogger(__name__)

class DocumentProcessingService:
    """
    Ingestion & text parsing pipeline for Student Companion AI.
    Safely parses PDF and TXT files downloaded from the college Google Drive,
    preserves exact page references, and produces sliding-window text chunks.
    """

    async def process_document(
        self,
        document_id: str,
        drive_file_id: str,
        mime_type: str,
        file_name: str,
    ) -> bool:
        """
        Executes document parsing, chunking, and persistence.
        """
        try:
            logger.info("Starting processing for document %s (%s)", document_id, file_name)
            await db_service.update_document_status(document_id, status="processing")

            # 1. Download file bytes from Google Drive
            file_bytes = drive_service.download_file(drive_file_id)
            if not file_bytes:
                raise ValueError("Could not download file content from Google Drive")

            chunks = []
            page_count = 1

            # 2. Parse based on MIME type
            if mime_type == "application/pdf" or file_name.lower().endswith(".pdf"):
                chunks, page_count = self._parse_pdf(file_bytes, document_id)
            elif mime_type == "text/plain" or file_name.lower().endswith(".txt"):
                chunks = self._parse_text(file_bytes, document_id)
                page_count = 1
            else:
                raise ValueError(f"Unsupported file MIME type: {mime_type}")

            if not chunks:
                raise ValueError(
                    "Document contains no extractable text. Scanned or image-only PDFs require OCR (planned for future phases)."
                )

            # 3. Persist extracted chunks & update document record
            await db_service.insert_chunks(document_id, chunks)
            await db_service.update_document_status(
                document_id,
                status="completed",
                page_count=page_count,
                chunk_count=len(chunks),
                error_message=None,
            )
            logger.info(
                "Document %s processed successfully: %d pages, %d chunks",
                document_id,
                page_count,
                len(chunks),
            )
            return True

        except Exception as e:
            error_msg = str(e)
            logger.error("Document processing failed for %s: %s", document_id, error_msg)
            await db_service.update_document_status(
                document_id,
                status="failed",
                page_count=0,
                chunk_count=0,
                error_message=error_msg,
            )
            return False

    def _parse_pdf(self, file_bytes: bytes, document_id: str) -> tuple[List[Dict[str, Any]], int]:
        """Safely extracts text page-by-page from PDF binaries."""
        import pypdf

        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        if reader.is_encrypted:
            raise ValueError("Password-protected / encrypted PDFs cannot be processed.")

        total_pages = len(reader.pages)
        if total_pages == 0:
            raise ValueError("PDF has 0 pages.")

        pages_to_process = min(total_pages, settings.MAX_PAGES_PER_DOCUMENT)
        all_chunks = []
        chunk_idx = 0

        for page_num in range(1, pages_to_process + 1):
            page = reader.pages[page_num - 1]
            page_text = page.extract_text() or ""
            page_text = page_text.strip()

            if not page_text:
                continue

            # Chunk text on this page with overlap
            page_chunks = self._split_text_with_overlap(page_text)
            for c_text in page_chunks:
                all_chunks.append({
                    "id": str(uuid.uuid4()),
                    "document_id": document_id,
                    "chunk_index": chunk_idx,
                    "page_number": page_num,
                    "content": c_text,
                    "token_count": len(c_text.split()),
                })
                chunk_idx += 1

        return all_chunks, total_pages

    def _parse_text(self, file_bytes: bytes, document_id: str) -> List[Dict[str, Any]]:
        """Extracts text from plain-text files."""
        text = file_bytes.decode("utf-8", errors="replace").strip()
        if not text:
            raise ValueError("Text file is empty.")

        text_chunks = self._split_text_with_overlap(text)
        all_chunks = []
        for idx, c_text in enumerate(text_chunks):
            all_chunks.append({
                "id": str(uuid.uuid4()),
                "document_id": document_id,
                "chunk_index": idx,
                "page_number": 1,
                "content": c_text,
                "token_count": len(c_text.split()),
            })
        return all_chunks

    def _split_text_with_overlap(self, text: str) -> List[str]:
        """Splits long text blocks into readable semantic slices with overlap."""
        chunk_size = settings.CHUNK_SIZE_CHARS
        overlap = settings.CHUNK_OVERLAP_CHARS

        if len(text) <= chunk_size:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += (chunk_size - overlap)

        return chunks

    async def retry_processing(self, document_id: str) -> bool:
        """Safely retries parsing for a failed document without duplicating chunks."""
        doc = await db_service.get_document(document_id)
        if not doc:
            raise ValueError("Document not found.")

        return await self.process_document(
            document_id=document_id,
            drive_file_id=doc["drive_file_id"],
            mime_type=doc["mime_type"],
            file_name=doc["file_name"],
        )

document_processor = DocumentProcessingService()
