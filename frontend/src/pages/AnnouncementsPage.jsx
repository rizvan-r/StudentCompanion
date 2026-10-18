import React, { useState } from 'react';
import { Badge } from '../components/ui/Badge';

export function AnnouncementsPage({ searchQuery = '' }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const notices = [
    {
      id: 1,
      title: 'Library 24/7 Extended Hours for Mid-Semester Exams',
      department: 'Dean of Academic Affairs',
      date: 'October 18, 2026',
      category: 'Facilities',
      summary: 'Central Library will remain open 24 hours daily from Oct 20 to Nov 05. Digital kiosks and reading halls on floors 2 & 3 are fully operational.',
    },
    {
      id: 2,
      title: 'Annual Tech Symposium 2026: Call for Student Project Submissions',
      department: 'Computer Science & Engineering',
      date: 'October 17, 2026',
      category: 'Academic',
      summary: 'Submit abstracts for hardware and software projects by Oct 30. Cash prizes and industry mentorship for top 3 innovative prototypes.',
    },
    {
      id: 3,
      title: 'Semester Exam Hall Ticket Distribution & Verification Guidelines',
      department: 'Office of the Controller of Examinations',
      date: 'October 15, 2026',
      category: 'Exams',
      summary: 'Students must verify exam course codes with faculty advisors before Oct 25. Digital hall tickets will be issued through the student portal.',
    },
    {
      id: 4,
      title: 'Campus Shuttle Bus Schedule Updates for Winter Term',
      department: 'Campus Transport Services',
      date: 'October 12, 2026',
      category: 'Campus Life',
      summary: 'Two additional morning shuttle services added from North Metro station starting 7:45 AM. Valid college ID required.',
    },
  ];

  const categories = ['All', 'Academic', 'Exams', 'Facilities', 'Campus Life'];

  const filtered = notices.filter((n) => {
    const matchesCat = activeCategory === 'All' || n.category === activeCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Campus Announcements & Circulars
            </h2>
            <Badge variant="slate">Sample Data</Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Official notices from College Administration and Academic Departments
          </p>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeCategory === c ? 'var(--color-primary)' : 'var(--border-subtle)',
                backgroundColor: activeCategory === c ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                color: activeCategory === c ? 'var(--color-primary)' : 'var(--text-secondary)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
            No announcements found matching current filter or search criteria.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '20px 24px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant="teal">{item.category}</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.date}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {item.department}
                </span>
              </div>

              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {item.title}
              </h3>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                {item.summary}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
