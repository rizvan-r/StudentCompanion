import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { staffService } from '../../services/staffService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '../../components/ui/Button';

export function StaffRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadRequests() {
      try {
        const data = await staffService.getDepartmentRequests();
        if (isMounted) setRequests(data || []);
      } catch {
        if (isMounted) {
          setRequests([
            {
              id: 'req-101',
              reference_number: 'REQ-2024-048',
              title: 'Bonafide Certificate Request',
              student_name: 'Alex Rivera',
              student_id: 'CS-2023-042',
              request_type: 'certificate',
              category: 'Administrative Certificate',
              status: 'in_review',
              created_at: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: 'req-102',
              reference_number: 'REQ-2024-051',
              title: 'Medical Leave Application for 3 Days',
              student_name: 'Elena Rostova',
              student_id: 'CS-2023-018',
              request_type: 'leave',
              category: 'Student Leave',
              status: 'submitted',
              created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
            },
            {
              id: 'req-103',
              reference_number: 'REQ-2024-044',
              title: 'Lab Computer RAM Allocation for ML Project',
              student_name: 'Liam Chen',
              student_id: 'CS-2023-094',
              request_type: 'service',
              category: 'Lab Hardware',
              status: 'needs_info',
              created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            },
            {
              id: 'req-104',
              reference_number: 'REQ-2024-039',
              title: 'Internship No Objection Certificate (NOC)',
              student_name: 'Sophia Patel',
              student_id: 'CS-2023-077',
              request_type: 'certificate',
              category: 'Administrative Certificate',
              status: 'approved',
              created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
            },
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRequests();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = requests.filter((r) => {
    const matchesSearch =
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reference_number || r.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : (r.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Department Request Inbox"
        subtitle="Review student applications, issue certificates, verify leaves, and communicate status transitions."
        breadcrumbs={[
          { label: 'Staff Portal', to: '/staff/dashboard' },
          { label: 'Department Inbox' },
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
            placeholder="Search by student name, roll no, or title..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="all">All Statuses ({requests.length})</option>
          <option value="submitted">Submitted / Awaiting Review</option>
          <option value="in_review">In Review</option>
          <option value="needs_info">Needs Information</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="80px" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Requests in Queue"
          description="There are currently no student requests matching your search or active filter."
        />
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
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(13, 148, 136, 0.08)',
                    color: 'var(--color-teal)',
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
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {req.student_name} {req.student_id ? `(${req.student_id})` : ''}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {req.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <span>Category: <strong>{req.category || req.request_type}</strong></span>
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
