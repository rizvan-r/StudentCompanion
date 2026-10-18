import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(67, 56, 202, 0.1) 0%, rgba(13, 148, 136, 0.1) 100%)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <Compass size={40} />
      </div>

      <div
        style={{
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface)',
          padding: '36px 32px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1, marginBottom: '12px' }}>
          404
        </div>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          The requested campus route or resource does not exist or may have been relocated.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/">
            <Button variant="outline">
              <Home size={16} />
              Home Page
            </Button>
          </Link>
          <Link to="/student/dashboard">
            <Button variant="primary">
              Student Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
