import React from 'react';
import {
  BrainCircuit,
  MessageSquareWarning,
  FileCheck2,
  BellRing,
  ArrowRight,
  HardDrive,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export function QuickActions({ onNavigateTab, onOpenPreview, onFocusAIInput }) {
  const actions = [
    {
      id: 'study-documents',
      title: 'Central Drive Study Vault',
      description: 'Upload course notes & syllabi to college Drive with AI text indexing.',
      icon: HardDrive,
      badge: 'Drive Vault',
      badgeVariant: 'indigo',
      accentColor: '#0284c7',
      bgLight: '#e0f2fe',
      action: () => onNavigateTab && onNavigateTab('documents'),
      actionText: 'Open Library',
    },
    {
      id: 'ask-ai',
      title: 'Ask AI Study Tutor',
      description: 'Get concept explanations, note summaries, and study plans with citations.',
      icon: BrainCircuit,
      badge: 'Gemini 2.0',
      badgeVariant: 'indigo',
      accentColor: 'var(--color-primary)',
      bgLight: 'var(--color-primary-light)',
      action: () => {
        if (onFocusAIInput) {
          onFocusAIInput();
        } else if (onNavigateTab) {
          onNavigateTab('ai-companion');
        }
      },
      actionText: 'Open Assistant',
    },
    {
      id: 'submit-complaint',
      title: 'Submit a Complaint',
      description: 'Report department, hostel, or campus facility issues confidentially.',
      icon: MessageSquareWarning,
      badge: 'Phase 2 Preview',
      badgeVariant: 'amber',
      accentColor: '#d97706',
      bgLight: '#fef3c7',
      action: () =>
        onOpenPreview(
          'Grievance & Issue Submission',
          'Role-Based Campus Routing',
          'In Phase 2 and 3, students can submit academic and campus facility complaints. Tickets will automatically route to Department Staff and College Administrators with real-time resolution timelines and notifications.'
        ),
      actionText: 'View Flow Preview',
    },
    {
      id: 'request-leave-cert',
      title: 'Request Leave / Certificate',
      description: 'Apply for on-duty leave, medical leave, or bonafide certificates.',
      icon: FileCheck2,
      badge: 'Phase 3 Preview',
      badgeVariant: 'emerald',
      accentColor: '#059669',
      bgLight: '#ecfdf5',
      action: () =>
        onOpenPreview(
          'Academic Leave & Certificate Requests',
          'Official Document Pipeline',
          'This module will generate digitally verifiable certificates (Bonafide, Transfer, Conduct) and route student on-duty/medical leave requests directly to faculty advisors for approval.'
        ),
      actionText: 'View Flow Preview',
    },
    {
      id: 'view-announcements',
      title: 'View Announcements',
      description: 'Browse campus circulars, event notifications, and exam schedules.',
      icon: BellRing,
      badge: 'Live Board',
      badgeVariant: 'teal',
      accentColor: '#0d9488',
      bgLight: '#f0fdfa',
      action: () => onNavigateTab && onNavigateTab('announcements'),
      actionText: 'Browse Notices',
    },
  ];

  return (
    <div style={{ marginTop: '28px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Quick Campus Actions
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            One-touch shortcuts for academic assistance and college administration
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              onClick={act.action}
              role="button"
              tabIndex={0}
              className="quick-action-card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: act.bgLight,
                      color: act.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <Badge variant={act.badgeVariant}>{act.badge}</Badge>
                </div>

                <h3
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  {act.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                  }}
                >
                  {act.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: act.accentColor,
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                }}
              >
                <span>{act.actionText}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
