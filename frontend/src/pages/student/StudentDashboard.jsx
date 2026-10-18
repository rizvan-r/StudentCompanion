import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  BookOpen,
  FileText,
  Bell,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { requestService } from '../../services/requestService';
import { getDocuments } from '../../services/api';
import { announcementService } from '../../services/announcementService';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export function StudentDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [reqRes, docRes, annRes] = await Promise.allSettled([
          requestService.getRequests(),
          getDocuments(),
          announcementService.getAnnouncements(),
        ]);

        if (isMounted) {
          if (reqRes.status === 'fulfilled') setRequests(reqRes.value || []);
          if (docRes.status === 'fulfilled') setDocuments(docRes.value || []);
          if (annRes.status === 'fulfilled') setAnnouncements(annRes.value || []);
        }
      } catch {
        // Safe fallbacks already handled
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const openRequestsCount = requests.filter(
    (r) => r.status === 'pending' || r.status === 'in_review' || r.status === 'submitted'
  ).length;

  const needsInfoCount = requests.filter((r) => r.status === 'needs_info').length;
  const readyDocsCount = documents.filter(
    (d) => d.processing_status === 'ready' || d.processing_status === 'completed' || d.status === 'ready' || d.status === 'completed'
  ).length;

  const recentRequests = requests.slice(0, 4);
  const recentAnnouncements = announcements.slice(0, 3);
  const recentDocs = documents.slice(0, 3);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Sleek, Compact Student Welcome Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #0d9488 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                fontSize: '0.6875rem',
                fontWeight: 600,
              }}
            >
              <Sparkles size={12} />
              Term 2026-27
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
              {profile?.department_name || 'Computer Science & Engineering'} • {profile?.semester || 'Semester 5'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Welcome back, {profile?.full_name || 'Alex Rivera'}
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', opacity: 0.88, maxWidth: '580px', lineHeight: 1.4 }}>
            Your campus workspace for Gemini AI revision, Central Drive notes, and department administrative requests.
          </p>
        </div>

        {/* Quick Header Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/student/study">
            <Button
              variant="primary"
              size="sm"
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-primary)',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              }}
            >
              <BrainCircuit size={15} />
              Ask AI Mentor
            </Button>
          </Link>
          <Link to="/student/requests/new">
            <Button
              variant="outline"
              size="sm"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Plus size={15} />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <StatCard
          title="Active Requests"
          value={openRequestsCount}
          description="In review or submitted"
          icon={FileText}
          accentColor="var(--color-primary)"
        />
        <StatCard
          title="Needs Student Info"
          value={needsInfoCount}
          description="Action required from you"
          icon={FileQuestion}
          accentColor={needsInfoCount > 0 ? 'var(--color-amber)' : 'var(--text-tertiary)'}
        />
        <StatCard
          title="Study Documents Ready"
          value={readyDocsCount}
          description="Indexed in Google Drive"
          icon={BookOpen}
          accentColor="var(--color-accent)"
        />
        <StatCard
          title="Campus Bulletins"
          value={announcements.length}
          description="Published this semester"
          icon={Bell}
          accentColor="var(--text-secondary)"
        />
      </div>

      {/* Campus Quick Actions - Streamlined Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
        <button
          onClick={() => navigate('/student/study')}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'rgba(67, 56, 202, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BrainCircuit size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Ask AI</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Syllabus Q&A</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/student/study/documents')}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Upload Study File</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Central Drive</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/student/requests/new?type=complaint')}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>File Complaint</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Grievance</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/student/requests/new?type=certificate')}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'rgba(217, 119, 6, 0.1)', color: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Request Certificate</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Bonafide, Transfer</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/student/requests/new?type=leave')}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Apply for Leave</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Attendance Leave</div>
          </div>
        </button>
      </div>

      {/* 3-Card Balanced Section: Recent Requests, Campus Bulletins, Central Drive Vault */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px', alignItems: 'stretch' }}>
        {/* Card 1: Recent Department Requests */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Recent Requests
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Track live progress and staff replies
              </p>
            </div>
            <Link to="/student/requests" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              View All →
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-tertiary)', margin: 'auto 0' }}>
              <FileText size={28} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>No requests submitted yet</div>
              <p style={{ fontSize: '0.75rem', margin: '2px 0 12px' }}>Need a certificate, attendance leave, or facilities help?</p>
              <Link to="/student/requests/new">
                <Button size="sm" variant="outline">Create Request</Button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => navigate(`/student/requests/${req.id}`)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>
                      {req.reference_number || req.id}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.department_name || req.category || 'Department Service'}</span>
                    <span style={{ flexShrink: 0, marginLeft: '6px' }}>{new Date(req.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Official Campus Bulletins */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Campus Bulletins
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Notices verified by Administration
              </p>
            </div>
            <Link to="/student/announcements" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              All Bulletins →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => navigate(`/student/announcements/${ann.id}`)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-app)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <Badge variant="teal">{ann.category || 'Academic'}</Badge>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                    {new Date(ann.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ann.title}
                </div>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {ann.summary || ann.content?.slice(0, 90) + '...'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Central Drive Vault */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Central Drive Vault
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Study materials indexed for Gemini RAG
              </p>
            </div>
            <Link to="/student/study/documents" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Vault →
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-tertiary)', margin: 'auto 0' }}>
              <BookOpen size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>No lecture files uploaded yet</div>
              <p style={{ fontSize: '0.75rem', margin: '2px 0 12px' }}>Upload notes to Central Drive for syllabus grounding.</p>
              <Link to="/student/study/documents">
                <Button size="sm" variant="outline">Upload to Drive</Button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/student/study/documents/${doc.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <BookOpen size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title || doc.filename}
                    </span>
                  </div>
                  <StatusBadge status={doc.processing_status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
