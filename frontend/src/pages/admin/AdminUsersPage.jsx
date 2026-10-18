import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  Building,
  Mail,
  Edit2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';

export function AdminUsersPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState(null);
  const [targetRole, setTargetRole] = useState('student');
  const [submittingRole, setSubmittingRole] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        const data = await adminService.getUsers();
        if (isMounted) setUsers(data || []);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenRoleModal = (user) => {
    setSelectedUserForRoleChange(user);
    setTargetRole(user.role);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!selectedUserForRoleChange) return;

    setSubmittingRole(true);
    try {
      await adminService.updateUserRole(selectedUserForRoleChange.id, targetRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserForRoleChange.id ? { ...u, role: targetRole } : u))
      );
      toast(`User role updated to ${targetRole}`, 'success');
      setSelectedUserForRoleChange(null);
    } catch {
      toast('Failed to update user role', 'error');
    } finally {
      setSubmittingRole(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleVariants = {
    student: 'indigo',
    staff: 'teal',
    admin: 'amber',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="College User Directory & Role Governance"
        subtitle="Manage student, faculty advisor, and administrative staff accounts with controlled role provisioning."
        breadcrumbs={[
          { label: 'Admin Portal', to: '/admin/dashboard' },
          { label: 'User Directory' },
        ]}
      />

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search users by name, email, or department..."
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="all">All Roles ({users.length})</option>
          <option value="student">Students</option>
          <option value="staff">Faculty & Staff</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* User Directory Table / Cards */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px' }}>User</th>
                <th style={{ padding: '14px 20px' }}>Role</th>
                <th style={{ padding: '14px 20px' }}>Department</th>
                <th style={{ padding: '14px 20px' }}>Account Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(67, 56, 202, 0.1)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        {user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <Badge variant={roleVariants[user.role] || 'neutral'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    {user.department || 'Not Assigned'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                      Active
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <Button variant="outline" size="sm" onClick={() => handleOpenRoleModal(user)}>
                      <Edit2 size={12} />
                      Modify Role
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Provisioning Modal */}
      <Modal
        isOpen={Boolean(selectedUserForRoleChange)}
        onClose={() => setSelectedUserForRoleChange(null)}
        title="Modify Institutional User Role"
        subtitle={`Provisioning access rights for ${selectedUserForRoleChange?.full_name} (${selectedUserForRoleChange?.email})`}
      >
        <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              fontSize: '0.8125rem',
              color: '#b45309',
            }}
          >
            Warning: Granting Staff or Administrator permissions enables access to confidential student records and department request triage.
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              Select System Role:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { r: 'student', label: 'Student', desc: 'Syllabus AI mentor, personal request submissions & Drive uploads' },
                { r: 'staff', label: 'Faculty / Department Staff', desc: 'Department inbox review, internal staff notes & certificate approvals' },
                { r: 'admin', label: 'College Administrator', desc: 'Institution-wide audit logs, department registration & user provisioning' },
              ].map((opt) => (
                <label
                  key={opt.r}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${targetRole === opt.r ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: targetRole === opt.r ? 'rgba(67, 56, 202, 0.05)' : 'var(--bg-app)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.r}
                    checked={targetRole === opt.r}
                    onChange={(e) => setTargetRole(e.target.value)}
                    style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button type="button" variant="outline" onClick={() => setSelectedUserForRoleChange(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submittingRole}>
              {submittingRole ? 'Updating...' : 'Authorize Role Change'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
