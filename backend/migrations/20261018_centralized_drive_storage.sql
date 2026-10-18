-- ==============================================================================
-- Student Companion AI — Complete Production Schema for Supabase
-- Version: 20261018_centralized_drive_storage.sql
-- Description: Complete relational schema, Centralized Google Drive document
--              metadata, chunk storage, processing jobs, student requests,
--              campus announcements, study tasks, and conversation history
--              with comprehensive Row-Level Security (RLS) policies.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('student', 'staff', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_visibility') THEN
        CREATE TYPE public.document_visibility AS ENUM ('private', 'department', 'campus');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_processing_status') THEN
        CREATE TYPE public.document_processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE public.job_status AS ENUM ('queued', 'running', 'completed', 'failed', 'retrying');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_type') THEN
        CREATE TYPE public.request_type AS ENUM ('grievance', 'leave', 'certificate', 'facility', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE public.request_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'resolved');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_category') THEN
        CREATE TYPE public.announcement_category AS ENUM ('academic', 'examination', 'facilities', 'campus_life', 'administrative');
    END IF;
END $$;

-- ==============================================================================
-- 3. CORE RELATIONAL ENTITIES
-- ==============================================================================

-- 3.1 Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default departments if table is empty
INSERT INTO public.departments (name, code)
VALUES 
    ('Computer Science & Engineering', 'CSE'),
    ('Electronics & Communication Engineering', 'ECE'),
    ('Mechanical Engineering', 'MECH'),
    ('Mathematics & Basic Sciences', 'MATH'),
    ('College Administration & Dean Office', 'ADMIN')
ON CONFLICT (code) DO NOTHING;

-- 3.2 Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'student',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    student_id_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to automatically create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. CENTRALIZED GOOGLE DRIVE STUDY DOCUMENTS
-- ==============================================================================

-- 4.1 Study Documents
CREATE TABLE IF NOT EXISTS public.study_documents (
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
    
    CONSTRAINT check_study_doc_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400) -- Max 25MB
);

-- 4.2 Document Chunks (Extracted text for Gemini retrieval)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.study_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_document_chunk_order UNIQUE (document_id, chunk_index)
);

-- 4.3 Document Processing Jobs (Background parsing tracking)
CREATE TABLE IF NOT EXISTS public.document_processing_jobs (
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

-- ==============================================================================
-- 5. CAMPUS MANAGEMENT & COMMUNICATION TABLES
-- ==============================================================================

-- 5.1 Student Requests (Grievances, Leave, Bonafide Certificates)
CREATE TABLE IF NOT EXISTS public.student_requests (
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

-- 5.2 Campus Announcements & Circulars
CREATE TABLE IF NOT EXISTS public.announcements (
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

-- 5.3 Student Study Tasks (Daily study checklists)
CREATE TABLE IF NOT EXISTS public.study_tasks (
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

-- 5.4 AI Conversations & Message History (Citations tracking)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Study Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. INDEXES
-- ==============================================================================

-- Documents
CREATE INDEX IF NOT EXISTS idx_study_docs_owner ON public.study_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_study_docs_dept ON public.study_documents(department_id);
CREATE INDEX IF NOT EXISTS idx_study_docs_visibility ON public.study_documents(visibility);
CREATE INDEX IF NOT EXISTS idx_study_docs_status ON public.study_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_study_docs_drive_id ON public.study_documents(drive_file_id);

-- Chunks & Full Text Search
CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_page ON public.document_chunks(document_id, page_number);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_content_fts ON public.document_chunks USING gin (to_tsvector('english', content));

-- Jobs
CREATE INDEX IF NOT EXISTS idx_proc_jobs_doc_status ON public.document_processing_jobs(document_id, job_status);

-- Requests & Announcements
CREATE INDEX IF NOT EXISTS idx_requests_student ON public.student_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_dept ON public.student_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.student_requests(status);
CREATE INDEX IF NOT EXISTS idx_announcements_cat ON public.announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_dept ON public.announcements(department_id);
CREATE INDEX IF NOT EXISTS idx_study_tasks_student ON public.study_tasks(student_id, is_completed);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 7.1 Departments
CREATE POLICY "Public read access for departments"
ON public.departments FOR SELECT TO authenticated USING (true);

-- 7.2 Profiles
CREATE POLICY "Users can read all basic profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 7.3 Study Documents
CREATE POLICY "Users can view authorized study documents"
ON public.study_documents FOR SELECT TO authenticated
USING (
    owner_id = auth.uid()
    OR visibility = 'campus'
    OR (visibility = 'department' AND department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can insert their own study documents"
ON public.study_documents FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own study documents or admin"
ON public.study_documents FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can delete their own study documents or admin"
ON public.study_documents FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7.4 Document Chunks (Inherits from parent study_documents)
CREATE POLICY "Users can read chunks of authorized documents"
ON public.document_chunks FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.study_documents d
        WHERE d.id = document_chunks.document_id
          AND (
              d.owner_id = auth.uid()
              OR d.visibility = 'campus'
              OR (d.visibility = 'department' AND d.department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid()))
              OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          )
    )
);

-- 7.5 Document Processing Jobs
CREATE POLICY "Users can view processing jobs for their documents"
ON public.document_processing_jobs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.study_documents d
        WHERE d.id = document_processing_jobs.document_id
          AND (d.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- 7.6 Student Requests
CREATE POLICY "Students view own requests; staff view department requests; admin views all"
ON public.student_requests FOR SELECT TO authenticated
USING (
    student_id = auth.uid()
    OR (
        department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid())
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Students can create requests"
ON public.student_requests FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Staff and admin can update request status"
ON public.student_requests FOR UPDATE TO authenticated
USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- 7.7 Announcements
CREATE POLICY "All authenticated users view announcements"
ON public.announcements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admin can manage announcements"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')));

CREATE POLICY "Staff and admin can update announcements"
ON public.announcements FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')));

-- 7.8 Study Tasks
CREATE POLICY "Students manage their own study tasks"
ON public.study_tasks FOR ALL TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- 7.9 AI Conversations & Messages
CREATE POLICY "Students manage their own AI conversations"
ON public.ai_conversations FOR ALL TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students manage messages of own conversations"
ON public.ai_messages FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id AND c.student_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id AND c.student_id = auth.uid())
);

-- ==============================================================================
-- 8. DATABASE ROLES & PERMISSIONS
-- ==============================================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.departments TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_documents TO authenticated;
GRANT SELECT ON public.document_chunks TO authenticated;
GRANT SELECT ON public.document_processing_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.announcements TO authenticated;
GRANT ALL ON public.study_tasks TO authenticated;
GRANT ALL ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_messages TO authenticated;

-- Service role has full management capabilities for background processing
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
