# Student Companion AI — Testing Guide
## Automated Test Suites & Quality Verification

This guide outlines the testing strategy, test coverage, and commands to run unit and integration tests across both the FastAPI backend and React frontend.

---

## 1. Test Architecture

The testing strategy is organized into two layers:
1. **Unit & Isolation Tests**: Fast, deterministic, requiring zero external cloud connections (using mocked external APIs and isolated local vault simulations).
2. **Integration Tests**: Target live Supabase, MongoDB Atlas Vector Search, Google Drive, and n8n environments when configured.

---

## 2. Test Execution Commands

### Running Backend Python Tests
From the `backend/` directory:
```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/ -v
```

To run a specific test suite:
```powershell
# Vector retrieval & chunking tests
.\.venv\Scripts\python.exe -m pytest tests/test_vector_search.py -v

# Document upload & Drive tests
.\.venv\Scripts\python.exe -m pytest tests/test_documents_and_drive.py -v

# Chat persistence & n8n integration tests
.\.venv\Scripts\python.exe -m pytest tests/test_chat_and_conversations.py -v
```

### Running Frontend React Tests
From the `frontend/` directory:
```powershell
cd frontend
npm test -- --run
```

### Running Playwright Visual Capture
```powershell
cd frontend
node scripts/capture.js
```

---

## 3. Test Coverage Matrix

| Component | Tested Scenarios | Test File |
| :--- | :--- | :--- |
| **Authentication & RLS** | Valid Bearer token, invalid token, expired session, user impersonation rejection, department isolation | `tests/test_auth.py` |
| **Document Processing** | Unsupported extension, 0-byte file, fake PDF magic-byte spoofing, text extraction, chunk overlap | `tests/test_documents_and_drive.py` |
| **Vector Search** | 768-dim vector check, department filtering, visibility rules (`public`, `department`, `private`), deleted doc exclusion | `tests/test_vector_search.py` |
| **Chat & Conversations** | Session creation, message sequencing, conversation ownership, n8n webhook invocation, citation assembly | `tests/test_chat_and_conversations.py` |
| **Internal Retrieval** | Secret header verification, rejection of unauthenticated callers, passage scoring | `tests/test_internal_search.py` |
| **Frontend UI** | Protected routes, login redirects, conversation sidebar switching, markdown rendering, citation modal | `src/test/*.test.jsx` |
