# Student Companion AI — Master Implementation Plan
## Complete Architecture: React + FastAPI + Supabase + MongoDB Atlas Vector Search + Google Drive + n8n AI Agent (Gemini)

This document outlines the master implementation plan for **Student Companion AI**, a production-grade, centralized college platform with AI-powered academic assistance and administrative workflows.

---

## 1. System Architecture Overview

```
+-------------------------------------------------------------------------+
|                              REACT FRONTEND                             |
|  - Modern, compact student UI (Vite + React 19)                         |
|  - Chat interface with markdown, syntax highlighting & citations       |
|  - Persistent conversations sidebar & session history                   |
|  - Central Google Drive Document Library with live processing status    |
|  - Central API client attaching Supabase JWTs                           |
+------------------------------------+------------------------------------+
                                     |
                                     | Supabase Auth Bearer Token
                                     v
+------------------------------------+------------------------------------+
|                         FASTAPI BACKEND GATEWAY                         |
|  - Security boundary & central integration gateway                      |
|  - Supabase JWT authentication, account status & RLS authorization      |
|  - Conversation & message persistence (Supabase PostgreSQL)             |
|  - Document authorization & short-lived view link generator             |
|  - Internal Search Service (`POST /internal/knowledge/search`)          |
|  - Document Ingestion Pipeline (text extraction, chunking, embedding)   |
+--------------------+--------------------------------+-------------------+
                     |                                |
       +-------------+-------------+                  | Private Webhook
       |                           |                  | + Secret Header
       v                           v                  v
+--------------+           +---------------+   +--------------------------+
|  SUPABASE DB |           |  GOOGLE DRIVE |   |       n8n AI AGENT       |
|  PostgreSQL  |           |  Vault Storage|   |  - Student Companion AI  |
|  - Profiles  |           |  - Original   |   |    Chat Agent workflow   |
|  - Depts     |           |    PDF & TXT  |   |  - Google Gemini Model   |
|  - Sessions  |           |  - Workspace  |   |  - HTTP Request Tool     |
|  - Messages  |           |    Shared or  |   |    (`POST /internal/     |
|  - Docs meta |           |    OAuth user |   |     knowledge/search`)   |
+--------------+           +---------------+   |  - Structured citations  |
                                               +-------------+------------+
                                                             |
                                      Authorized search query|
                                                             v
                                               +--------------------------+
                                               |   MONGODB ATLAS VECTOR   |
                                               |   Collection: study_chunks|
                                               |   Index: vector_index    |
                                               |   Semantic vector search |
                                               |   with metadata filters  |
                                               +--------------------------+
```

---

## 2. Implementation Milestones

