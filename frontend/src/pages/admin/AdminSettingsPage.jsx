import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Server,
  HardDrive,
  BrainCircuit,
  Database,
  Lock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export function AdminSettingsPage() {
  const { signOut, switchRole, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast('Signed out from Administrator session', 'info');
    navigate('/login');
  };

  const handleRoleSwitch = (targetRole) => {
    switchRole(targetRole);
    toast(`Switched view to ${targetRole}`, 'info');
    if (targetRole === 'admin') navigate('/admin/dashboard');
    else if (targetRole === 'staff') navigate('/staff/dashboard');
    else navigate('/student/dashboard');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '820px' }}>
      <PageHeader
        title="Institutional System Configuration"
        subtitle="Review backend microservices, Google Drive folder connections, and institutional security status."
        breadcrumbs={[
          { label: 'Admin Portal', to: '/admin/dashboard' },
          { label: 'System Settings' },
        ]}
      />

      {/* Cloud & Service Architecture Overview */}
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
          <Server size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Infrastructure & Integration Topology
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={18} style={{ color: 'var(--color-primary)' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>FastAPI Gateway</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Business operations, Drive uploads & Gemini broker</div>
              </div>
            </div>
            <Badge variant="teal">Online (Port 8000)</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardDrive size={18} style={{ color: 'var(--color-teal)' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Central Google Drive Vault</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Folder ID: 1WVZ2FcEqmPyZ6MVL0168nMwZniI4NWRF</div>
              </div>
            </div>
            <Badge variant="teal">Connected</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={18} style={{ color: 'var(--color-primary)' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Supabase PostgreSQL & Auth</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Strict Row-Level Security (RLS) & Profile Triggers</div>
              </div>
            </div>
            <Badge variant="teal">Enforced</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BrainCircuit size={18} style={{ color: 'var(--color-primary)' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Google Gemini API</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Model: gemini-2.5-flash (FastAPI Grounded Retrieval)</div>
              </div>
            </div>
            <Badge variant="teal">Active</Badge>
          </div>
        </div>
      </div>

      {/* Security Statement */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'rgba(67, 56, 202, 0.05)',
          border: '1px solid rgba(67, 56, 202, 0.15)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
        }}
      >
        <Shield size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-primary)' }}>Zero-Trust Frontend Architecture:</strong>{' '}
          In accordance with institutional guidelines, all service-account keys, Google OAuth client secrets, and Gemini API keys reside exclusively inside FastAPI environment variables. React communicates with backend services exclusively through authenticated Bearer sessions.
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
            Evaluation Portal Switcher
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
          Instantly jump across all three institutional portals to verify UI, navigation, and permissions:
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

      {/* Sign Out */}
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
            Administrator Session
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: 0 }}>
            Sign out of high-privilege governance access.
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
