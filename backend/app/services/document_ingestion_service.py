import io
import uuid
import logging
from typing import List, Dict, Any, Tuple
from .google_drive_service import drive_service
from .supabase_client import db_service
from .gemini_embedding_service import embedding_service
from .mongo_vector_service import mongo_vector_service
from ..core.config import settings

logger = logging.getLogger(__name__)

class DocumentIngestionService:
    """
    Complete document ingestion, chunking, embedding generation,
    and MongoDB Atlas Vector Search indexing pipeline.
    """

    async def process_document(
        self,
        document_id: str,
        drive_file_id: str,
        mime_type: str,
        file_name: str,
    ) -> bool:
        """
        Executes end-to-end ingestion:
        Drive Download -> Text Extraction -> Page References -> Chunking
        -> 768-dim Embedding Generation -> MongoDB Atlas Indexing -> Supabase Ready
        """
        try:
            logger.info("Starting ingestion pipeline for document %s (%s)", document_id, file_name)
            await db_service.update_document_status(document_id, status="processing")

            doc_meta = await db_service.get_document(document_id) or {}
            dept_id = doc_meta.get("department_id")
            visibility = doc_meta.get("visibility", "department")
            doc_title = doc_meta.get("title") or file_name

            # 1. Download file bytes securely from college Google Drive
            file_bytes = drive_service.download_file(drive_file_id)
            if not file_bytes:
                raise ValueError("Could not download file content from Google Drive")

            chunks: List[Dict[str, Any]] = []
            page_count = 1

            # 2. Extract text & page references based on file type
            if mime_type == "application/pdf" or file_name.lower().endswith(".pdf"):
                chunks, page_count = self._parse_pdf(file_bytes, document_id, doc_title, dept_id, visibility)
            elif mime_type == "text/plain" or file_name.lower().endswith(".txt"):
                chunks = self._parse_text(file_bytes, document_id, doc_title, dept_id, visibility)
                page_count = 1
            else:
                raise ValueError(f"Unsupported file MIME type: {mime_type}")

            if not chunks:
                raise ValueError(
                    "Document contains no extractable text. Scanned or image-only PDFs require OCR."
                )

            # 3. Generate 768-dimensional embeddings for all extracted chunks in batches
            texts_to_embed = [c["content"] for c in chunks]
            embeddings = await embedding_service.generate_embeddings_batch(texts_to_embed)

            for idx, c in enumerate(chunks):
                c["embedding"] = embeddings[idx]

            # 4. Upsert chunks into MongoDB Atlas Vector Search
            await mongo_vector_service.upsert_chunks(chunks)

            # 5. Save chunk metadata in Supabase
            await db_service.insert_chunks(document_id, chunks)

            # 6. Mark document as 'ready' (also accepts 'completed')
            await db_service.update_document_status(
                document_id,
                status="ready",
                page_count=page_count,
                chunk_count=len(chunks),
                error_message=None,
            )
            logger.info(
                "Document %s successfully ingested & indexed into MongoDB: %d pages, %d chunks",
                document_id,
                page_count,
                len(chunks),
            )
            return True

        except Exception as e:
            error_msg = str(e)
            logger.error("Document ingestion pipeline failed for %s: %s", document_id, error_msg)
            await db_service.update_document_status(
                document_id,
                status="failed",
                page_count=0,
                chunk_count=0,
                error_message=error_msg,
            )
            return False

    def _parse_pdf(
        self,
        file_bytes: bytes,
        document_id: str,
        doc_title: str,
        dept_id: str,
        visibility: str,
    ) -> Tuple[List[Dict[str, Any]], int]:
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
            page_text = (page.extract_text() or "").strip()

            if not page_text:
                continue

            # Split page text into overlapping semantic chunks
            page_chunks = self._split_text_with_overlap(page_text)
            for c_text in page_chunks:
                chunk_id = f"{document_id}_p{page_num}_c{chunk_idx}"
                all_chunks.append({
                    "id": chunk_id,
                    "chunk_id": chunk_id,
                    "document_id": document_id,
                    "title": doc_title,
                    "chunk_index": chunk_idx,
                    "page_number": page_num,
                    "content": c_text,
                    "department_id": dept_id,
                    "visibility": visibility,
                    "is_active": True,
                    "token_count": len(c_text.split()),
                })
                chunk_idx += 1

        return all_chunks, total_pages

    def _parse_text(
        self,
        file_bytes: bytes,
        document_id: str,
        doc_title: str,
        dept_id: str,
        visibility: str,
    ) -> List[Dict[str, Any]]:
        text = file_bytes.decode("utf-8", errors="replace").strip()
        if not text:
            raise ValueError("Text file is empty.")

        text_chunks = self._split_text_with_overlap(text)
        all_chunks = []
        for idx, c_text in enumerate(text_chunks):
            chunk_id = f"{document_id}_p1_c{idx}"
            all_chunks.append({
                "id": chunk_id,
                "chunk_id": chunk_id,
                "document_id": document_id,
                "title": doc_title,
                "chunk_index": idx,
                "page_number": 1,
                "content": c_text,
                "department_id": dept_id,
                "visibility": visibility,
                "is_active": True,
                "token_count": len(c_text.split()),
            })
        return all_chunks

    def _split_text_with_overlap(self, text: str) -> List[str]:
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
        doc = await db_service.get_document(document_id)
        if not doc:
            raise ValueError("Document not found.")

        # Clean existing chunks before retrying for idempotency
        await mongo_vector_service.delete_document_chunks(document_id)

        return await self.process_document(
            document_id=document_id,
            drive_file_id=doc["drive_file_id"],
            mime_type=doc["mime_type"],
            file_name=doc["file_name"],
        )

document_ingestion_service = DocumentIngestionService()
document_processor = document_ingestion_service
