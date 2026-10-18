import { api } from './apiClient';

export const chatService = {
  /**
   * Submits a student message to the AI Chat endpoint.
   * Securely dispatches to FastAPI -> MongoDB Atlas Vector Search -> n8n AI Agent -> Gemini.
   */
  sendMessage: async ({ message, conversationId = null, documentIds = [] }) => {
    const payload = {
      message: message.trim(),
      conversation_id: conversationId || undefined,
      document_ids: documentIds && documentIds.length > 0 ? documentIds : undefined,
    };

    const idempotencyKey = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return await api.post('/api/chat', payload, {
      headers: {
        'X-Idempotency-Key': idempotencyKey,
      },
    });
  },

  /**
   * Helper to build authorized document view URL
   */
  getDocumentViewUrl: (documentId) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}/api/documents/${documentId}/view`;
  },
};
