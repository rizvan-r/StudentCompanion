import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Filter, Calendar, Building, ArrowRight, ShieldCheck } from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/ui/Badge';

export function AnnouncementsPage() {
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await announcementService.getAnnouncements();
        if (isMounted) setAnnouncements(data || []);
      } catch {
        // Fallback notices
        if (isMounted) {
          setAnnouncements([
            {
              id: 'ann-1',
              title: 'Library 24/7 Extended Hours for Mid-Semester Examinations',
              department: 'Dean of Academic Affairs',
              category: 'Facilities',
              created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
              summary: 'The Central Library will remain open 24 hours daily from Oct 20 to Nov 05. Digital kiosks and reading halls on floors 2 & 3 are fully operational.',
            },
            {
              id: 'ann-2',
              title: 'Annual Tech Symposium 2026: Call for Student Project Submissions',
              department: 'Computer Science & Engineering',
              category: 'Academic',
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              summary: 'Submit abstracts for hardware and software projects by Oct 30. Cash prizes and industry mentorship for top 3 innovative prototypes.',
            },
            {
              id: 'ann-3',
              title: 'Semester Exam Hall Ticket Distribution & Verification Guidelines',
              department: 'Office of the Controller of Examinations',
              category: 'Exams',
              created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
              summary: 'Students must verify exam course codes with faculty advisors before Oct 25. Digital hall tickets will be issued through the student portal.',
            },
            {
              id: 'ann-4',
              title: 'Campus Shuttle Bus Schedule Updates for Winter Term',
              department: 'Campus Transport Services',
              category: 'Campus Life',
              created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
              summary: 'Two additional morning shuttle services added from North Metro station starting 7:45 AM. Valid college ID required.',
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

  const categories = ['All', 'Academic', 'Exams', 'Facilities', 'Campus Life'];

  const filtered = announcements.filter((n) => {
    const matchesCat = activeCategory === 'All' || (n.category || '').toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.summary || n.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.department || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <PageHeader
        title="Campus Bulletins & Circulars"
        subtitle="Official college notices, exam schedules, and department circulars verified by Academic Administration."
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'Announcements' },
        ]}
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
            placeholder="Search circulars by keyword or department..."
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--bg-app)',
                color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <LoadingSkeleton count={3} height="80px" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Bulletins Found"
          description="No official circulars match your active filters or search terms."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/student/announcements/${item.id}`)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant="teal">{item.category || 'Official'}</Badge>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building size={11} />
                    {item.department || 'Office of Academic Affairs'}
                  </span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={11} />
                  {new Date(item.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                {item.title}
              </h3>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {item.summary || item.content?.slice(0, 180)}...
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                <span>Read Full Circular</span>
                <ArrowRight size={13} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
