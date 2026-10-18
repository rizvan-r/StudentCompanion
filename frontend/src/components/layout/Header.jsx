import React, { useState, useEffect } from 'react';
import { Menu, Search, Sparkles } from 'lucide-react';
import { checkBackendHealth } from '../../services/api';
import { Badge } from '../ui/Badge';

export function Header({
  onMenuToggle,
  searchQuery,
  onSearchChange,
  onOpenPreview,
}) {
  const [backendState, setBackendState] = useState({
    status: 'checking',
    message: 'Checking backend...',
  });

  const [currentDateFormatted] = useState(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  });

  useEffect(() => {
    let isMounted = true;

    async function verifyBackend() {
      const result = await checkBackendHealth();
      if (isMounted) {
        if (result.isOnline) {
          setBackendState({
            status: 'online',
            message: 'FastAPI: Online (Port 8000)',
          });
        } else {
          setBackendState({
            status: 'offline',
            message: 'FastAPI: Disconnected',
          });
        }
      }
    }

    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header
      className="app-header"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left: Hamburger & Greetings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onMenuToggle}
            aria-label="Open navigation sidebar"
            className="mobile-menu-btn"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <Menu size={20} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Your campus day, made simpler.
              </h1>
              <Badge variant="teal" className="desktop-only-badge">
                <Sparkles size={12} />
                <span>Phase 1 Workspace</span>
              </Badge>
            </div>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Academic study companion & college communication platform •{' '}
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                {currentDateFormatted}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Search bar & Backend Health indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search Input */}
          <div
            className="search-input-container"
            style={{
              position: 'relative',
              width: '260px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Filter tasks, notices..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Filter tasks and announcements"
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-muted)',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
            />
          </div>

          {/* Backend Status indicator */}
          <div
            onClick={() =>
              onOpenPreview(
                'System Architecture Status',
                'Phase 1 Service Readiness',
                `Backend health endpoint status: ${
                  backendState.status === 'online'
                    ? 'Successfully communicating with FastAPI on http://localhost:8000/health (CORS active).'
                    : 'Backend service offline or unreachable. Ensure uvicorn is running on port 8000.'
                } Gemini and Supabase services are configured via environment variables and will be integrated during Phase 2.`
              )
            }
            title="Click to view backend service status"
            role="button"
            tabIndex={0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor:
                backendState.status === 'online'
                  ? 'var(--color-emerald-light)'
                  : 'var(--color-rose-light)',
              border: `1px solid ${
                backendState.status === 'online'
                  ? 'rgba(5, 150, 105, 0.25)'
                  : 'rgba(225, 29, 72, 0.25)'
              }`,
              color:
                backendState.status === 'online'
                  ? 'var(--color-emerald)'
                  : 'var(--color-rose)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              className={backendState.status === 'online' ? 'status-pulse' : ''}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor:
                  backendState.status === 'online' ? '#10b981' : '#f43f5e',
                display: 'inline-block',
              }}
            />
            <span>{backendState.message}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
