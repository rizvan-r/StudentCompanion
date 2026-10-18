import React, { useState } from 'react';
import { Plus, Building } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function MyRequestsPage({ onOpenPreview }) {
  const [filter, setFilter] = useState('all');

  const sampleRequests = [
    {
      id: 'REQ-2024-048',
      title: 'Bonafide Certificate Request',
      category: 'Administrative Certificate',
      department: 'Dean Office / Registrar',
      status: 'In Review',
      badgeVariant: 'amber',
      date: 'Oct 17, 2026',
      description: 'Request for official bonafide letter for passport processing.',
      timeline: 'Department staff assigned (Mr. K. Sharma). Estimated readiness: Oct 20.',
    },
    {
      id: 'REQ-2024-041',
      title: 'Hostel Wi-Fi Signal Loss in Block C',
      category: 'Campus Facilities Grievance',
      department: 'IT Network Infrastructure',
      status: 'Assigned to IT',
      badgeVariant: 'teal',
      date: 'Oct 16, 2026',
      description: 'Frequent dropping on 3rd floor access points during study hours.',
      timeline: 'Technician inspection scheduled today at 4:00 PM.',
    },
    {
      id: 'REQ-2024-033',
      title: 'Medical Leave Application (2 Days)',
      category: 'Student Attendance & Leave',
      department: 'CSE Department Advisor',
      status: 'Approved',
      badgeVariant: 'emerald',
      date: 'Oct 10, 2026',
      description: 'Leave for viral fever with supporting clinic certificate.',
      timeline: 'Approved by Faculty Advisor on Oct 11. Attendance records updated.',
    },
  ];

  const filteredRequests =
    filter === 'all'
      ? sampleRequests
      : sampleRequests.filter((r) =>
          filter === 'pending' ? r.status !== 'Approved' : r.status === 'Approved'
        );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              My Campus Requests & Grievances
            </h2>
            <Badge variant="slate">Sample Data</Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Track bonafide requests, leave applications, and campus grievances
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() =>
            onOpenPreview(
              'Submit New Campus Request',
              'Phase 2/3 Multi-Role Pipeline',
              'The request creation form connects to Supabase PostgreSQL in Phase 2. When submitted, requests are validated against student session credentials and routed directly to Department Staff and College Administrators.'
            )
          }
        >
          New Request
        </Button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            border: '1px solid',
            borderColor: filter === 'all' ? 'var(--color-primary)' : 'var(--border-subtle)',
            backgroundColor: filter === 'all' ? 'var(--color-primary-light)' : 'var(--bg-surface)',
            color: filter === 'all' ? 'var(--color-primary)' : 'var(--text-secondary)',
          }}
        >
          All Requests ({sampleRequests.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            border: '1px solid',
            borderColor: filter === 'pending' ? 'var(--color-primary)' : 'var(--border-subtle)',
            backgroundColor: filter === 'pending' ? 'var(--color-primary-light)' : 'var(--bg-surface)',
            color: filter === 'pending' ? 'var(--color-primary)' : 'var(--text-secondary)',
          }}
        >
          Active / Pending (2)
        </button>
        <button
          onClick={() => setFilter('resolved')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            border: '1px solid',
            borderColor: filter === 'resolved' ? 'var(--color-primary)' : 'var(--border-subtle)',
            backgroundColor: filter === 'resolved' ? 'var(--color-primary-light)' : 'var(--bg-surface)',
            color: filter === 'resolved' ? 'var(--color-primary)' : 'var(--text-secondary)',
          }}
        >
          Resolved (1)
        </button>
      </div>

      {/* Requests List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredRequests.map((req) => (
          <div
            key={req.id}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '20px 24px',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                  }}
                >
                  {req.id}
                </span>
                <Badge variant={req.badgeVariant}>{req.status}</Badge>
                <Badge variant="slate">{req.category}</Badge>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{req.date}</span>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {req.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {req.description}
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={14} color="var(--color-primary)" />
                <span>Routed to: <strong>{req.department}</strong></span>
              </div>
              <span>{req.timeline}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
