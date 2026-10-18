# Student Companion AI — Production Deployment Guide
## Vercel (Frontend) + Render / Railway (FastAPI Backend) + Direct Gemini RAG

This guide details the exact steps to deploy the **Student Companion AI** platform to production using **Vercel** for the frontend and **Render** (or **Railway**) for the backend, running in **FastAPI Direct Mode** (native Gemini 2.5 Flash + MongoDB Atlas Vector Search, with zero external n8n server maintenance).

---

## 1. Deployment Architecture Summary

```
                      +------------------------------------------+
                      |               STUDENT CLIENT             |
                      |   Desktop Browser / Tablet / Mobile UI   |
                      +------------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v HTTPS                                       v HTTPS (API & Auth)
     +------------------------------+             +-------------------------------+
     |       VERCEL HOSTING         |             |        RENDER / RAILWAY       |
     |   React 19 + Vite Frontend   |             |   FastAPI Python 3.11 Backend |
     |   - SPA rewrite rules        |             |   - REST API & Auth Guards    |
     |   - VITE_API_BASE_URL        |             |   - Direct Gemini 2.5 RAG     |
     |   - VITE_SUPABASE_URL        |             |   - Google Drive File Vault   |
     +------------------------------+             +---------------+---------------+
                                                                  |
                +-------------------------+-----------------------+-----------------------+
                |                         |                                               |
                v                         v                                               v
+-------------------------------+  +-------------------------------+  +-------------------------------+
|       SUPABASE CLOUD          |  |      GOOGLE DRIVE VAULT       |  |      MONGODB ATLAS CLOUD      |
|  - Auth (Google + Email)      |  |  - Academic Shared Drive      |  |  - Vector Search Collection   |
|  - PostgreSQL Database        |  |  - Service Account Access     |  |  - 768-dim Embeddings Index   |
|  - Role & Tenant RLS          |  |  - Non-public secure storage  |  |  - Semantic Syllabus Chunks   |
+-------------------------------+  +-------------------------------+  +-------------------------------+
```

---

## 2. Pre-Deployment Checklist

