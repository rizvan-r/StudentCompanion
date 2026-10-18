import React from 'react';

/**
 * Reusable Badge component for tags, status indicators, and category pills
 * @param {'indigo' | 'teal' | 'amber' | 'emerald' | 'rose' | 'slate'} variant
 */
export function Badge({ children, variant = 'indigo', className = '', ...props }) {
  const variantStyles = {
    indigo: {
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
      border: '1px solid rgba(49, 46, 129, 0.15)',
    },
    teal: {
      backgroundColor: 'var(--color-accent-light)',
      color: 'var(--color-accent)',
      border: '1px solid rgba(13, 148, 136, 0.2)',
    },
    amber: {
      backgroundColor: 'var(--color-amber-light)',
      color: 'var(--color-amber)',
      border: '1px solid rgba(217, 119, 6, 0.2)',
    },
    emerald: {
      backgroundColor: 'var(--color-emerald-light)',
      color: 'var(--color-emerald)',
      border: '1px solid rgba(5, 150, 105, 0.2)',
    },
    rose: {
      backgroundColor: 'var(--color-rose-light)',
      color: 'var(--color-rose)',
      border: '1px solid rgba(225, 29, 72, 0.2)',
    },
    slate: {
      backgroundColor: 'var(--bg-muted)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-subtle)',
    },
  };

  const currentStyle = variantStyles[variant] || variantStyles.indigo;

  return (
    <span
      className={`ui-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...currentStyle,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
