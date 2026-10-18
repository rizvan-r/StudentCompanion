import React from 'react';

export function LoadingSkeleton({ lines = 3, height = '20px', style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            width: i === lines - 1 && lines > 1 ? '70%' : '100%',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: 'var(--radius-sm)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ height: '24px', width: '40%', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }} />
      <LoadingSkeleton lines={3} />
    </div>
  );
}
