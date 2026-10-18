import React from 'react';
import { Activity, Flame, ShieldCheck, Radio } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function CampusPulse() {
  const pulseMetrics = [
    {
      id: 'focus-streak',
      icon: Flame,
      iconColor: '#f97316',
      bgLight: '#fff7ed',
      title: 'Daily Study Rhythm',
      value: '4 Days Active',
      subtext: 'Goal: 3 hrs • 2.5 hrs today',
      status: 'On track',
      statusVariant: 'emerald',
    },
    {
      id: 'desk-status',
      icon: ShieldCheck,
      iconColor: '#0d9488',
      bgLight: '#f0fdfa',
      title: 'Campus Helpdesk Pulse',
      value: '< 24h Avg. Turnaround',
      subtext: 'IT & Facilities responding normally',
      status: 'Healthy',
      statusVariant: 'teal',
    },
    {
      id: 'campus-activity',
      icon: Radio,
      iconColor: '#6366f1',
      bgLight: '#eef2ff',
      title: 'Campus Activity Stream',
      value: 'Auditorium Talk @ 3 PM',
      subtext: 'Next: Robotics Club hackathon reg.',
      status: 'Live Bulletin',
      statusVariant: 'indigo',
    },
  ];

  return (
    <div
      className="campus-pulse-card"
      style={{
        marginTop: '28px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Campus Pulse
              </h2>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#0d9488',
                  display: 'inline-block',
                }}
                className="status-pulse"
                aria-hidden="true"
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Live student rhythm, operational health & academic updates
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="slate">Signature Feature Preview</Badge>
          <Badge variant="teal">Demo Data</Badge>
        </div>
      </div>

      {/* Grid of Pulse Items */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {pulseMetrics.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'transform 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: item.bgLight,
                  color: item.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {item.title}
                  </span>
                  <Badge variant={item.statusVariant}>{item.status}</Badge>
                </div>

                <div
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.value}
                </div>

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: '2px',
                  }}
                >
                  {item.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '14px',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
        }}
      >
        <span>
          Campus Pulse connects to college webhooks and real-time Supabase channels in Phase 2.
        </span>
        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
          Modular Architecture Ready
        </span>
      </div>
    </div>
  );
}
