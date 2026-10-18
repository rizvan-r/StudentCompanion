import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Building,
  Hash,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  ShieldCheck,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { FormField } from '../../components/common/FormField';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function StudentProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || 'Alex Rivera');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '+1 (555) 019-2834');
  const [bio, setBio] = useState(profile?.bio || 'Undergraduate student interested in Distributed Systems & AI.');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        phone: phoneNumber,
        bio: bio,
      });
      toast('Profile preferences updated successfully', 'success');
    } catch {
      toast('Could not save profile changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '820px' }}>
      <PageHeader
        title="Student Academic Profile"
        subtitle="Manage your campus directory contact info and review verified institutional enrollment standing."
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'Profile' },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Card: Verified Institutional Credentials (Read-only for safety) */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4338ca 0%, #0d9488 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 800,
              }}
            >
              {(profile?.full_name || 'AR')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                {profile?.full_name || 'Alex Rivera'}
              </h2>
              <Badge variant="indigo">Verified Student</Badge>
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: '0.75rem',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShieldCheck size={16} />
            <span>Institutional Student Record verified by Registrar</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Student ID / Roll No:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {profile?.student_id_number || 'CS-2023-042'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Department:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile?.department_name || 'Computer Science & Engineering'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Program & Course:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile?.course_name || 'B.Tech Computer Science'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Standing:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile?.semester || 'Semester 5'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Institutional Email:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile?.email || 'alex.student@college.edu'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Editable Contact Preferences */}
        <form
          onSubmit={handleSaveProfile}
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
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Editable Contact Information
          </h3>

          <FormField label="Display Name" htmlFor="display-name">
            <input
              id="display-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            />
          </FormField>

          <FormField label="Contact Mobile / Phone" htmlFor="phone-number" hint="Used for emergency SMS notifications">
            <input
              id="phone-number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            />
          </FormField>

          <FormField label="Student Bio / Research Interest" htmlFor="student-bio">
            <textarea
              id="student-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                resize: 'vertical',
              }}
            />
          </FormField>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
