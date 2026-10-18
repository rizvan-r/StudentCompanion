import { api } from './apiClient';

export const conversationService = {
  /**
   * Retrieves list of active chat sessions for the authenticated student
   */
  getConversations: async () => {
    return await api.get('/api/chat/conversations');
  },

  /**
   * Creates a new conversation session
   */
  createConversation: async (title = 'New Study Session') => {
    return await api.post('/api/chat/conversations', { title });
  },

  /**
   * Loads message history for a specific conversation session
   */
  getMessages: async (conversationId) => {
    return await api.get(`/api/chat/conversations/${conversationId}/messages`);
  },

  /**
   * Deletes a conversation session and cascades message deletion
   */
  deleteConversation: async (conversationId) => {
    return await api.del(`/api/chat/conversations/${conversationId}`);
  },
};
