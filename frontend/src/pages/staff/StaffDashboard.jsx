import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Bell,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { staffService } from '../../services/staffService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function StaffDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await staffService.getDepartmentRequests();
        if (isMounted) setRequests(data || []);
      } catch {
        // Fallback for demo
        if (isMounted) {
          setRequests([
            {
              id: 'req-101',
              reference_number: 'REQ-2024-048',
              title: 'Bonafide Certificate Request',
              student_name: 'Alex Rivera (CS-2023-042)',
              category: 'Certificate',
              status: 'in_review',
              created_at: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: 'req-102',
              reference_number: 'REQ-2024-051',
              title: 'Medical Leave Application for 3 Days',
              student_name: 'Elena Rostova (CS-2023-018)',
              category: 'Leave',
              status: 'submitted',
              created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
            },
            {
              id: 'req-103',
              reference_number: 'REQ-2024-044',
              title: 'Lab Computer RAM Allocation for ML Project',
              student_name: 'Liam Chen (CS-2023-094)',
              category: 'Service',
              status: 'needs_info',
              created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            },
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const pendingReview = requests.filter((r) => r.status === 'submitted' || r.status === 'pending').length;
  const inReview = requests.filter((r) => r.status === 'in_review' || r.status === 'in_progress').length;
  const needsInfo = requests.filter((r) => r.status === 'needs_info').length;
  const resolved = requests.filter((r) => r.status === 'resolved' || r.status === 'approved').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Department Staff Scope Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Badge variant="teal">Department Staff Portal</Badge>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              {profile?.designation || 'Faculty & Student Advisor'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Welcome, {profile?.full_name || 'Dr. Sarah Jenkins'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Department Scope: <strong>{profile?.department_name || 'Computer Science & Engineering'}</strong> • Staff ID: {profile?.staff_id_number || 'FAC-CSE-109'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={() => navigate('/staff/announcements')}>
            <Bell size={16} />
            Post Notice
          </Button>
          <Button variant="primary" onClick={() => navigate('/staff/requests')}>
            <FileText size={16} />
            Review Queue ({requests.length})
          </Button>
        </div>
      </div>

      {/* 4 Triage Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Awaiting Initial Review"
          value={pendingReview}
          description="New student submissions"
          icon={AlertCircle}
          variant={pendingReview > 0 ? 'amber' : 'neutral'}
        />
        <StatCard
          title="In Active Review"
          value={inReview}
          description="Under departmental verification"
          icon={Clock}
          variant="indigo"
        />
        <StatCard
          title="Awaiting Student Info"
          value={needsInfo}
          description="Inquiry sent to applicant"
          icon={HelpCircle}
          variant="teal"
        />
        <StatCard
          title="Resolved This Month"
          value={resolved + 14}
          description="Certificates & leaves completed"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Triage Request Queue */}
      <div
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Department Triage Inbox
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Student requests assigned to your department requiring advisor review
            </p>
          </div>
          <Link to="/staff/requests" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Full Inbox →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {requests.slice(0, 5).map((req) => (
            <div
              key={req.id}
              onClick={() => navigate(`/staff/requests/${req.id}`)}
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(67, 56, 202, 0.08)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {req.reference_number || req.id}
                    </span>
                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {req.student_name || 'Enrolled Student'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {req.title}
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
      </div>
    </div>
  );
}
