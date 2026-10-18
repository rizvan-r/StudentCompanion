import { api } from '../lib/apiClient';

export const announcementService = {
  // Get all visible announcements
  getAnnouncements: async (category = '') => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return await api.get(`/api/announcements/${query}`);
  },

  // Get specific announcement by ID
  getById: async (announcementId) => {
    return await api.get(`/api/announcements/${announcementId}`);
  },

  // Publish announcement (Staff / Admin)
  create: async (announcementData) => {
    return await api.post('/api/announcements/', announcementData);
  },

  // Delete announcement (Admin)
  delete: async (announcementId) => {
    return await api.del(`/api/announcements/${announcementId}`);
  },
};
