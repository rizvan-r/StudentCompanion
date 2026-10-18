import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Role-based collapsible Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Viewport */}
      <div className="app-main">
        <Topbar onMenuToggle={() => setMobileOpen(true)} />

        <main className="app-content-container" role="main">
          <Outlet />
        </main>

        {/* Calm Academic Footer */}
        <footer
          style={{
            marginTop: 'auto',
            padding: '20px 32px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <strong>Student Companion AI</strong> — Campus Workspace (React + FastAPI + Supabase + Drive).
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Google Gemini Grounded</span>
            <span>•</span>
            <span>Centralized Drive Storage</span>
            <span>•</span>
            <span>Strict Tenant RLS</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
