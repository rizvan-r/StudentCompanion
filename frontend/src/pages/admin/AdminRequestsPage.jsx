import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Building,
  User,
  ArrowRight,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function AdminRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadAll() {
      try {
        const data = await requestService.getRequests();
        if (isMounted) setRequests(data || []);
      } catch {
        if (isMounted) {
          setRequests([
            {
              id: 'req-1',
              reference_number: 'REQ-2024-048',
              title: 'Bonafide Certificate Request',
              student_name: 'Alex Rivera',
              department_name: 'Dean Office / Registrar',
              status: 'in_review',
              category: 'Certificate',
              created_at: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: 'req-2',
              reference_number: 'REQ-2024-051',
              title: 'Medical Leave Application for 3 Days',
              student_name: 'Elena Rostova',
              department_name: 'Computer Science & Engineering',
              status: 'submitted',
              category: 'Leave',
              created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
            },
            {
              id: 'req-3',
              reference_number: 'REQ-2024-041',
              title: 'Hostel Wi-Fi Signal Loss in Block C',
              student_name: 'Jordan Miller',
              department_name: 'IT Network Infrastructure',
              status: 'in_progress',
              category: 'Complaint',
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
            {
              id: 'req-4',
              reference_number: 'REQ-2024-029',
              title: 'Lab Computer RAM Upgrade for Capstone',
              student_name: 'Liam Chen',
              department_name: 'Computer Science & Engineering',
              status: 'needs_info',
              category: 'Service',
              created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            },
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAll();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = requests.filter((r) => {
    const matchesSearch =
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reference_number || r.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === 'all' ? true : (r.department_name || '').toLowerCase().includes(deptFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : (r.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="College-Wide Request Governance"
        subtitle="Institution-wide visibility into student complaints, leaves, certificates, and department turnaround times."
        breadcrumbs={[
          { label: 'Admin Portal', to: '/admin/dashboard' },
          { label: 'All Requests' },
        ]}
      />

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
            placeholder="Search by student, reference, or title..."
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Dean Office">Dean Office</option>
            <option value="IT Network">IT Network</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="in_review">In Review</option>
            <option value="needs_info">Needs Information</option>
            <option value="in_progress">In Progress</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="80px" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((req) => (
            <div
              key={req.id}
              onClick={() => navigate(`/staff/requests/${req.id}`)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '18px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(217, 119, 6, 0.08)',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={20} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {req.reference_number || req.id}
                    </span>
                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Student: {req.student_name || 'Enrolled Student'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {req.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <span>Department: <strong>{req.department_name || 'Dean Office'}</strong></span>
                    <span>•</span>
                    <span>Received: {new Date(req.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <StatusBadge status={req.status} />
                <ArrowRight size={18} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
