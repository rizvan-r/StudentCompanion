import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Bell,
  FileText,
  Calendar,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function AcademicOverview({ searchQuery = '', onOpenPreview, onNavigateTab }) {
  // Sample Today's Study Tasks
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Review Discrete Mathematics Lecture 8 notes',
      course: 'MATH 202',
      duration: '45 mins',
      completed: false,
    },
    {
      id: 2,
      title: 'Implement Binary Search Tree assignment code',
      course: 'CS 210',
      duration: '60 mins',
      completed: true,
    },
    {
      id: 3,
      title: 'Read Operating Systems Chapter 4 (Process Scheduling)',
      course: 'CS 301',
      duration: '30 mins',
      completed: false,
    },
  ]);

  // Sample Upcoming Deadlines
  const deadlines = [
    {
      id: 1,
      title: 'Operating Systems Lab Submission',
      course: 'CS 301',
      dueDate: 'Oct 20, 11:59 PM',
      urgency: 'rose',
      daysLeft: 'In 2 days',
    },
    {
      id: 2,
      title: 'Computer Networks Project Proposal',
      course: 'CS 320',
      dueDate: 'Oct 24, 5:00 PM',
      urgency: 'amber',
      daysLeft: 'In 6 days',
    },
    {
      id: 3,
      title: 'Database Normalization Problem Set',
      course: 'CS 250',
      dueDate: 'Oct 28, 11:59 PM',
      urgency: 'indigo',
      daysLeft: 'In 10 days',
    },
  ];

  // Sample Recent Announcements
  const announcements = [
    {
      id: 1,
      title: 'Library 24/7 Extended Hours for Mid-Semester Exams',
      department: 'Dean of Academic Affairs',
      date: 'Today',
      category: 'Campus Facilities',
    },
    {
      id: 2,
      title: 'Annual Tech Symposium: Call for Student Project Submissions',
      department: 'Computer Science & Engineering',
      date: 'Yesterday',
      category: 'Department Event',
    },
    {
      id: 3,
      title: 'Semester Fee Payment Deadline Extension Notification',
      department: 'Administration & Finance',
      date: 'Oct 15',
      category: 'Administrative',
    },
  ];

  // Sample Management Requests
  const requests = [
    {
      id: 'REQ-2024-048',
      title: 'Bonafide Certificate',
      purpose: 'Passport Application',
      status: 'In Review',
      badgeVariant: 'amber',
      updated: 'Yesterday, 4:15 PM',
    },
    {
      id: 'REQ-2024-041',
      title: 'Hostel Wi-Fi Connectivity Issue',
      purpose: 'Block C - 3rd Floor Router',
      status: 'Assigned to IT',
      badgeVariant: 'teal',
      updated: 'Oct 16, 11:00 AM',
    },
  ];

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filter tasks and announcements by search query if user typed
  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(normalizedQuery) ||
      t.course.toLowerCase().includes(normalizedQuery)
  );

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(normalizedQuery) ||
      a.department.toLowerCase().includes(normalizedQuery) ||
      a.category.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
      }}
    >
      {/* 1. Today's Study Tasks */}
      <Card
        title="Today's Study Tasks"
        subtitle="Daily academic focus checklist"
        icon={CheckSquare}
        badge={<Badge variant="slate">Sample Data</Badge>}
        headerBorder
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTasks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem',
              }}
            >
              No study tasks match "{searchQuery}"
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                role="button"
                tabIndex={0}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: task.completed ? 'var(--bg-muted)' : 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ marginTop: '2px', color: task.completed ? 'var(--color-emerald)' : 'var(--text-tertiary)' }}>
                  {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </div>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {task.course}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} /> {task.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {tasks.filter((t) => t.completed).length} of {tasks.length} tasks completed
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab && onNavigateTab('study-planner')}
          >
            Study Planner →
          </Button>
        </div>
      </Card>

      {/* 2. Upcoming Deadlines */}
      <Card
        title="Upcoming Deadlines"
        subtitle="Assignments, exams & deliverables"
        icon={Calendar}
        badge={<Badge variant="slate">Sample Data</Badge>}
        headerBorder
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {deadlines.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
              }}
            >
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.title}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    {item.course}
                  </span>
                  <span>•</span>
                  <span>Due: {item.dueDate}</span>
                </div>
              </div>

              <Badge variant={item.urgency}>{item.daysLeft}</Badge>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onOpenPreview(
                'Academic Deadlines Sync',
                'Phase 2/3 Feature Preview',
                'In future phases, deadlines will sync with your college LMS syllabus and department calendars via Supabase PostgreSQL.'
              )
            }
          >
            View Full Calendar →
          </Button>
        </div>
      </Card>

      {/* 3. Recent Announcements */}
      <Card
        title="Recent Announcements"
        subtitle="Official campus & department notices"
        icon={Bell}
        badge={<Badge variant="slate">Sample Data</Badge>}
        headerBorder
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredAnnouncements.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem',
              }}
            >
              No announcements match "{searchQuery}"
            </div>
          ) : (
            filteredAnnouncements.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigateTab && onNavigateTab('announcements')}
                role="button"
                tabIndex={0}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <Badge variant="teal">{item.category}</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.date}</span>
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: '6px',
                  }}
                >
                  {item.title}
                </p>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  From: {item.department}
                </p>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab && onNavigateTab('announcements')}
          >
            All Notices →
          </Button>
        </div>
      </Card>

      {/* 4. Pending Management Requests */}
      <Card
        title="Management Requests"
        subtitle="Submitted administrative & grievance tickets"
        icon={FileText}
        badge={<Badge variant="slate">Sample Data</Badge>}
        headerBorder
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {req.id}
                </span>
                <Badge variant={req.badgeVariant}>{req.status}</Badge>
              </div>

              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {req.type}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>{req.purpose}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{req.updated}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            2 sample tickets active
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab && onNavigateTab('my-requests')}
          >
            Track All Requests →
          </Button>
        </div>
      </Card>
    </div>
  );
}
