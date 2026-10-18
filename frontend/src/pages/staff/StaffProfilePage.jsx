import React, { useState } from 'react';
import {
  User,
  Building,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  Award,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { FormField } from '../../components/common/FormField';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function StaffProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || 'Dr. Sarah Jenkins');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '+1 (555) 349-1109');
  const [officeLocation, setOfficeLocation] = useState(profile?.office || 'CSE Faculty Wing, Room 412');
  const [officeHours, setOfficeHours] = useState(profile?.office_hours || 'Mon/Wed 2:00 PM - 4:00 PM');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        phone: phoneNumber,
        office: officeLocation,
        office_hours: officeHours,
      });
      toast('Faculty profile updated successfully', 'success');
    } catch {
      toast('Failed to save profile changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '820px' }}>
      <PageHeader
        title="Faculty & Staff Profile"
        subtitle="Review institutional staff credentials and configure student office consultation hours."
        breadcrumbs={[
          { label: 'Staff Portal', to: '/staff/dashboard' },
          { label: 'Profile' },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left: Verified Faculty Credentials */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0d9488 0%, #4338ca 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 800,
              }}
            >
              {(profile?.full_name || 'SJ')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                {profile?.full_name || 'Dr. Sarah Jenkins'}
              </h2>
              <Badge variant="teal">Verified Faculty & Staff</Badge>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Staff ID:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {profile?.staff_id_number || 'FAC-CSE-109'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Department:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile?.department_name || 'Computer Science & Engineering'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Designation:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile?.designation || 'Associate Professor & Student Advisor'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Institutional Email:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile?.email || 'sarah.faculty@college.edu'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Office Hours & Contact Form */}
        <form
          onSubmit={handleSave}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Student Advising Contact Information
          </h3>

          <FormField label="Display Name / Honorific" htmlFor="faculty-name">
            <input
              id="faculty-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
            />
          </FormField>

          <FormField label="Department Office Venue" htmlFor="faculty-office">
            <input
              id="faculty-office"
              type="text"
              value={officeLocation}
              onChange={(e) => setOfficeLocation(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
            />
          </FormField>

          <FormField label="Student Office Consultation Hours" htmlFor="faculty-hours">
            <input
              id="faculty-hours"
              type="text"
              value={officeHours}
              onChange={(e) => setOfficeHours(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
            />
          </FormField>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Office Details'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
