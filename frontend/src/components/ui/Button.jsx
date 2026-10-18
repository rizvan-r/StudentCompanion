import React from 'react';

/**
 * Reusable Button component with accessible focus, loading, and preview states
 * @param {'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'} variant
 * @param {'sm' | 'md' | 'lg'} size
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '0.8125rem', height: '32px' },
    md: { padding: '9px 16px', fontSize: '0.875rem', height: '40px' },
    lg: { padding: '12px 20px', fontSize: '1rem', height: '48px' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#ffffff',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-xs)',
    },
    accent: {
      backgroundColor: 'var(--color-accent)',
      color: '#ffffff',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-xs)',
    },
    secondary: {
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
      border: '1px solid rgba(49, 46, 129, 0.12)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-subtle)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      className={`ui-btn ui-btn-${variant} ${className}`}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.15s ease',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...currentSize,
        ...currentVariant,
        ...style,
      }}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 18} />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 18} />}
    </button>
  );
}
