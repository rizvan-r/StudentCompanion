import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Building2,
  FileText,
  Bell,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAdminData() {
      try {
        const [statsData, deptsData, logsData] = await Promise.all([
          adminService.getStats(),
          adminService.getDepartments(),
          adminService.getAuditLogs(),
        ]);

        if (isMounted) {
          setStats(statsData);
          setDepartments(deptsData || []);
          setAuditLogs(logsData || []);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAdminData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton count={4} height="80px" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Admin Executive Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="amber">College Administrator Portal</Badge>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Institutional Governance & Audit Scope
            </span>
          </div>

          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Campus Executive Overview
          </h1>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Logged in as <strong>{profile?.full_name || 'Prof. Marcus Vance'}</strong> ({profile?.designation || 'Dean of Academic Affairs'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/departments')}>
            <Building2 size={15} />
            Manage Departments
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/admin/users')}>
            <Users size={15} />
            User Directory
          </Button>
        </div>
      </div>

      {/* 4 Core Campus Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <StatCard
          title="Total Enrolled Students"
          value={stats?.totalStudents || 1420}
          description="Active student profiles"
          icon={Users}
          variant="indigo"
        />
        <StatCard
          title="Faculty & Staff"
          value={stats?.totalStaff || 86}
          description="Department advisors"
          icon={Building2}
          variant="teal"
        />
        <StatCard
          title="Active Departments"
          value={stats?.totalDepartments || 5}
          description="Accredited academic units"
          icon={Building2}
          variant="neutral"
        />
        <StatCard
          title="Total Open Requests"
          value={stats?.totalOpenRequests || 14}
          description="Across all campus queues"
          icon={FileText}
          variant="amber"
        />
      </div>

      {/* Two Column Grid: Department Rollups & Recent Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
        {/* Department Overview Table */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Department Enrollment Breakdown
            </h2>
            <Link to="/admin/departments" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              All Departments →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {departments.map((dept) => (
              <div
                key={dept.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {dept.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                    Code: {dept.code}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {dept.student_count}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Students</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Timeline */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Recent Governance Audit Trail
            </h2>
            <Link to="/admin/audit" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Full Audit Trail →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                    {log.timestamp}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  Actor: <strong>{log.actor}</strong> → Target: <em>{log.target}</em>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {log.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
