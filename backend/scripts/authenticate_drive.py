#!/usr/bin/env python3
"""
Student Companion AI - Google Drive OAuth 2.0 Authenticator
Links a personal Google Drive account (e.g. rizvan2918@gmail.com) so study documents
are uploaded directly into the user's Google Drive with full 15 GB quota,
bypassing the 0 MB quota limitation of Google Service Accounts.
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Define paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"
SECRETS_DIR = BACKEND_DIR / "secrets"
SECRETS_DIR.mkdir(parents=True, exist_ok=True)

CLIENT_SECRETS_PATH = SECRETS_DIR / "client-secrets.json"
TOKEN_PATH = SECRETS_DIR / "drive-token.json"

SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive",
]

def main():
    load_dotenv(ENV_PATH)
    print("=" * 65)
    print("  Student Companion AI - Google Drive OAuth 2.0 Setup")
    print("=" * 65)
    print()

    # Step 1: Check if client credentials exist
    client_id = os.getenv("GOOGLE_DRIVE_OAUTH_CLIENT_ID", "").strip()
    client_secret = os.getenv("GOOGLE_DRIVE_OAUTH_CLIENT_SECRET", "").strip()

    from google_auth_oauthlib.flow import InstalledAppFlow

    flow = None

    if CLIENT_SECRETS_PATH.exists():
        print(f"[+] Found client secrets file at: {CLIENT_SECRETS_PATH}")
        flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS_PATH), scopes=SCOPES)
    elif client_id and client_secret:
        print("[+] Found GOOGLE_DRIVE_OAUTH_CLIENT_ID & SECRET in backend/.env")
        client_config = {
            "installed": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": ["http://localhost", "http://127.0.0.1"]
            }
        }
        flow = InstalledAppFlow.from_client_config(client_config, scopes=SCOPES)
    else:
        print("[-] No OAuth 2.0 Client credentials found.")
        print()
        print("To allow Student Companion AI to upload to your personal Google Drive:")
        print("1. Open Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=studentcompanion-512008")
        print("2. Click '+ CREATE CREDENTIALS' > 'OAuth client ID'")
        print("3. Application type: Select 'Desktop app'")
        print("4. Name: 'Student Companion Desktop Auth' -> Click 'CREATE'")
        print("5. Click 'DOWNLOAD JSON' and save it as:")
        print(f"   {CLIENT_SECRETS_PATH}")
        print()
        print("Alternatively, add these two lines to backend/.env:")
        print("GOOGLE_DRIVE_OAUTH_CLIENT_ID=your_client_id_here")
        print("GOOGLE_DRIVE_OAUTH_CLIENT_SECRET=your_client_secret_here")
        print()
        sys.exit(1)

    print("[*] Launching browser for authorization...")
    print("    Please log in with: rizvan2918@gmail.com and click 'Allow'.")
    print()

    try:
        creds = flow.run_local_server(port=0, prompt="consent")
    except Exception as e:
        print(f"[!] Authentication flow failed: {e}")
        sys.exit(1)

    # Save token
    TOKEN_PATH.write_text(creds.to_json())
    print(f"[+] Saved authorized token to: {TOKEN_PATH}")

    # Update .env
    env_content = ENV_PATH.read_text(encoding="utf-8") if ENV_PATH.exists() else ""
    if "GOOGLE_DRIVE_MODE=" in env_content:
        import re
        env_content = re.sub(r"GOOGLE_DRIVE_MODE=[^\r\n]*", "GOOGLE_DRIVE_MODE=oauth_user", env_content)
    else:
        env_content += "\nGOOGLE_DRIVE_MODE=oauth_user\n"
    ENV_PATH.write_text(env_content, encoding="utf-8")
    print("[+] Updated backend/.env to GOOGLE_DRIVE_MODE=oauth_user")

    # Step 2: Test Live Upload to Study_Documents folder
    folder_id = os.getenv("GOOGLE_DRIVE_ROOT_FOLDER_ID", "1WVZ2FcEqmPyZ6MVL0168nMwZniI4NWRF")
    print(f"\n[*] Testing upload to Google Drive folder: {folder_id}...")

    from googleapiclient.discovery import build
    from googleapiclient.http import MediaInMemoryUpload

    service = build("drive", "v3", credentials=creds, cache_discovery=False)

    test_file_meta = {
        "name": "oauth_verification_success.txt",
        "description": "Student Companion AI OAuth verification file",
        "parents": [folder_id],
    }
    media = MediaInMemoryUpload(
        b"Verification: OAuth 2.0 upload to personal Google Drive successful!",
        mimetype="text/plain",
    )

    try:
        created = service.files().create(
            body=test_file_meta,
            media_body=media,
            fields="id, name, webViewLink, size, owners",
            supportsAllDrives=True,
        ).execute()

        print(f"[OK] Upload SUCCESSFUL!")
        print(f"     File Name: {created.get('name')}")
        print(f"     File ID:   {created.get('id')}")
        print(f"     View Link: {created.get('webViewLink')}")
        print(f"     Owner:     {created.get('owners', [{}])[0].get('emailAddress')}")
        print()
        print("Google Drive is now fully operational and storing files in your Google Drive!")
    except Exception as e:
        print(f"[!] Test upload failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
