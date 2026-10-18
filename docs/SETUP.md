# Student Companion AI — Centralized Google Drive Setup Guide

This guide provides step-by-step instructions to configure the college-controlled Google Drive storage integration, provision Service Account credentials, set up database tables, and verify end-to-end functionality.

---

## 1. Google Cloud Console & Service Account Setup

### Step 1.1: Enable Google Drive API
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your college's Google Cloud Project (or create a new dedicated project, e.g. `student-companion-prod`).
3. Navigate to **APIs & Services** > **Library**.
4. Search for **Google Drive API** and click **Enable**.

### Step 1.2: Create a Service Account
1. Navigate to **IAM & Admin** > **Service Accounts**.
2. Click **Create Service Account**.
3. Name the service account (e.g., `student-companion-drive-sa`).
4. Click **Create and Continue**. (No project-level IAM roles are needed if using Shared Drives, because permissions are granted within the Shared Drive itself).
5. Click **Done**.
6. Copy the generated Service Account email (e.g., `student-companion-drive-sa@your-project-id.iam.gserviceaccount.com`).

### Step 1.3: Generate and Secure the JSON Key
1. In the Service Accounts list, click on your newly created Service Account.
2. Navigate to the **Keys** tab.
3. Click **Add Key** > **Create new key**.
4. Choose **JSON** format and click **Create**. The key file will download to your local machine.
5. Create a `secrets/` directory inside `backend/`:
   ```powershell
   mkdir backend/secrets
   ```
6. Move the downloaded JSON key file to `backend/secrets/service-account.json`.
7. **Verify Git Protection**:
   Confirm that `backend/secrets/` and `*service-account*.json` are listed in `.gitignore`:
   ```powershell
   git status -u
   # Notice that backend/secrets/service-account.json is NOT listed as an untracked file.
   ```

---

## 2. Google Workspace Shared Drive Configuration