Before deploying, ensure you have:
1. **GitHub Repository**: All project code committed and pushed to your GitHub repository.
2. **Supabase Cloud Account**: Active project with database tables migrated (from [`docs/DATABASE_SCHEMA.md`](file:///i:/Richu/Projects/StudentCompanion/docs/DATABASE_SCHEMA.md)).
3. **MongoDB Atlas Account**: Active cluster with Vector Search Index created on `student_companion.study_chunks`.
4. **Google Cloud Service Account**: [`service-account.json`](file:///i:/Richu/Projects/StudentCompanion/backend/secrets/service-account.json) with Google Drive API enabled and added to your college Shared Drive / folder.
5. **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/).

---

## 3. Step-by-Step Backend Deployment (Render)

### Step 3.1: Create Web Service on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Configure the basic settings:
   - **Name**: `student-companion-backend` (or your choice)
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon, Ohio)
   - **Root Directory**: `backend` *(Important!)*
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free` or `Starter`

### Step 3.2: Set Backend Environment Variables on Render
Under the **Environment Variables** tab in your Render service, add the following key-value pairs:

| Variable Name | Value / Source | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Ensures compatible Python runtime |
| `SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Your Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Supabase Anon/Publishable API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` | Supabase Service Role Secret Key |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API Key |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/?...` | Atlas connection string |
| `MONGODB_DATABASE` | `student_companion` | Database name |
| `MONGODB_VECTOR_COLLECTION` | `study_chunks` | Collection name |
| `MONGODB_VECTOR_INDEX` | `vector_index` | Atlas vector search index name |
| `GOOGLE_DRIVE_MODE` | `service_account` | Storage authentication mode |
| `GOOGLE_DRIVE_SHARED_DRIVE_ID` | `0ABc...` (or leave empty if folder) | Shared Drive ID |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | `1XYZ...` | Root Google Drive folder ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | *Paste full contents of `service-account.json`* | One-step credentials injection |
| `N8N_WEBHOOK_URL` | `direct` | Activates direct high-speed Gemini RAG mode |
| `CORS_ORIGINS` | `https://*.vercel.app` *(update with your exact Vercel URL once deployed)* | Cross-Origin Whitelist |

> [!TIP]
> **Convenience**: By setting `GOOGLE_SERVICE_ACCOUNT_JSON`, you do **not** need to upload any secret files or configure persistent disks on Render. The backend will parse the JSON directly from the environment.

### Step 3.3: Deploy and Verify Backend
1. Click **Create Web Service**.
2. Wait for the build and startup to complete.
3. Open your Render service URL in a browser (e.g., `https://student-companion-backend.onrender.com/health`).
4. You should receive:
   ```json
   {
     "status": "healthy",
     "app": "Student Companion AI",
     "google_drive": true,
     "mongo_atlas": true
   }
   ```
5. Copy your Render Backend URL (e.g. `https://student-companion-backend.onrender.com`). You will need this for the frontend!

---

## 4. Step-by-Step Frontend Deployment (Vercel)

### Step 4.1: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** > **Project**.
3. Select your GitHub repository.
4. In the project setup screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`** *(Critical!)*

### Step 4.2: Configure Vercel Environment Variables
Expand the **Environment Variables** section and add:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://student-companion-backend.onrender.com` | **Your deployed Render backend URL** (No trailing slash) |
| `VITE_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Your Supabase Anon/Publishable API Key |

### Step 4.3: Deploy Frontend
1. Click **Deploy**.
2. Vercel will install dependencies, run `npm run build`, and apply [`frontend/vercel.json`](file:///i:/Richu/Projects/StudentCompanion/frontend/vercel.json) client-side rewrite rules.
3. Once finished, Vercel gives you your live production domain:
   `https://student-companion-ai.vercel.app`

---

## 5. Post-Deployment Linkage & Security

### Step 5.1: Whitelist Vercel Domain on Render Backend
1. In the Render Dashboard, go to your backend web service > **Environment**.
2. Update `CORS_ORIGINS` to include your exact Vercel domain:
   ```
   CORS_ORIGINS=https://student-companion-ai.vercel.app
   ```
3. Save changes (Render will trigger a zero-downtime redeploy).

### Step 5.2: Supabase Authentication Redirect URLs
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) > **Authentication** > **URL Configuration**.
2. In **Site URL**, enter:
   `https://student-companion-ai.vercel.app`
3. In **Redirect URLs**, add:
   - `https://student-companion-ai.vercel.app/**`
   - `https://student-companion-ai.vercel.app/auth/callback`
4. Click **Save**.

### Step 5.3: MongoDB Atlas Network Access
1. Open [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
2. Navigate to **Security** > **Network Access**.
3. Click **Add IP Address**.
4. Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   *(Required because cloud PaaS like Render and Vercel use dynamic outbound IPs).*
5. Click **Confirm**.

---

## 6. Alternative: Railway Deployment

If you prefer **Railway** instead of Render for the backend:
1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select this repository.
4. In **Settings**:
   - Set **Root Directory**: `/backend`
   - Railway will automatically detect the [`backend/Dockerfile`](file:///i:/Richu/Projects/StudentCompanion/backend/Dockerfile) or [`backend/Procfile`](file:///i:/Richu/Projects/StudentCompanion/backend/Procfile).
5. In **Variables**: Add all the same environment variables listed in **Section 3.2**.
6. In **Networking**: Click **Generate Domain** to get your public backend HTTPS URL.
7. Point `VITE_API_BASE_URL` on Vercel to your Railway domain.

---

## 7. Production Verification Checklist

Visit your live Vercel URL and verify each flow:
- [ ] **Auth**: Login / Sign up with email or Google; verify session persists.
- [ ] **Dashboard**: Verify the 3-card balanced layout displays live requests and bulletins.
- [ ] **Central Drive Vault**: Upload a sample syllabus PDF and verify status switches to `Ready for AI`.
- [ ] **AI Study Companion**: Ask conceptual syllabus questions and confirm grounded answers with page citations.
- [ ] **Department Requests**: Submit a grievance/leave/certificate request and verify it appears in the queue.
- [ ] **Campus Announcements**: Verify circulars filter cleanly by category.
- [ ] **Admin Portal**: Switch to Admin role and verify institutional metrics and audit log display.
