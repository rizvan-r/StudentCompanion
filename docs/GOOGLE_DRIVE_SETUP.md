# Centralized Google Drive Setup Guide
## Student Companion AI Document Storage

This guide explains how Student Companion AI securely integrates with Google Drive to archive original lecture notes, syllabi, and reference documents, and how it handles Google's storage quota policies.

---

## 1. Storage Architecture

```
[ Frontend: User Uploads PDF ]
               |
               v
[ FastAPI: Sniff Magic Bytes & Verify User ]
               |
               +---> [ Google Drive ] (Original PDF archived securely)
               |
               +---> [ Supabase ] (File metadata, checksum, ownership)
               |
               +---> [ MongoDB Atlas ] (Extracted text chunks & vectors)
```

Original study documents are **never stored in Supabase Storage**. They are preserved in a centralized, college-controlled Google Drive vault. Text chunks and page citations are indexed in MongoDB Atlas for AI grounding.

---

## 2. Choosing Your Storage Mode

Google Cloud applies strict storage quotas to Google Drive:
- **Service Accounts have 0 MB of personal storage quota**.
- A Service Account **cannot** upload files into personal (`@gmail.com`) "My Drive" folders because Google assigns ownership to the creator (the Service Account), triggering:
  `403 Forbidden: Service Accounts do not have storage quota.`

Depending on your college setup, choose one of two supported modes:

| Feature | Mode A: Google Workspace Shared Drive | Mode B: Personal Google Drive (OAuth 2.0) |
| :--- | :--- | :--- |
| **Account Type** | Google Workspace (College/Institution domain) | Personal Gmail (`@gmail.com`) or Google One |
| **Authentication** | Service Account JSON Key | OAuth 2.0 User Refresh Token |
| **Quota Source** | Workspace Organizational Pool | Personal 15 GB Free Storage Quota |
| **Config Setting** | `GOOGLE_DRIVE_MODE=service_account` | `GOOGLE_DRIVE_MODE=oauth_user` |

---

## 3. Mode A: Google Workspace Shared Drive Setup

If your college possesses Google Workspace:
1. Go to [drive.google.com](https://drive.google.com/) using your college administrator account.
2. In the left sidebar, click **Shared Drives** > **New**. Name it `Student Companion AI Vault`.
3. Open the Shared Drive, click **Manage members**, and add your Service Account email:
   ```
   googledrive@studentcompanion-512008.iam.gserviceaccount.com
   ```
4. Set its role to **Content Manager**.
5. Inside this Shared Drive, create a folder named `Study_Documents`.
6. Copy the Shared Drive ID and Folder ID into `backend/.env`:
   ```ini
   GOOGLE_DRIVE_MODE=service_account
   GOOGLE_DRIVE_SHARED_DRIVE_ID=0ABcDeFgHiJkL123456
   GOOGLE_DRIVE_ROOT_FOLDER_ID=1XYZabc987654321
   GOOGLE_APPLICATION_CREDENTIALS=secrets/service-account.json
   ```

---

## 4. Mode B: Personal Google Drive Setup (OAuth 2.0)

If using a personal Gmail account (such as `rizvan2918@gmail.com`):

### Step 4.1: Create an OAuth Client ID in Google Cloud Console
1. Open [Google Cloud Credentials Console](https://console.cloud.google.com/apis/credentials?project=studentcompanion-512008).
2. Under **Credentials**, click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. Set Application type to **Desktop app**.
4. Name it `Student Companion Desktop` and click **Create**.
5. Click **Download JSON** and save the file as:
   ```
   backend/secrets/client-secrets.json
   ```

### Step 4.2: Run the Automated Authenticator
Open a terminal in `backend/` and execute:
```powershell
cd backend
.\.venv\Scripts\python.exe scripts/authenticate_drive.py
```
1. A browser window will open. Sign into your Google account and click **Allow**.
2. The script will save `backend/secrets/drive-token.json`, update `GOOGLE_DRIVE_MODE=oauth_user` in `.env`, and upload a test file to confirm live access.
3. Every document uploaded from the React frontend will now be stored directly in your Google Drive with full 15 GB quota!
