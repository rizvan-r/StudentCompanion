import React, { useState, useEffect } from 'react';
import { Menu, Sparkles, HardDrive, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { checkBackendHealth } from '../../services/api';
import { Badge } from '../ui/Badge';

export function Topbar({ onMenuToggle }) {
  const { profile, role } = useAuth();
  const [backendState, setBackendState] = useState({
    status: 'checking',
    message: 'Checking backend...',
  });

  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      const res = await checkBackendHealth();
      if (isMounted) {
        if (res.isOnline) {
          setBackendState({ status: 'online', message: 'FastAPI: Online (Port 8000)' });
        } else {
          setBackendState({ status: 'offline', message: 'FastAPI: Disconnected' });
        }
      }
    }
    verify();
    const interval = setInterval(verify, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const roleBadgeVariants = {
    student: 'indigo',
    staff: 'teal',
    admin: 'amber',
  };

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '8px 20px',
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onMenuToggle}
          className="mobile-menu-btn"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            padding: '4px',
            cursor: 'pointer',
          }}
          aria-label="Open mobile navigation"
        >
          <Menu size={20} />
        </button>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
          {currentDate}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Live Backend Connection Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: backendState.status === 'online' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${backendState.status === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: backendState.status === 'online' ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: backendState.status === 'online' ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          />
          <span>{backendState.status === 'online' ? 'API Online' : 'API Offline'}</span>
        </div>

        {/* Central Drive Vault status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
          <HardDrive size={13} color="var(--color-accent)" />
          <span className="desktop-only-badge">Drive Active</span>
        </div>

        {/* Role Badge */}
        <Badge variant={roleBadgeVariants[role] || 'neutral'}>
          {role.toUpperCase()}
        </Badge>

        {/* User Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px', borderLeft: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
          </div>
          <div className="desktop-only-badge" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {profile?.full_name || 'User'}
          </div>
        </div>
      </div>
    </header>
  );
}
