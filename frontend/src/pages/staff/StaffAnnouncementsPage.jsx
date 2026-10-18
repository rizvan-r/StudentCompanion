import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Building,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { PageHeader } from '../../components/common/PageHeader';
import { FormField } from '../../components/common/FormField';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

export function StaffAnnouncementsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New Notice Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await announcementService.getAnnouncements();
        if (isMounted) setAnnouncements(data || []);
      } catch {
        if (isMounted) {
          setAnnouncements([
            {
              id: 'st-ann-1',
              title: 'CSE Mid-Semester Lab Examination Evaluation Slots',
              department: 'Computer Science & Engineering',
              category: 'Academic',
              status: 'published',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              summary: 'Lab evaluations for Data Structures (CS301) scheduled Oct 22 to 24 in Computing Lab 3.',
            },
            {
              id: 'st-ann-2',
              title: 'Faculty Office Hours Adjustment for Week 8',
              department: 'Computer Science & Engineering',
              category: 'Department Notices',
              status: 'published',
              created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
              summary: 'Advisor office hours shifted to 3:00 PM - 5:00 PM on Tuesday and Thursday.',
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

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    setSubmitting(true);
    try {
      const payload = {
        title,
        category,
        summary: summary || content.slice(0, 120),
        content,
        department: profile?.department_name || 'Computer Science & Engineering',
        status: 'published',
      };

      const res = await announcementService.createAnnouncement(payload);
      setAnnouncements((prev) => [res || { id: `ann-${Date.now()}`, ...payload }, ...prev]);
      toast('Department announcement published successfully', 'success');

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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Department Notices & Announcements"
        subtitle={`Publish and manage official notices for students in ${profile?.department_name || 'Computer Science & Engineering'}.`}
        breadcrumbs={[
          { label: 'Staff Portal', to: '/staff/dashboard' },
          { label: 'Department Notices' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Publish Department Notice
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
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="teal">{item.category || 'Academic'}</Badge>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building size={12} />
                  {item.department || 'Department Staff'}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {new Date(item.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>

            <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px 0' }}>
              {item.title}
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {item.summary || item.content}
            </p>
          </div>
        ))}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publish Department Announcement"
        subtitle="This circular will be broadcast to all enrolled department students."
      >
        <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <FormField label="Notice Title" required htmlFor="notice-title">
            <input
              id="notice-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule for Capstone Phase 1 Presentation"
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
            />
          </FormField>

          <FormField label="Category" required htmlFor="notice-cat">
            <select
              id="notice-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
            >
              <option value="Academic">Academic Notice</option>
              <option value="Exams">Examinations & Schedules</option>
              <option value="Facilities">Lab & Department Facilities</option>
              <option value="Advising">Student Advising & Office Hours</option>
            </select>
          </FormField>

          <FormField label="Brief Summary" htmlFor="notice-summary">
            <input
              id="notice-summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One line abstract for dashboard previews..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
            />
          </FormField>

          <FormField label="Full Circular Body" required htmlFor="notice-content">
            <textarea
              id="notice-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete instructions, venue details, or deadlines..."
              rows={5}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Broadcasting...' : 'Publish to Students'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
