# Student Companion AI — Complete System Architecture
## Centralized Google Drive Storage + MongoDB Atlas Vector Search + n8n AI Agent (Gemini)

---

## 1. Architectural Topology

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  React 19 + Vite Frontend SPA (Desktop, Tablet, Mobile)                           |
|  - Manages student sessions via Supabase Auth client                              |
|  - Persistent conversation history & active session drawer                       |
|  - Sends Bearer JWT tokens to FastAPI backend gateway                             |
|  - Markdown rendering & genuine document citation cards with page links           |
|  - Central Google Drive document manager with live processing status badges       |
|  - NEVER accesses MongoDB, n8n, Google Drive, or Gemini directly                  |
+-----------------------------------------------------------------------------------+
                                        |  HTTPS + Bearer JWT
                                        v
+-----------------------------------------------------------------------------------+
|                         FASTAPI BACKEND & SECURITY GATEWAY                        |
|  Python 3.11 + FastAPI Asynchronous REST API (Port 8000)                          |
|  - Auth Middleware: Validates Supabase JWT, resolves user identity, role, dept    |
|  - Security Boundary: Enforces ownership & department-level isolation            |
|  - Ingestion Engine: Validates magic-bytes, uploads to Drive, extracts & chunks   |
|  - Vector Indexer: Generates Gemini embeddings & indexes in MongoDB Atlas         |
|  - Internal Retrieval Service: Exposes POST /internal/knowledge/search to n8n     |
|  - Chat Orchestrator: Invokes n8n Webhook, persists messages & citations         |
+-----------------------------------+-------------------+---------------------------+
        |                           |                   |
        | SQL / PostgREST (RLS)     | Drive API v3      | Private Webhook + Secret
        v                           v                   v
+------------------------+  +-------------------+  +--------------------------------+
|     DATABASE LAYER     |  |   STORAGE LAYER   |  |      AI ORCHESTRATION LAYER    |
|  Supabase PostgreSQL   |  |  Google Drive     |  |  n8n AI Agent Workflow         |
|  - auth.users          |  |  Central Vault    |  |  "Student Companion AI Agent"  |
|  - profiles & roles    |  |  - Original PDF & |  |  - Input Validation & Normal.  |
|  - departments         |  |    TXT files      |  |  - HTTP Request Tool (FastAPI) |
|  - chat_sessions       |  |  - Workspace      |  |  - Google Gemini Chat Model    |
|  - chat_messages       |  |    Shared Drive or|  |  - Memory / Context Framing   |
|  - study_documents     |  |    OAuth user     |  |  - Structured JSON Citations   |
|  - document_proc_jobs  |  |  - UUID keyed     |  +----------------+---------------+
+------------------------+  +-------------------+                   |
                                                                    | Authorized Query
                                                                    v
                                                   +--------------------------------+
                                                   |      SEMANTIC RETRIEVAL        |
                                                   |  MongoDB Atlas Vector Search   |
                                                   |  - Database: student_companion |
                                                   |  - Collection: study_chunks    |
                                                   |  - Index: vector_index         |
                                                   |  - 768-dim Gemini embeddings   |
                                                   |  - Department/active filters   |
                                                   +--------------------------------+
```

---

## 2. Authentication & Trust Boundaries

### 2.1 Identity Flow
1. **User Authentication**: Students, staff, and administrators log in via Supabase Auth (institutional email/password or Google OAuth).
2. **Token Issuance**: Supabase Auth issues a cryptographically signed JWT containing `sub` (User UUID), `email`, and session metadata.
3. **Backend Verification**: On every request to `/api/chat/*` or `/api/documents/*`:
   * FastAPI extracts the token from the `Authorization: Bearer <token>` header.
   * FastAPI verifies the token's signature, expiration, and issuer against the Supabase project configuration.
   * FastAPI resolves the user's operational role (`student`, `staff`, `admin`) and department affiliation from the `profiles` table.
   * If the token is invalid, expired, or the user is suspended, the request immediately terminates with HTTP 401 Unauthorized.

### 2.2 Storage Boundary
* **No Client Credentials**: The React frontend is completely isolated from Google Drive. It possesses no OAuth client secrets, refresh tokens, or service account keys.
* **Server-to-Server Storage Access**: The FastAPI backend communicates with Google Drive using Google API client libraries, authenticated as an institutional Service Account or OAuth 2.0 User.
* **Non-Public Drive Assets**: All files placed in the college Google Drive have their permissions restricted. No public or "anyone with the link" permissions are ever enabled by the system.

### 2.3 Semantic Retrieval & AI Boundary
* **No Direct MongoDB Access**: The browser and n8n never connect directly to MongoDB. All semantic searches are executed through FastAPI (`POST /internal/knowledge/search`).
* **Protected Internal Retrieval Route**: The `/internal/knowledge/search` endpoint requires a shared server-side secret header (`X-Internal-Key`) matching `INTERNAL_SERVICE_SECRET`.
* **Zero Placeholder Embeddings**: Chunks are embedded using Google Gemini `text-embedding-004` (768 dimensions). No placeholder or dummy vectors are ever inserted.

---

## 3. End-to-End Data Flows

### 3.1 Document Ingestion Flow
```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (React Client)
    participant API as FastAPI Backend
    participant Drive as College Google Drive
    participant DB as Supabase PostgreSQL
    participant Mongo as MongoDB Atlas
    participant Gemini as Gemini Embedding API

    Student->>API: POST /api/documents (File + Auth JWT)
    API->>API: Sniff magic bytes (%PDF / UTF-8) & check 25MB limit
    API->>Drive: Upload original binary (UUID keyed)
    Drive-->>API: Return drive_file_id & web_view_link
    API->>DB: INSERT into study_documents (status: 'processing')
    API-->>Student: 201 Created (document_id, status: 'processing')

    Note over API,Mongo: Background Ingestion Task
    API->>Drive: Download binary stream for extraction
    API->>API: Extract text & preserve page references
    API->>API: Chunk text (500-1000 tokens, 150 token overlap)
    API->>Gemini: Generate embeddings (text-embedding-004, 768-dim)
    Gemini-->>API: Return embedding vectors
    API->>Mongo: Bulk upsert into study_chunks (document_id, title, page, vector)
    API->>DB: UPDATE study_documents SET status = 'ready', chunk_count = N
```

### 3.2 Chat & Retrieval Flow
```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (React Client)
    participant API as FastAPI Backend
    participant DB as Supabase PostgreSQL
    participant N8N as n8n AI Agent
    participant Mongo as MongoDB Atlas
    participant Gemini as Gemini Chat Model

    Student->>API: POST /api/chat (message, conversation_id, doc_ids)
    API->>API: Verify user JWT, permissions & conversation ownership
    API->>DB: INSERT into chat_messages (role: 'user')
    API->>N8N: POST /webhook/student-chat (message, user_id, doc_ids)
    
    N8N->>API: POST /internal/knowledge/search (query, doc_ids, X-Internal-Key)
    API->>API: Validate internal service key
    API->>Mongo: $vectorSearch on study_chunks with auth filters
    Mongo-->>API: Top-K relevant authorized chunks
    API-->>N8N: 200 OK (passages, document_id, title, page)

    N8N->>Gemini: Prompt with user query + authorized context
    Gemini-->>N8N: Grounded academic answer
    N8N-->>API: Structured response (answer, citations, status: 'completed')

    API->>DB: INSERT into chat_messages (role: 'assistant', citations)
    API-->>Student: 200 OK (answer, citations, conversation_id)
```
