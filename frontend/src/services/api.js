/**
 * Backend API Client Service for Student Companion AI (Phase 1)
 * Safely inspects backend readiness, health, and configuration flags
 * without exposing credentials or executing unverified mutations.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Default mock token for local student dev session
const DEFAULT_AUTH_TOKEN = 'test:student:00000000-0000-0000-0000-000000000001';

/**
 * Returns the current authorization header
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('auth_token') || DEFAULT_AUTH_TOKEN;
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Sets an active auth token in storage
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Checks backend health endpoint (/health)
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { isOnline: true, status: data.status || 'ok' };
    }
    return { isOnline: false, error: `HTTP ${response.status}` };
  } catch (err) {
    return {
      isOnline: false,
      error: err.name === 'AbortError' ? 'Connection timed out' : 'Backend unavailable',
    };
  }
}

/**
 * Fetches basic backend service metadata from root endpoint (/)
 */
export async function getBackendInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely verifies presence of configuration variables
 * Returns boolean flags only - NEVER reveals keys.
 */
export async function getConfigStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/config-status`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   Study Documents & Centralized Google Drive Endpoints
   ========================================================================== */

/**
 * Fetches all study documents uploaded by the authenticated student
 */
export async function getDocuments() {
  const response = await fetch(`${API_BASE_URL}/api/documents/`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch documents: HTTP ${response.status}`);
  }
  return await response.json();
}

/**
 * Uploads a study document (PDF or TXT) to the centralized Drive vault
 * @param {File} file
 * @param {string} title
 * @param {string} subject
 */
export async function uploadDocument(file, title, subject = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || file.name);
  if (subject) {
    formData.append('subject', subject);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        // Let browser set multipart/form-data boundary automatically
      },
      body: formData,
    });
  } catch (netErr) {
    throw new Error(`Upload connection failed: ${netErr.message}`);
  }

  // Fallback to base endpoint if needed
  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${API_BASE_URL}/api/documents`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }
  return await response.json();
}

/**
 * Retrieves the processing status of a document
 */
export async function getDocumentStatus(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/status`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch document status: HTTP ${response.status}`);
  }
  const data = await response.json();
  return {
    ...data,
    status: data.status || data.processing_status,
  };
}

/**
 * Deletes a document from the database and Central Drive
 */
export async function deleteDocument(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete document: HTTP ${response.status}`);
  }
  return await response.json();
}

/**
 * Retries processing for a failed document
 */
export async function retryDocument(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/retry`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to retry document processing: HTTP ${response.status}`);
  }
  return await response.json();
}

/* ==========================================================================
   AI Study Companion & Grounded Q&A with Citations
   ========================================================================== */

/* ==========================================================================
   AI Study Companion & Grounded Q&A with Citations
   ========================================================================== */

/**
 * Sends a study query to the /api/chat endpoint with conversation persistence
 * @param {string} message
 * @param {string[]} documentIds
 * @param {string|null} conversationId
 */
export async function askAssistant(message, documentIds = [], conversationId = null) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      message,
      document_ids: documentIds && documentIds.length > 0 ? documentIds : undefined,
      conversation_id: conversationId || undefined,
    }),
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }
  return await response.json();
}

/**
 * Retrieves list of conversation sessions
 */
export async function getConversations() {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

/**
 * Creates a new conversation session
 */
export async function createConversation(title = 'New Study Session') {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

/**
 * Retrieves messages for a specific conversation session
 */
export async function getConversationMessages(conversationId) {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

/**
 * Deletes a conversation session
 */
export async function deleteConversation(conversationId) {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

/* ==========================================================================
   Campus Requests & Announcements
   ========================================================================== */

export async function getRequests() {
  const response = await fetch(`${API_BASE_URL}/api/requests/`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

export async function createRequest(requestData) {
  const response = await fetch(`${API_BASE_URL}/api/requests/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(requestData),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

export async function getAnnouncements() {
  const response = await fetch(`${API_BASE_URL}/api/announcements/`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

export { API_BASE_URL };

