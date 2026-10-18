import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function StudentRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadRequests() {
      try {
        const data = await requestService.getRequests();
        if (isMounted) setRequests(data || []);
      } catch {
        // Fallback sample data if backend endpoint is initializing
        if (isMounted) {
          setRequests([
            {
              id: 'req-001',
              reference_number: 'REQ-2024-048',
              title: 'Bonafide Certificate Request',
              request_type: 'certificate',
              category: 'Administrative Certificate',
              department_name: 'Dean Office / Registrar',
              status: 'in_review',
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              description: 'Request for official bonafide student letter for passport verification.',
            },
            {
              id: 'req-002',
              reference_number: 'REQ-2024-041',
              title: 'Hostel Wi-Fi Signal Loss in Block C',
              request_type: 'complaint',
              category: 'Campus Facilities Grievance',
              department_name: 'IT Network Infrastructure',
              status: 'in_progress',
              created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
              description: 'Frequent network dropping on 3rd floor access points during study hours.',
            },
            {
              id: 'req-003',
              reference_number: 'REQ-2024-033',
              title: 'Medical Leave Application (2 Days)',
              request_type: 'leave',
              category: 'Student Attendance & Leave',
              department_name: 'CSE Department Advisor',
              status: 'approved',
              created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
              description: 'Leave for acute viral fever with clinical attendance slip.',
            },
            {
              id: 'req-004',
              reference_number: 'REQ-2024-029',
              title: 'Lab Computer RAM Upgrade for ML Project',
              request_type: 'service',
              category: 'Lab Hardware Request',
              department_name: 'Computer Science & Engineering',
              status: 'needs_info',
              created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
              description: 'Need additional memory allocation for running local Gemma models.',
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

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reference_number || r.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.department_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : (r.status || '').toLowerCase() === statusFilter.toLowerCase();

    const normalizeType = (t) => {
      const lower = (t || '').toLowerCase();
      if (lower === 'grievance') return 'complaint';
      if (lower === 'facility') return 'service';
      return lower;
    };

    const matchesType =
      typeFilter === 'all' ? true : normalizeType(r.request_type) === normalizeType(typeFilter);

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <PageHeader
        title="Department Requests & Grievances"
        subtitle="Submit complaints, attendance leaves, certificates, and facility service requests with direct staff tracking."
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'My Requests' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/student/requests/new')}>
            <Plus size={15} />
            New Request
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          backgroundColor: 'var(--bg-surface)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by title, reference #, or department..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="in_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="needs_info">Needs Information</option>
            <option value="approved">Approved</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            <option value="all">All Categories</option>
            <option value="complaint">Campus Complaint</option>
            <option value="leave">Leave of Absence</option>
            <option value="certificate">Official Certificate</option>
            <option value="service">Service Request</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <LoadingSkeleton count={4} height="70px" />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Requests Match Filter"
          description="Try clearing your search query or submit a new department application."
          actionText="Submit New Request"
          onAction={() => navigate('/student/requests/new')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => navigate(`/student/requests/${req.id}`)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: req.status === 'needs_info' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(67, 56, 202, 0.08)',
                    color: req.status === 'needs_info' ? 'var(--color-warning)' : 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={16} />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.03em' }}>
                      {req.reference_number || req.id}
                    </span>
                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                      {req.request_type || req.category || 'General'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                    {req.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                    <span>Dept: <strong>{req.department_name || 'Academic Office'}</strong></span>
                    <span>•</span>
                    <span>Submitted: {new Date(req.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <StatusBadge status={req.status} />
                <ArrowRight size={15} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
