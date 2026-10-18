import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';

export function UnauthorizedPage() {
  const { role, switchRole } = useAuth();
  const navigate = useNavigate();

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
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <ShieldAlert size={36} />
      </div>

      <div
        style={{
          maxWidth: '480px',
          backgroundColor: 'var(--bg-surface)',
          padding: '36px 32px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Access Restricted
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
          Your active college account profile (currently <strong>{role || 'unassigned'}</strong>) does not hold the institutional permissions required to view this portal area.
        </p>

        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            marginBottom: '24px',
          }}
        >
          If you are faculty, staff, or an academic administrator, please sign in with your staff institutional credentials or switch roles below.
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Go Back
          </Button>

          <Link to={role === 'admin' ? '/admin/dashboard' : role === 'staff' ? '/staff/dashboard' : '/student/dashboard'}>
            <Button variant="primary">
              <Home size={16} />
              Return to My Portal
            </Button>
          </Link>
        </div>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            QA Switcher for Local Evaluation:
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <Button size="sm" variant="ghost" onClick={() => { switchRole('student'); navigate('/student/dashboard'); }}>
              Student
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { switchRole('staff'); navigate('/staff/dashboard'); }}>
              Staff
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { switchRole('admin'); navigate('/admin/dashboard'); }}>
              Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
