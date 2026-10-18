import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  BrainCircuit,
  BookOpen,
  History,
  FileText,
  Bell,
  User,
  Settings,
  Users,
  Building2,
  ShieldCheck,
  CheckSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { role, profile, signOut, switchRole } = useAuth();

  const studentNav = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/study', label: 'AI Study Mentor', icon: BrainCircuit, badge: 'Gemini' },
    { to: '/student/study/documents', label: 'Drive Documents', icon: BookOpen, badge: 'Drive' },
    { to: '/student/study/history', label: 'Study History', icon: History },
    { to: '/student/requests', label: 'My Requests', icon: FileText },
    { to: '/student/announcements', label: 'Announcements', icon: Bell },
    { to: '/student/profile', label: 'Profile', icon: User },
    { to: '/student/settings', label: 'Settings', icon: Settings },
  ];

  const staffNav = [
    { to: '/staff/dashboard', label: 'Staff Dashboard', icon: LayoutDashboard },
    { to: '/staff/requests', label: 'Department Inbox', icon: FileText, badge: 'Queue' },
    { to: '/staff/announcements', label: 'Department Notices', icon: Bell },
    { to: '/staff/profile', label: 'Staff Profile', icon: User },
  ];

  const adminNav = [
    { to: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/requests', label: 'All Requests', icon: FileText },
    { to: '/admin/announcements', label: 'Campus Bulletins', icon: Bell },
    { to: '/admin/audit', label: 'Audit Timeline', icon: ShieldCheck },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
  ];

  const navItems = role === 'admin' ? adminNav : role === 'staff' ? staffNav : studentNav;

  const roleLabels = {
    student: 'Student Portal',
    staff: 'Faculty & Staff Portal',
    admin: 'Administrator Portal',
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-sidebar)',
          color: 'var(--text-on-dark)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 45,
          transition: 'width 0.2s ease, transform 0.25s ease',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed ? '12px 8px' : '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            height: 'var(--header-height)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4338ca 0%, #0d9488 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(67, 56, 202, 0.3)',
                flexShrink: 0,
              }}
            >
              <GraduationCap size={18} />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  Student Companion
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--color-accent)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {roleLabels[role]}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="collapse-btn"
            style={{
              display: mobileOpen ? 'none' : 'flex',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-on-dark-muted)',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: 'var(--radius-xs)',
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation List */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: collapsed ? '8px 0' : '7px 10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? '#ffffff' : 'var(--text-on-dark-muted)',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                })}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Role Switcher & User Profile */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Quick Portal Switcher for Testing/Demo */}
          {!collapsed && (
            <div style={{ padding: '6px 8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-on-dark-muted)', marginBottom: '4px', fontWeight: 600 }}>
                PORTAL VIEW:
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                {['student', 'staff', 'admin'].map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    style={{
                      flex: 1,
                      padding: '3px 0',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: role === r ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* User Signout Button */}
          <button
            onClick={() => signOut()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '10px 0' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-on-dark-muted)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
            title="Sign out"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
