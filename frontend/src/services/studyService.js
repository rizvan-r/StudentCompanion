import { api } from '../lib/apiClient';

const STORAGE_KEY_CONVOS = 'student_companion_study_conversations';

export const studyService = {
  // Query Gemini with optional document grounding
  askAssistant: async (message, documentIds = [], subject = '') => {
    return await api.post('/api/assistant/chat', {
      message,
      document_ids: documentIds,
      subject,
    });
  },

  // Get student's study conversations list
  getConversations: async () => {
    try {
      const remote = await api.get('/api/assistant/conversations');
      return remote;
    } catch {
      // Local persistent fallback
      const saved = localStorage.getItem(STORAGE_KEY_CONVOS);
      return saved ? JSON.parse(saved) : [];
    }
  },

  // Save new conversation
  saveConversation: async (conversation) => {
    try {
      return await api.post('/api/assistant/conversations', conversation);
    } catch {
      // Local fallback
      const saved = localStorage.getItem(STORAGE_KEY_CONVOS);
      const list = saved ? JSON.parse(saved) : [];
      const updated = [conversation, ...list.filter((c) => c.id !== conversation.id)];
      localStorage.setItem(STORAGE_KEY_CONVOS, JSON.stringify(updated));
      return conversation;
    }
  },

  // Delete conversation
  deleteConversation: async (id) => {
    try {
      await api.del(`/api/assistant/conversations/${id}`);
    } catch {
      const saved = localStorage.getItem(STORAGE_KEY_CONVOS);
      if (saved) {
        const list = JSON.parse(saved);
        localStorage.setItem(STORAGE_KEY_CONVOS, JSON.stringify(list.filter((c) => c.id !== id)));
      }
    }
    return true;
  },
};
