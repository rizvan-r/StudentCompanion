import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Retrieves the current authorization token from Supabase session or local fallback
 */
async function getAuthToken() {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        return data.session.access_token;
      }
    } catch {
      // Fallback
    }
  }

  // Local fallback for testing / dev sessions
  return localStorage.getItem('auth_token') || 'test:student:00000000-0000-0000-0000-000000000001';
}

/**
 * Generic resilient fetch wrapper with timeout, token injection, and structured error handling
 */
export async function apiClient(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    isFormData = false,
    signal: userSignal,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Combine user abort signal if provided
  if (userSignal) {
    userSignal.addEventListener('abort', () => controller.abort());
  }

  const token = await getAuthToken();

  const finalHeaders = {
    ...headers,
  };

  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const activeRole = localStorage.getItem('active_role') || localStorage.getItem('demo_role');
  if (activeRole && !finalHeaders['X-User-Role']) {
    finalHeaders['X-User-Role'] = activeRole;
  }

  if (!isFormData && !finalHeaders['Content-Type'] && method !== 'GET') {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON or text
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message =
        (typeof data === 'object' && data?.detail) ||
        (typeof data === 'object' && data?.message) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection.', 408);
    }

    throw new ApiError(err.message || 'Network error occurred. Ensure backend is running.', 0);
  }
}

export const api = {
  get: (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PATCH', body }),
  del: (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'DELETE' }),
  upload: (endpoint, formData, options = {}) =>
    apiClient(endpoint, { ...options, method: 'POST', body: formData, isFormData: true }),
};

export { API_BASE_URL };
