import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Bell,
  Moon,
  Sun,
  Shield,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';

export function StudentSettingsPage() {
  const { signOut, switchRole, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [requestAlerts, setRequestAlerts] = useState(true);
  const [geminiSuggestions, setGeminiSuggestions] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    toast('Signed out from campus session', 'info');
    navigate('/login');
  };

  const handleRoleSwitch = (targetRole) => {
    switchRole(targetRole);
    toast(`Switched active portal view to ${targetRole}`, 'info');
    if (targetRole === 'admin') navigate('/admin/dashboard');
    else if (targetRole === 'staff') navigate('/staff/dashboard');
    else navigate('/student/dashboard');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '780px' }}>
      <PageHeader
        title="Account & System Settings"
        subtitle="Manage communication preferences, notification alerts, and active session security."
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'Settings' },
        ]}
      />

      {/* Notifications Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Communication & Notification Preferences
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Email Alerts for Request Status Updates
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Receive instant emails when department staff reviews or resolves your application
              </div>
            </div>
            <input
              type="checkbox"
              checked={requestAlerts}
              onChange={(e) => setRequestAlerts(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
          </label>

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Official Campus Bulletin Broadcasts
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Weekly digest of verified college notices and exam schedules
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
          </label>

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                AI Study Mentor Smart Suggestions
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Allow Gemini to suggest revision topics based on uploaded lecture slides
              </div>
            </div>
            <input
              type="checkbox"
              checked={geminiSuggestions}
              onChange={(e) => setGeminiSuggestions(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
          </label>
        </div>
      </div>

      {/* Local Sandbox Evaluation Switcher */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
          <Sparkles size={18} />
          <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
            Evaluation Role Switcher
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Switch portals instantaneously to test Department Staff triage inbox and Admin management workflows:
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant={role === 'student' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleRoleSwitch('student')}
          >
            Student Portal
          </Button>
          <Button
            variant={role === 'staff' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleRoleSwitch('staff')}
          >
            Faculty & Staff Portal
          </Button>
          <Button
            variant={role === 'admin' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleRoleSwitch('admin')}
          >
            Administrator Portal
          </Button>
        </div>
      </div>

      {/* Session Security and Sign Out */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Active Campus Session
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: 0 }}>
            Safely disconnect your institutional account and remove local tokens.
          </p>
        </div>

        <Button variant="outline" onClick={handleSignOut} style={{ color: 'var(--color-danger)' }}>
          <LogOut size={16} />
          Sign Out of Campus
        </Button>
      </div>
    </div>
  );
}
