import { api } from '../lib/apiClient';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const requestService = {
  // List student requests
  getRequests: async () => {
    try {
      const data = await api.get('/api/requests');
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('API /api/requests error:', e);
    }

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && !error && data.length > 0) {
          return data.map((r) => ({
            ...r,
            reference_number: r.ticket_number || `REQ-${r.id.slice(0, 8)}`,
            category: r.category || (r.request_type === 'grievance' ? 'Campus Complaint' : r.request_type),
          }));
        }
      } catch (err) {
        console.warn('Supabase direct student_requests error:', err);
      }
    }

    return [];
  },

  // Get specific request by ID
  getRequestById: async (requestId) => {
    return await api.get(`/api/requests/${requestId}`);
  },

  // Submit new request (complaint, leave, certificate, service)
  createRequest: async (requestData) => {
    let result = null;
    try {
      result = await api.post('/api/requests', requestData);
      if (result) return result;
    } catch (err) {
      console.warn('Backend /api/requests creation error, attempting direct Supabase insert:', err);
    }

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const rawType = (requestData.request_type || 'other').toLowerCase();
          const typeMap = {
            complaint: 'grievance',
            service: 'facility',
            grievance: 'grievance',
            leave: 'leave',
            certificate: 'certificate',
            facility: 'facility',
            other: 'other',
          };
          const normalizedType = typeMap[rawType] || 'other';
          const ticketNumber = `REQ-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

          const dbPayload = {
            student_id: session.user.id,
            title: requestData.title,
            description: requestData.description,
            request_type: normalizedType,
            status: 'pending',
            priority: requestData.priority || 'normal',
            ticket_number: ticketNumber,
          };

          const { data, error } = await supabase
            .from('student_requests')
            .insert(dbPayload)
            .select()
            .single();

          if (data && !error) {
            return {
              ...data,
              reference_number: ticketNumber,
              category: requestData.category,
              department_name: requestData.department_name,
            };
          }
        }
      } catch (sbErr) {
        console.warn('Direct Supabase insert error:', sbErr);
      }
    }

    return result || {
      id: `local-${Date.now()}`,
      reference_number: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      ...requestData,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  },

  // Add a reply / comment to request
  addReply: async (requestId, comment) => {
    return await api.post(`/api/requests/${requestId}/comments`, { comment });
  },

  // Calculate request statistics
  getStats: (requests = []) => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      underReview: requests.filter((r) => r.status === 'in_review').length,
      resolved: requests.filter((r) => r.status === 'resolved' || r.status === 'approved').length,
      needsInfo: requests.filter((r) => r.status === 'needs_info').length,
    };
  },
};
