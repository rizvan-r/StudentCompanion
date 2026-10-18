import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const authService = {
  /**
   * Signs in user with email and college credentials
   */
  signInWithPassword: async (email, password) => {
    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data?.session?.access_token) {
        localStorage.setItem('auth_token', data.session.access_token);
      }
      return data;
    }
    // Development fallback
    localStorage.setItem('auth_token', 'test:student:00000000-0000-0000-0000-000000000001');
    return { user: { email }, session: { access_token: 'test:student' } };
  },

  /**
   * Signs in user with Google OAuth
   */
  signInWithGoogle: async () => {
    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    }
  },

  /**
   * Signs up a new user with metadata
   */
  signUp: async (email, password, metadata = {}) => {
    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;
      return data;
    }
  },

  /**
   * Signs out current user
   */
  signOut: async () => {
    localStorage.removeItem('auth_token');
    if (supabase && isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Returns current active session
   */
  getSession: async () => {
    if (supabase && isSupabaseConfigured()) {
      const { data } = await supabase.auth.getSession();
      return data?.session;
    }
    return null;
  },
};
