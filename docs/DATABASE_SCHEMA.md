# Student Companion AI — Database Schema Specification

This document details the relational schema, constraints, indexes, Row-Level Security (RLS) policies, and role grants for the **Centralized Google Drive Storage** architecture in Supabase PostgreSQL.

---

## 1. Relational Entities & Data Dictionary

### 1.1 `departments`
Stores academic departments (e.g., Computer Science, Electrical Engineering, Mathematics).
```sql
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 1.2 `profiles`
Extends `auth.users` with college domain roles and department affiliations.
```sql
CREATE TYPE public.user_role AS ENUM ('student', 'staff', 'admin');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'student',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 1.3 `study_documents`
Primary metadata table linking original files archived in the college Google Drive to student ownership, visibility rules, and extraction state.
```sql
CREATE TYPE public.document_visibility AS ENUM ('private', 'department', 'campus');
CREATE TYPE public.document_processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE public.study_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    drive_file_id TEXT NOT NULL UNIQUE,
    drive_folder_id TEXT NOT NULL,
    drive_web_view_link TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    visibility public.document_visibility NOT NULL DEFAULT 'private',
    processing_status public.document_processing_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    file_checksum_sha256 TEXT NOT NULL,
    page_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT check_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400) -- 25MB max
);
```

### 1.4 `document_chunks`
Stores text segments extracted from files for citation-grounded retrieval. Inherits all access control from parent `study_documents`.
```sql
CREATE TABLE public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.study_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_document_chunk_index UNIQUE (document_id, chunk_index)
);
```

### 1.5 `document_processing_jobs`
Tracks asynchronous ingestion jobs, retry attempts, and parser diagnostics.
```sql
CREATE TYPE public.job_status AS ENUM ('queued', 'running', 'completed', 'failed', 'retrying');

CREATE TABLE public.document_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.study_documents(id) ON DELETE CASCADE,
    job_status public.job_status NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 1,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error_log TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 1.6 `student_requests`
Handles student grievances, on-duty/medical leave requests, and bonafide certificate requests routed to departments.
```sql
CREATE TYPE public.request_type AS ENUM ('grievance', 'leave', 'certificate', 'facility', 'other');
CREATE TYPE public.request_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'resolved');

CREATE TABLE public.student_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE DEFAULT ('REQ-' || to_char(now(), 'YYYY') || '-' || substr(md5(random()::text), 1, 6)),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    request_type public.request_type NOT NULL DEFAULT 'other',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status public.request_status NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'normal',
    assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 1.7 `announcements`
Campus circulars and academic notices published by faculty and administrators.
```sql
CREATE TYPE public.announcement_category AS ENUM ('academic', 'examination', 'facilities', 'campus_life', 'administrative');

CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category public.announcement_category NOT NULL DEFAULT 'academic',
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 1.8 `study_tasks` & AI Conversations
Personal daily study checklist and AI Q&A conversation history with source citation audit records.
```sql
CREATE TABLE public.study_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course_code TEXT,
    duration_minutes INTEGER DEFAULT 45,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Study Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

### 1.9 `chat_sessions` & `chat_messages`
Primary persistent conversation history tables consumed by FastAPI and React AI Study Companion:
```sql
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 2. Performance Indexes

```sql
-- Fast lookup by owner and department
CREATE INDEX idx_study_documents_owner ON public.study_documents(owner_id);
CREATE INDEX idx_study_documents_dept ON public.study_documents(department_id);
CREATE INDEX idx_study_documents_visibility ON public.study_documents(visibility);
CREATE INDEX idx_study_documents_status ON public.study_documents(processing_status);
CREATE INDEX idx_study_documents_drive_id ON public.study_documents(drive_file_id);

-- Fast chunk retrieval by document and page order
CREATE INDEX idx_document_chunks_doc_id ON public.document_chunks(document_id);
CREATE INDEX idx_document_chunks_page ON public.document_chunks(document_id, page_number);

-- Full-text search index for exact keyword matching within authorized documents
CREATE INDEX idx_document_chunks_content_fts ON public.document_chunks USING gin (to_tsvector('english', content));

-- Job lookup
CREATE INDEX idx_proc_jobs_doc_status ON public.document_processing_jobs(document_id, job_status);
```

---

## 3. Row-Level Security (RLS) Policies

All tables have RLS strictly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

### 3.1 `study_documents` Policies
```sql
-- 1. SELECT Policy
CREATE POLICY "Users can view authorized study documents"
ON public.study_documents FOR SELECT
TO authenticated
USING (
    -- Document owner can always view
    owner_id = auth.uid()
    OR
    -- Campus-wide visibility
    visibility = 'campus'
    OR
    -- Department staff and students of the same department (if visibility is department)
    (
        visibility = 'department' 
        AND department_id IN (
            SELECT department_id FROM public.profiles WHERE id = auth.uid()
        )
    )
    OR
    -- Administrators can audit all documents
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 2. INSERT Policy
CREATE POLICY "Users can insert their own study documents"
ON public.study_documents FOR INSERT
TO authenticated
WITH CHECK (
    owner_id = auth.uid()
);

-- 3. UPDATE Policy
CREATE POLICY "Users can update their own study documents"
ON public.study_documents FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    owner_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. DELETE Policy
CREATE POLICY "Users can delete their own documents or admin"
ON public.study_documents FOR DELETE
TO authenticated
USING (
    owner_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### 3.2 `document_chunks` Policies
Chunks inherit exact visibility from their parent `study_documents` record:
```sql
CREATE POLICY "Users can access chunks of authorized documents"
ON public.document_chunks FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.study_documents d
        WHERE d.id = document_chunks.document_id
          AND (
              d.owner_id = auth.uid()
              OR d.visibility = 'campus'
              OR (
                  d.visibility = 'department' 
                  AND d.department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid())
              )
              OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          )
    )
);

-- Chunks are inserted/deleted via backend service_role during processing
```

### 3.3 `document_processing_jobs` Policies
```sql
CREATE POLICY "Users can view processing jobs for their documents"
ON public.document_processing_jobs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.study_documents d
        WHERE d.id = document_processing_jobs.document_id
          AND (d.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);
```

---

## 4. Role Grants & Privileges

```sql
-- Revoke all default public permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, public;

-- Grant authenticated users necessary access subject to RLS
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_documents TO authenticated;
GRANT SELECT ON public.document_chunks TO authenticated;
GRANT SELECT ON public.document_processing_jobs TO authenticated;
GRANT SELECT ON public.departments TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Service role has full management capabilities for background processing
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

---

## 5. Vector Extension & Embedding Roadmap Note

> [!NOTE]
> **Embeddings Separation Strategy**:
> During initial implementation, retrieval relies on metadata filtering and full-text keyword indexing (`idx_document_chunks_content_fts`).
> The `pgvector` extension (`CREATE EXTENSION IF NOT EXISTS vector;`) and a vector column (`embedding vector(768)` or `vector(1536)`) should **not** be applied until the final Gemini embedding model (e.g. `text-embedding-004` at 768 dimensions) and indexing parameters (IVFFlat vs HNSW) are formally tested with representative college textbooks. Adding unneeded vector dimensions prematurely increases write latency and memory usage.
