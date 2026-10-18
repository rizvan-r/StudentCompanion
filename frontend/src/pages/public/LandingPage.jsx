import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BrainCircuit,
  FileText,
  ShieldCheck,
  HardDrive,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4338ca 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <GraduationCap size={24} />
          </div>
          <div>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Student Companion AI
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary">Create College Account</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1100px', margin: '48px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', marginBottom: '16px' }}>
          <Badge variant="teal">Campus Companion Platform</Badge>
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}
        >
          Your campus day, made simpler.
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}
        >
          A unified, intelligent workspace connecting students with Google Gemini study tutoring grounded
          in college lecture notes, and streamlining institutional communication with faculty and administration.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/student/dashboard">
            <Button variant="primary" size="lg" icon={ArrowRight}>
              Explore Student Workspace
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Sign In to Your Portal
            </Button>
          </Link>
        </div>
      </section>

      {/* Core Pillars Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 64px', padding: '0 24px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* 1. Grounded Study AI */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BrainCircuit size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI Study Companion
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Powered by Google Gemini 2.0 with verifiable citations. Upload your syllabus and lecture slides to get
                personalized exam preparation, concept walk-throughs, and step-by-step code analysis.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>Exact page number & excerpt citations</span>
              </div>
            </div>
          </Card>

          {/* 2. Centralized College Drive Storage */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HardDrive size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Centralized Google Drive Vault
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Original study documents are safely preserved in a single college-controlled Google Drive vault.
                Text chunks are isolated via strict PostgreSQL Row-Level Security rules.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>Zero client credential exposure</span>
              </div>
            </div>
          </Card>

          {/* 3. Streamlined Campus Services */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Campus Management Workflows
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Submit facility grievances, on-duty or medical leave applications, and bonafide certificate requests
                directly to your department staff with real-time tracking and audit history.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>Role-based student, staff, & admin triage</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Security & Privacy Banner */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 48px', padding: '0 24px', width: '100%' }}>
        <div
          style={{
            padding: '24px 32px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Built on Enterprise Privacy Standards
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Supabase JWT session authentication, tenant isolation through PostgreSQL RLS, and prompt injection defense.
              </p>
            </div>
          </div>

          <Link to="/login">
            <Button variant="secondary">Go to Sign In</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: '24px 32px',
          fontSize: '0.8125rem',
          color: 'var(--text-tertiary)',
          textAlign: 'center',
        }}
      >
        <div>Student Companion AI — Campus Companion Foundation. All rights reserved.</div>
      </footer>
    </div>
  );
}
