import React from 'react';

export function FormField({ label, error, helperText, required = false, children, id, htmlFor }) {
  const targetId = htmlFor || id;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          htmlFor={targetId}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{label}</span>
          {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      {children}

      {error ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '2px' }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
