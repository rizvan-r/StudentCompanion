import React from 'react';

/**
 * Reusable Card component for academic overview, pulse, and feature widgets
 */
export function Card({
  children,
  className = '',
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  headerBorder = false,
  style = {},
  ...props
}) {
  const hasHeader = Boolean(title || Icon || badge || action);

  return (
    <div
      className={`ui-card ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        ...style,
      }}
      {...props}
    >
      {hasHeader && (
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            borderBottom: headerBorder ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icon && (
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} />
              </div>
            )}
            <div>
              {title && (
                <h3
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: '2px',
                    lineHeight: 1.3,
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {badge}
            {action}
          </div>
        </div>
      )}

      <div
        style={{
          padding: hasHeader ? '0 16px 14px 16px' : '14px 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}
