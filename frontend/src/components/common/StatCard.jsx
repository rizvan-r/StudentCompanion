import React from 'react';
import { Card } from '../ui/Card';

export function StatCard({ title, value, icon: Icon, description, trend, accentColor = 'var(--color-primary)' }) {
  return (
    <Card style={{ padding: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.15 }}>
            {value}
          </div>
          {description && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {description}
            </div>
          )}
          {trend && (
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: trend.positive ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '2px' }}>
              {trend.label}
            </div>
          )}
        </div>

        {Icon && (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              flexShrink: 0,
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>
    </Card>
  );
}
