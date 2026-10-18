import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div
      style={{
        padding: '36px 20px',
        textAlign: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.04)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: 'var(--color-danger)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AlertCircle size={36} style={{ marginBottom: '12px' }} />
      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{title}</h4>
      {message && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '16px', lineHeight: 1.5 }}>
          {message}
        </p>
      )}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} icon={RefreshCw} size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
