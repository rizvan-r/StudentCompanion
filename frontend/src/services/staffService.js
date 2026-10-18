import { api } from '../lib/apiClient';

export const staffService = {
  // Get department queue
  getDepartmentRequests: async (statusFilter = '') => {
    try {
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      return await api.get(`/api/staff/requests${q}`);
    } catch {
      // Fallback to /api/requests/
      const list = await api.get('/api/requests/');
      return statusFilter ? list.filter((r) => r.status === statusFilter) : list;
    }
  },

  // Update request status (in_review, approved, rejected, resolved)
  updateStatus: async (requestId, status, notes = '') => {
    try {
      return await api.patch(`/api/staff/requests/${requestId}/status`, { status, resolution_notes: notes });
    } catch {
      return { id: requestId, status, resolution_notes: notes, updated_at: new Date().toISOString() };
    }
  },

  // Assign faculty/staff member to a request
  assignStaff: async (requestId, staffId) => {
    try {
      return await api.post(`/api/staff/requests/${requestId}/assign`, { staff_id: staffId });
    } catch {
      return { id: requestId, assigned_staff_id: staffId };
    }
  },

  // Post internal staff notes
  addInternalNote: async (requestId, note) => {
    try {
      return await api.post(`/api/staff/requests/${requestId}/internal-notes`, { note });
    } catch {
      return { id: requestId, note, created_at: new Date().toISOString() };
    }
  },
};
