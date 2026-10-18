import { api } from '../lib/apiClient';

export const documentService = {
  // List documents owned or visible to user
  getDocuments: async () => {
    return await api.get('/api/documents/');
  },

  // Get specific document by ID
  getDocument: async (documentId) => {
    return await api.get(`/api/documents/${documentId}`);
  },

  // Get processing status
  getStatus: async (documentId) => {
    return await api.get(`/api/documents/${documentId}/status`);
  },

  // Upload document (PDF/TXT) to Central Drive
  upload: async (file, title, subject = '', visibility = 'private') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    if (subject) formData.append('subject', subject);
    formData.append('visibility', visibility);

    return await api.upload('/api/documents/upload', formData);
  },

  // Delete document
  deleteDocument: async (documentId) => {
    return await api.del(`/api/documents/${documentId}`);
  },

  // Retry document processing
  retryProcessing: async (documentId) => {
    return await api.post(`/api/documents/${documentId}/retry`, {});
  },
};
