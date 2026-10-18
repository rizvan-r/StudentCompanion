import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

const DEMO_PROFILES = {
  student: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'alex.student@college.edu',
    full_name: 'Alex Rivera',
    role: 'student',
    student_id_number: 'CS-2023-042',
    department_id: 'dept-cse',
    department_name: 'Computer Science & Engineering',
    course_name: 'B.Tech Computer Science',
    semester: 'Semester 5',
  },
  staff: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'sarah.faculty@college.edu',
    full_name: 'Dr. Sarah Jenkins',
    role: 'staff',
    staff_id_number: 'FAC-CSE-109',
    department_id: 'dept-cse',
    department_name: 'Computer Science & Engineering',
    designation: 'Associate Professor & Student Advisor',
  },
  admin: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'admin.dean@college.edu',
    full_name: 'Prof. Marcus Vance',
    role: 'admin',
    staff_id_number: 'ADM-DEAN-001',
    department_id: 'dept-admin',
    department_name: 'Office of the Academic Dean',
    designation: 'Dean of Academic Affairs',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch full user profile from Supabase database or auto-register new Google user
  const loadProfile = useCallback(async (userId, userEmail, userMeta = {}) => {
    const savedActiveRole = localStorage.getItem('active_role');
    const fallbackName = userMeta.full_name || userMeta.name || (userEmail ? userEmail.split('@')[0] : 'College Student');
    const defaultRole = (savedActiveRole && ['student', 'staff', 'admin'].includes(savedActiveRole))
      ? savedActiveRole
      : (userMeta.role || 'student');

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error: profileErr } = await supabase
          .from('profiles')
          .select('*, departments(name, code)')
          .eq('id', userId)
          .single();

        if (data && !profileErr) {
          return {
            ...data,
            role: savedActiveRole || data.role || 'student',
            department_name: data.departments?.name || 'Computer Science & Engineering',
          };
        }

        // Profile row does not exist yet (e.g., brand new Google OAuth sign-in)
        // Auto-register user as student in public.profiles table
        const newProfile = {
          id: userId,
          email: userEmail,
          full_name: fallbackName,
          role: defaultRole,
          student_id_number: userMeta.student_id_number || `STU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select('*, departments(name, code)')
          .single();

        if (inserted && !insertErr) {
          return {
            ...inserted,
            role: savedActiveRole || inserted.role || 'student',
            department_name: inserted.departments?.name || 'Computer Science & Engineering',
          };
        }
      } catch (err) {
        console.warn('Supabase profile load / auto-register exception:', err);
      }
    }

    // Default metadata or student fallback
    return {
      id: userId,
      email: userEmail,
      full_name: fallbackName,
      role: defaultRole,
      student_id_number: userMeta.student_id_number || 'STU-2024-001',
      department_name: 'Computer Science & Engineering',
    };
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        if (supabase && isSupabaseConfigured()) {
          const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) throw sessionErr;

          if (session?.user && isMounted) {
            setUser(session.user);
            const userProfile = await loadProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata
            );
            setProfile(userProfile);
            localStorage.setItem('auth_token', session.access_token);
          } else if (isMounted) {
            // Check if user previously picked a demo role for local dev
            const savedDevRole = localStorage.getItem('active_role') || localStorage.getItem('demo_role') || 'student';
            const demoUser = DEMO_PROFILES[savedDevRole] || DEMO_PROFILES.student;
            setUser({ id: demoUser.id, email: demoUser.email });
            setProfile(demoUser);
            localStorage.setItem('auth_token', `test:${demoUser.role}:${demoUser.id}`);
          }
        } else if (isMounted) {
          // Offline / Local development mode with demo role
          const savedDevRole = localStorage.getItem('active_role') || localStorage.getItem('demo_role') || 'student';
          const demoUser = DEMO_PROFILES[savedDevRole] || DEMO_PROFILES.student;
          setUser({ id: demoUser.id, email: demoUser.email });
          setProfile(demoUser);
          localStorage.setItem('auth_token', `test:${demoUser.role}:${demoUser.id}`);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes if Supabase is connected
    let subscription = null;
    if (supabase && isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          const p = await loadProfile(session.user.id, session.user.email, session.user.user_metadata);
          setProfile(p);
          localStorage.setItem('auth_token', session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('active_role');
        }
      });
      subscription = data.subscription;
    }

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Sign In with email & password
  const signIn = async (email, password) => {
    setError(null);
    if (supabase && isSupabaseConfigured()) {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;
      return data;
    }

    // Demo sign-in for testing
    let matchedRole = 'student';
    if (email.includes('admin')) matchedRole = 'admin';
    else if (email.includes('staff') || email.includes('faculty')) matchedRole = 'staff';

    const demo = DEMO_PROFILES[matchedRole];
    setUser({ id: demo.id, email: email });
    setProfile({ ...demo, email });
    localStorage.setItem('demo_role', matchedRole);
    localStorage.setItem('auth_token', `test:${matchedRole}:${demo.id}`);
    return { user: demo };
  };

  // Sign Up
  const signUp = async (email, password, metadata = {}) => {
    setError(null);
    if (supabase && isSupabaseConfigured()) {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.fullName || '',
            role: 'student', // Always default to student for safety
            student_id_number: metadata.studentIdNumber || '',
          },
        },
      });
      if (signUpErr) throw signUpErr;
      return data;
    }

    const demo = { ...DEMO_PROFILES.student, email, full_name: metadata.fullName || 'New Student' };
    setUser({ id: demo.id, email });
    setProfile(demo);
    localStorage.setItem('auth_token', `test:student:${demo.id}`);
    return { user: demo };
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    setError(null);
    if (supabase && isSupabaseConfigured()) {
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthErr) throw oauthErr;
      return data;
    }
    // Demo fallback
    return signIn('student.google@college.edu', 'password');
  };

  // Sign Out
  const signOut = async () => {
    if (supabase && isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('active_role');
    localStorage.removeItem('demo_role');
  };

  // Reset Password
  const resetPassword = async (email) => {
    if (supabase && isSupabaseConfigured()) {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetErr) throw resetErr;
      return true;
    }
    return true;
  };

  // Update Profile
  const updateProfile = async (updates) => {
    if (supabase && isSupabaseConfigured() && user) {
      const { data, error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      setProfile((prev) => ({ ...prev, ...data }));
      return data;
    }

    setProfile((prev) => ({ ...prev, ...updates }));
    return updates;
  };

  // Switch role helper for development & QA testing
  const switchRole = async (newRole) => {
    if (!['student', 'staff', 'admin'].includes(newRole)) return;

    // Check if the current user is a real authenticated user
    const isRealUser = user && user.id && !user.id.startsWith('00000000');

    if (isRealUser) {
      // PRESERVE the real authenticated user (e.g. Google sign-in user)!
      // Never log them out or replace them with Alex Rivera
      setProfile((prev) => ({
        ...prev,
        role: newRole,
      }));
      localStorage.setItem('active_role', newRole);

      // Persist the role update in Supabase profiles table
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', user.id);
        } catch (e) {
          console.warn('Could not update role in Supabase profiles:', e);
        }
      }
    } else {
      // Offline / demo mode fallback
      if (DEMO_PROFILES[newRole]) {
        const target = DEMO_PROFILES[newRole];
        setUser({ id: target.id, email: target.email });
        setProfile(target);
        localStorage.setItem('demo_role', newRole);
        localStorage.setItem('active_role', newRole);
        localStorage.setItem('auth_token', `test:${target.role}:${target.id}`);
      }
    }
  };

  const role = profile?.role || 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile,
        switchRole,
        isConfigured: isSupabaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
