import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Building,
  Calendar,
  Send,
  Trash2,
  Edit2,
  Archive,
  CheckCircle2,
} from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { PageHeader } from '../../components/common/PageHeader';
import { FormField } from '../../components/common/FormField';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';

export function AdminAnnouncementsPage() {
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic Administration');
  const [department, setDepartment] = useState('Office of the Dean');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await announcementService.getAnnouncements();
        if (isMounted) setAnnouncements(data || []);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    setSubmitting(true);
    try {
      const payload = {
        title,
        category,
        department,
        summary: summary || content.slice(0, 140),
        content,
        status: 'published',
      };

      const res = await announcementService.createAnnouncement(payload);
      setAnnouncements((prev) => [res || { id: `adm-ann-${Date.now()}`, ...payload }, ...prev]);
      toast('Campus announcement broadcasted', 'success');

      setTitle('');
      setSummary('');
      setContent('');
      setModalOpen(false);
    } catch {
      toast('Failed to publish announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = (id) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast('Announcement archived', 'info');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Campus Bulletins & Broadcasts"
        subtitle="Publish college-wide official circulars, exam schedules, and institutional policy notices."
        breadcrumbs={[
          { label: 'Admin Portal', to: '/admin/dashboard' },
          { label: 'Campus Bulletins' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Publish Campus Notice
          </Button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {announcements.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="amber">{item.category || 'Official'}</Badge>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building size={12} />
                  {item.department || 'Office of Academic Affairs'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {new Date(item.created_at || Date.now()).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleArchive(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Archive size={14} />
                  Archive
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>
              {item.title}
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {item.summary || item.content}
            </p>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Broadcast Campus-Wide Announcement"
        subtitle="This circular will appear across student and faculty dashboards."
      >
        <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <FormField label="Announcement Title" required htmlFor="adm-ann-title">
            <input
              id="adm-ann-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Campus Holiday Schedule for Diwali & Mid-Term Recess"
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Issuing Department" required htmlFor="adm-ann-dept">
              <select
                id="adm-ann-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
              >
                <option value="Office of the Dean">Office of the Dean</option>
                <option value="Controller of Examinations">Controller of Examinations</option>
                <option value="Campus Facilities & Transport">Campus Facilities & Transport</option>
                <option value="Dean of Student Affairs">Dean of Student Affairs</option>
              </select>
            </FormField>

            <FormField label="Category" required htmlFor="adm-ann-cat">
              <select
                id="adm-ann-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
              >
                <option value="Academic Administration">Academic Administration</option>
                <option value="Exams">Exams & Hall Tickets</option>
                <option value="Facilities">Campus Infrastructure</option>
                <option value="Campus Life">Campus Life & Events</option>
              </select>
            </FormField>
          </div>

          <FormField label="One-Line Summary" htmlFor="adm-ann-summary">
            <input
              id="adm-ann-summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary for notification cards..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
            />
          </FormField>

          <FormField label="Full Notice Body" required htmlFor="adm-ann-content">
            <textarea
              id="adm-ann-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete circular details..."
              rows={5}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Broadcasting...' : 'Publish to College'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
