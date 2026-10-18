import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField } from '../../components/common/FormField';
import { useToast } from '../../hooks/useToast';

export function AdminDepartmentsPage() {
  const { toast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New Department Form
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDepts() {
      try {
        const data = await adminService.getDepartments();
        if (isMounted) setDepartments(data || []);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDepts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!deptCode || !deptName) return;

    setSubmitting(true);
    try {
      const created = await adminService.createDepartment({
        code: deptCode.toUpperCase(),
        name: deptName,
      });

      setDepartments((prev) => [...prev, created]);
      toast(`Department ${deptCode.toUpperCase()} registered`, 'success');
      setDeptCode('');
      setDeptName('');
      setModalOpen(false);
    } catch {
      toast('Failed to create department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = (deptId) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, active: !d.active } : d))
    );
    toast('Department active status updated', 'info');
  };

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Academic Departments"
        subtitle="Manage college divisions, faculty affiliations, and department-level routing codes."
        breadcrumbs={[
          { label: 'Admin Portal', to: '/admin/dashboard' },
          { label: 'Departments' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Create Department
          </Button>
        }
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ flex: 1, maxWidth: '380px' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search departments by name or code..."
          />
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          Total Departments: <strong>{departments.length}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {filtered.map((dept) => (
          <div
            key={dept.id}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Badge variant="indigo">{dept.code}</Badge>
                <button
                  onClick={() => handleToggleActive(dept.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: dept.active ? 'var(--color-success)' : 'var(--color-danger)',
                    fontWeight: 600,
                  }}
                >
                  {dept.active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <span>{dept.active ? 'Active' : 'Inactive'}</span>
                </button>
              </div>

              <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                {dept.name}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} />
                {dept.student_count || 0} Students
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                System ID: {dept.id}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Department Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Academic Department"
        subtitle="Register a new academic department or administrative unit in the college database."
      >
        <form onSubmit={handleCreateDept} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <FormField label="Department Code" required htmlFor="dept-code" hint="Unique institutional code (e.g. AI-DS, CHEM, ARCH)">
            <input
              id="dept-code"
              type="text"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              placeholder="e.g. AIDS"
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', textTransform: 'uppercase' }}
            />
          </FormField>

          <FormField label="Full Department Name" required htmlFor="dept-name">
            <input
              id="dept-name"
              type="text"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              placeholder="e.g. Artificial Intelligence & Data Science"
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Register Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