### Step 2.1: Create a Shared Drive
1. Log into your college Google Workspace account at [drive.google.com](https://drive.google.com/).
2. In the left navigation, select **Shared Drives**.
3. Click **New** and name the drive: **`Student Companion AI Vault`**.

### Step 2.2: Add the Service Account as a Member
1. Open the newly created Shared Drive.
2. Click **Manage members** in the top right.
3. Paste the Service Account email (`student-companion-drive-sa@your-project-id.iam.gserviceaccount.com`).
4. Set the role to **Content Manager** (allows adding, editing, moving, and deleting files).
5. Ensure "Notify people" is unchecked and click **Send / Add**.

### Step 2.3: Extract Drive & Folder IDs
1. With the Shared Drive open, look at the URL in your browser:
   ```
   https://drive.google.com/drive/u/0/folders/0ABcDeFgHiJkL123456
   ```
   The string `0ABcDeFgHiJkL123456` is your **`GOOGLE_DRIVE_SHARED_DRIVE_ID`**.
2. Inside this Shared Drive, create a folder named `Study_Documents`.
3. Open `Study_Documents` and copy the ID from the URL:
   ```
   https://drive.google.com/drive/u/0/folders/1XYZabc987654321
   ```
   The string `1XYZabc987654321` is your **`GOOGLE_DRIVE_ROOT_FOLDER_ID`**.

---

## 3. Personal Google Drive Setup (OAuth 2.0 User Token)

Google strictly enforces **0 MB storage quota** on Service Accounts for personal (`@gmail.com`) Google Drive folders. To store uploaded study documents directly in your personal Google Drive (e.g. `rizvan2918@gmail.com`) using your free 15 GB quota:

### Step 3.1: Create an OAuth 2.0 Client ID in Google Cloud Console
1. Open the [Google Cloud Credentials Console](https://console.cloud.google.com/apis/credentials?project=studentcompanion-512008).
2. Configure **OAuth consent screen** (if not already done):
   - User type: **External**.
   - App name: **Student Companion AI**.
   - User support email: your personal Gmail address.
   - Developer contact email: your personal Gmail address.
   - Add your Gmail address under **Test users**.
3. Under **Credentials**, click **+ CREATE CREDENTIALS** > **OAuth client ID**.
4. Set Application type to **Desktop app**.
5. Name it `Student Companion Desktop` and click **Create**.
6. Click **Download JSON** and save the downloaded file as:
   ```
   backend/secrets/client-secrets.json
   ```

### Step 3.2: Run One-Time Authenticator Script
Run the automated authentication script in your backend virtual environment:
```powershell
cd backend
.\.venv\Scripts\python.exe scripts/authenticate_drive.py
```
1. A browser window will open asking to sign into your Google account.
2. Select your Google account (`rizvan2918@gmail.com`) and click **Continue / Allow**.
3. The script automatically:
   - Saves the persistent refresh token to `backend/secrets/drive-token.json`.
   - Switches `GOOGLE_DRIVE_MODE=oauth_user` in `backend/.env`.
   - Executes a test upload into `Study_Documents` (`1WVZ2FcEqmPyZ6MVL0168nMwZniI4NWRF`) to confirm live connectivity.
4. All study documents uploaded from the frontend will now immediately appear in your Google Drive folder!

---

## 4. Environment Variables Setup

### Backend Configuration (`backend/.env`)
Ensure your `backend/.env` contains the required keys:
```ini
# Supabase Configuration
SUPABASE_URL=https://ylcjhcfhiahlfokqvlsq.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Google Drive Storage Integration
GOOGLE_DRIVE_MODE=service_account
GOOGLE_DRIVE_SHARED_DRIVE_ID=0ABcDeFgHiJkL123456
GOOGLE_DRIVE_ROOT_FOLDER_ID=1XYZabc987654321
GOOGLE_APPLICATION_CREDENTIALS=secrets/service-account.json

# MongoDB Atlas Vector Search
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=student_companion
MONGODB_VECTOR_COLLECTION=study_chunks
MONGODB_VECTOR_INDEX=vector_index

# Vector Embedding Configuration
EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIMENSIONS=768

# n8n AI Agent Workflow Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/student-chat
N8N_AUTH_HEADER_NAME=X-N8N-WEBHOOK-SECRET
N8N_WEBHOOK_SECRET=your-random-long-n8n-webhook-secret
INTERNAL_API_KEY=your-secure-internal-api-key-for-fastapi
```

### Frontend Configuration (`frontend/.env.local`)
```ini
VITE_SUPABASE_URL=https://ylcjhcfhiahlfokqvlsq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_API_BASE_URL=http://localhost:8000
```

---

## 5. Database Schema Application

The database migrations are located at:
1. `backend/migrations/20261018_centralized_drive_storage.sql` (Base tables, departments, profiles, study documents, requests, announcements)
2. `backend/migrations/20261018_chat_sessions_and_messages.sql` (Persistent chat sessions and message history)

To apply migrations safely in Supabase:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. In the left navigation, go to **SQL Editor**.
4. Run `backend/migrations/20261018_centralized_drive_storage.sql`.
5. Run `backend/migrations/20261018_chat_sessions_and_messages.sql`.
6. Confirm that `study_documents`, `chat_sessions`, and `chat_messages` are created with RLS enabled.

---

## 6. MongoDB Atlas Vector Search Setup

MongoDB Atlas Vector Search is the primary semantic retrieval engine.

### Step 6.1: Create Collection
1. In the MongoDB Atlas Console, navigate to **Database** > **Browse Collections**.
2. Create database: `student_companion`.
3. Create collection: `study_chunks`.

### Step 6.2: Create Vector Search Index
1. In the Atlas Console, select the `study_chunks` collection.
2. Click **Atlas Search** > **Create Search Index**.
3. Choose **Atlas Vector Search** > **JSON Editor**.
4. Name the index: **`vector_index`**.
5. Paste the exact index definition:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "document_id"
    },
    {
      "type": "filter",
      "path": "department_id"
    },
    {
      "type": "filter",
      "path": "visibility"
    },
    {
      "type": "filter",
      "path": "is_active"
    }
  ]
}
```
6. Click **Next** and **Create Search Index**. Wait 1–2 minutes until index status displays **Active**.

---

## 7. n8n AI Agent Workflow Setup

The n8n workflow file is located at:
`n8n/student-companion-chat-agent.json`

### Step 7.1: Import Workflow into n8n
1. Open your n8n workspace (e.g. `http://localhost:5678`).
2. Click **Workflows** > **Import from File**.
3. Select `n8n/student-companion-chat-agent.json`.
4. The workflow **"Student Companion AI - Chat Agent"** will load.

### Step 7.2: Configure Credentials in n8n
1. Click on the **Google Gemini Chat Model** node.
2. Select or create your Google PaLM / Gemini API credential using your `GEMINI_API_KEY`.
3. Click on the **Webhook Trigger** node and ensure Header Auth is configured with `X-N8N-WEBHOOK-SECRET`.
4. Click on the **Authorized Retrieval via FastAPI** node and verify header `X-Internal-Key` matches `INTERNAL_API_KEY` in `backend/.env`.
5. Toggle the workflow to **Active**.

---

## 8. Verification & Connectivity Checks

### 8.1 Test Backend API Status
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/config-status"
```
Ensure the response verifies configuration presence without disclosing secret values:
```json
{
  "supabase_url_configured": true,
  "supabase_publishable_key_configured": true,
  "gemini_api_key_configured": true,
  "mongodb_configured": true,
  "mongodb_vector_index": "vector_index",
  "n8n_webhook_configured": true,
  "google_drive_configured": true
}
```

### 8.2 Run Test Suites
```powershell
# Backend Pytest Suite (15 automated tests)
cd backend
.\.venv\Scripts\pytest -v

# Frontend Vitest Suite (11 automated tests)
cd ../frontend
npm test
```
