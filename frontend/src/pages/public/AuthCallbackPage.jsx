import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        if (supabase && isSupabaseConfigured()) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;

          if (session?.user) {
            // Check user profile for completion or role
            const userRole = session.user.user_metadata?.role || 'student';
            if (isMounted) {
              if (userRole === 'admin') navigate('/admin/dashboard', { replace: true });
              else if (userRole === 'staff') navigate('/staff/dashboard', { replace: true });
              else navigate('/student/dashboard', { replace: true });
            }
            return;
          }
        }

        // Fallback for demo or immediate redirect
        if (isMounted) {
          if (role === 'admin') navigate('/admin/dashboard', { replace: true });
          else if (role === 'staff') navigate('/staff/dashboard', { replace: true });
          else navigate('/student/dashboard', { replace: true });
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Authentication session verification failed.');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, role]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #4338ca 0%, #0d9488 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          marginBottom: '20px',
        }}
      >
        <GraduationCap size={28} />
      </div>

      {error ? (
        <div style={{ maxWidth: '420px', backgroundColor: 'var(--bg-surface)', padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--color-danger)', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Verification Incomplete
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {error}
          </p>
          <Button variant="primary" onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center' }}>
            Return to Login
          </Button>
        </div>
      ) : (
        <div>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Verifying College Identity...
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Establishing secure campus session and resolving academic profile
          </p>
        </div>
      )}
    </div>
  );
}