### Milestone 1: Repository Audit, Architecture & Documentation
- Comprehensive audit of repository structure, dependencies, and configuration.
- Creation of complete documentation suite:
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/ARCHITECTURE.md`
  - `docs/DATABASE_SCHEMA.md`
  - `docs/MONGODB_VECTOR_SEARCH.md`
  - `docs/N8N_WORKFLOW.md`
  - `docs/GOOGLE_DRIVE_SETUP.md`
  - `docs/SECURITY.md`
  - `docs/SETUP.md`
  - `docs/TESTING.md`

### Milestone 2: FastAPI Authentication & Consistent Chat API
- Update backend configuration with MongoDB, n8n, embedding, and Google Drive settings in `app/core/config.py`.
- Secure Supabase JWT verification in `app/core/security.py`.
- Define Pydantic schemas for chat requests, chat responses, source citations, conversations, and internal knowledge search.
- Implement `/api/chat` endpoint validating input, enforcing authentication, orchestrating n8n AI execution, persisting user & assistant messages, and returning structured citations.

### Milestone 3: Supabase Chat Persistence & Conversation History
- Database migration for `chat_sessions` and `chat_messages` tables with RLS and foreign keys.
- Implement `conversation_repository.py` and `conversation_service.py` with ownership enforcement.
- Expose REST endpoints:
  - `POST /api/chat/conversations` (Create session)
  - `GET /api/chat/conversations` (List student's sessions)
  - `GET /api/chat/conversations/{id}/messages` (Load session message history)
  - `DELETE /api/chat/conversations/{id}` (Delete session & messages)

### Milestone 4: MongoDB Atlas Vector Search & Embedding Service
- Configure PyMongo connection client in `app/services/mongo_vector_service.py` with connection pooling, retries, and health checks.
- Implement `app/services/gemini_embedding_service.py` supporting Google Gemini `text-embedding-004` (768 dimensions) with batching and exponential backoff.
- Implement semantic vector search with `$vectorSearch` filtering by `department_id`, `visibility`, and `is_active`.
- Implement `app/services/retrieval_service.py` checking authorization before returning passages to callers.

### Milestone 5: Private Google Drive Integration & Document Ingestion Pipeline
- Update `app/services/google_drive_service.py` supporting both Google Workspace Shared Drive (Service Account) and Personal Google Drive (OAuth 2.0 User Refresh Token).
- Implement `app/services/document_extraction_service.py` extracting page-numbered text from PDFs and TXT files.
- Implement `app/services/document_chunking_service.py` producing deterministic chunks (500-1000 tokens) with overlap and stable chunk IDs.
- Implement `app/services/document_ingestion_service.py` executing background pipeline:
  1. Upload original file to private Google Drive.
  2. Record metadata in Supabase (`processing`).
  3. Extract text & page references.
  4. Generate embeddings via Gemini.
  5. Upsert vector records into MongoDB `study_chunks`.
  6. Update Supabase status to `ready` (or `failed` with safe error details).
- Implement authorized document viewing route: `GET /api/documents/{id}/view`.

### Milestone 6: n8n AI Agent Workflow & Internal Knowledge Search Route
- Implement internal knowledge search endpoint: `POST /internal/knowledge/search` protected by a secret internal service header.
- Implement `app/services/n8n_service.py` in FastAPI with bounded timeout, error normalization, and fallback to direct Gemini RAG if n8n is offline.
- Export ready-to-import n8n workflow JSON: `n8n/student-companion-chat-agent.json`.

### Milestone 7: React Chat & Document Library Integration
- Integrate conversation history sidebar and active conversation switching into `StudyAssistantPage.jsx`.
- Implement markdown rendering with `react-markdown` and syntax formatting for code blocks.
- Add citation cards under assistant responses with clickable "View Source" actions routed through FastAPI.
- Update `DocumentLibrary.jsx` with real-time status badges (`uploading`, `processing`, `ready`, `failed`), delete actions, and retry buttons.
- Connect all frontend calls through modular services (`chatService.js`, `conversationService.js`, `documentService.js`).

### Milestone 8: Security, Authorization & Comprehensive Automated Testing
- Unit and integration tests covering:
  - Supabase JWT verification and ownership boundaries.
  - MongoDB Vector search filtering by department and visibility.
  - Document chunking, extraction, and embedding dimension checks.
  - Chat history persistence and deletion cascading.
  - n8n internal service route authentication.
- Playwright frontend verification.

### Milestone 9: Setup Documentation, Production Build & Final Verification
- Comprehensive setup guide for Windows PowerShell and cloud environments.
- Verify production build of React application (`npm run build`).
- Verify complete pytest suite (`pytest tests/`).

---

## 3. Definition of Done Checklist

- [x] React frontend builds cleanly (`npm run build` succeeds).
- [x] FastAPI backend starts cleanly and passes all test suites.
- [x] Supabase authentication verified securely with session isolation.
- [x] Persistent multi-session conversations work with full history.
- [x] MongoDB Atlas Vector Search indexes document chunks with 768-dim embeddings.
- [x] Google Drive securely stores original uploaded PDF and text files.
- [x] Document ingestion automatically parses, chunks, embeds, and indexes files into MongoDB.
- [x] Private internal endpoint `POST /internal/knowledge/search` allows authorized retrieval for n8n.
- [x] n8n workflow configuration provided with Google Gemini and source citations.
- [x] Frontend displays markdown, code syntax, and genuine document page citations.
- [x] All secrets remain strictly server-side and protected by `.gitignore`.
