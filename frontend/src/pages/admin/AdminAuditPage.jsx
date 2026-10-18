import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Database,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/ui/Badge';

export function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        const data = await adminService.getAuditLogs();
        if (isMounted) setLogs(data || []);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' ? true : l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const actionVariants = {
    ROLE_PROVISION: 'amber',
    DRIVE_BACKUP: 'teal',
    STATUS_UPDATE: 'indigo',
    ANNOUNCEMENT_PUBLISH: 'teal',
    DEPARTMENT_CREATE: 'indigo',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Institutional Security & Audit Trail"
        subtitle="Chronological audit records of all role changes, request status updates, and storage vault operations."
        breadcrumbs={[
          { label: 'Admin Portal', to: '/admin/dashboard' },
          { label: 'Audit Timeline' },
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
            placeholder="Search by actor, target entity, or description..."
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="all">All Audit Actions</option>
          <option value="ROLE_PROVISION">Role Provisions</option>
          <option value="STATUS_UPDATE">Status Transitions</option>
          <option value="DRIVE_BACKUP">Drive Vault Checksums</option>
          <option value="ANNOUNCEMENT_PUBLISH">Circular Broadcasts</option>
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="70px" />
      ) : (
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
                  <th style={{ padding: '14px 20px' }}>Action</th>
                  <th style={{ padding: '14px 20px' }}>Actor</th>
                  <th style={{ padding: '14px 20px' }}>Target Record</th>
                  <th style={{ padding: '14px 20px' }}>Details</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <Badge variant={actionVariants[log.action] || 'neutral'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.actor}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                      {log.target}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {log.details}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      {log.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
