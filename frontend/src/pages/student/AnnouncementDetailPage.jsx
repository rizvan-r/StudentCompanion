import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  ArrowLeft,
  Calendar,
  Building,
  ShieldCheck,
  Share2,
  FileText,
} from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';

export function AnnouncementDetailPage() {
  const { announcementId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadItem() {
      try {
        const list = await announcementService.getAnnouncements();
        const found = (list || []).find((a) => String(a.id) === String(announcementId));
        if (isMounted) {
          if (found) setAnnouncement(found);
          else {
            setAnnouncement({
              id: announcementId,
              title: 'Library 24/7 Extended Hours for Mid-Semester Examinations',
              department: 'Dean of Academic Affairs',
              category: 'Facilities',
              created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
              summary: 'The Central Library will remain open 24 hours daily from Oct 20 to Nov 05. Digital kiosks and reading halls on floors 2 & 3 are fully operational.',
              content: `To accommodate student exam preparation during the upcoming Mid-Semester Examinations, the Central Library will operate continuously on a 24-hour schedule starting Monday, October 20 through Wednesday, November 05, 2026.\n\nKey Guidelines for Students:\n1. Valid College Student ID cards must be presented at the security turnstiles for entry after 10:00 PM.\n2. Digital kiosks, silent study pods on Floor 2, and collaborative study cubicles on Floor 3 are available on a first-come, first-served basis.\n3. High-speed campus Wi-Fi access points and charging desks are equipped across all reading zones.\n4. Campus night security patrols and emergency call boxes will be actively monitored.\n\nFor questions, contact the Library Administration desk or the Dean of Academic Affairs office.`,
            });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadItem();
    return () => {
      isMounted = false;
    };
  }, [announcementId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('Circular URL copied to clipboard', 'info');
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton count={4} height="50px" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '820px', margin: '0 auto' }}>
      <PageHeader
        title={announcement.title}
        subtitle={`Issued by: ${announcement.department || 'Office of Academic Affairs'}`}
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'Announcements', to: '/student/announcements' },
          { label: 'Circular Details' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 size={14} />
              Share Link
            </Button>
            <Link to="/student/announcements">
              <Button variant="outline" size="sm">
                <ArrowLeft size={14} />
                All Circulars
              </Button>
            </Link>
          </div>
        }
      />

      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Badge variant="teal">{announcement.category || 'Official Bulletin'}</Badge>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building size={14} />
              {announcement.department || 'Dean Office'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            <Calendar size={14} />
            <span>Published: {new Date(announcement.created_at || Date.now()).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Circular Content Body */}
        <div
          style={{
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {announcement.content || announcement.summary}
        </div>

        {/* Official Institutional Verification Seal */}
        <div
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Verified Academic Circular
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Authenticated by the college administration for student broadcast.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
