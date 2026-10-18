import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Clock,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Send,
  Lock,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { staffService } from '../../services/staffService';
import { requestService } from '../../services/requestService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

export function StaffRequestDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [studentReplyText, setStudentReplyText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await requestService.getRequestById(requestId);
        if (isMounted) setRequest(data);
      } catch {
        // Fallback demo record
        if (isMounted) {
          setRequest({
            id: requestId,
            reference_number: `REQ-2024-${requestId.slice(-3) || '048'}`,
            title: 'Bonafide Certificate Request',
            student_name: 'Alex Rivera',
            student_id: 'CS-2023-042',
            student_email: 'alex.student@college.edu',
            department_name: 'Computer Science & Engineering',
            semester: 'Semester 5',
            status: 'in_review',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            description:
              'Official bonafide student letter required for passport renewal processing. Please issue on official institutional letterhead with registrar seal.',
            comments: [
              {
                id: 'c1',
                sender_name: 'Dr. Sarah Jenkins',
                sender_role: 'Staff Advisor',
                text: 'Your enrollment records have been verified. The certificate is currently being drafted by the registrar desk.',
                timestamp: 'Yesterday at 3:45 PM',
                is_staff: true,
              },
            ],
            internal_notes: [
              {
                id: 'in1',
                author: 'Dr. Sarah Jenkins (Staff Advisor)',
                text: 'Checked university database: Student has no outstanding tuition dues. Approved for certificate issuance.',
                timestamp: 'Yesterday at 3:40 PM',
              },
            ],
            timeline: [
              {
                id: 't1',
                status: 'submitted',
                title: 'Application Submitted',
                timestamp: 'Oct 17, 2026, 10:30 AM',
                actor: 'Alex Rivera (Student)',
              },
              {
                id: 't2',
                status: 'in_review',
                title: 'Assigned to Staff Advisor',
                timestamp: 'Oct 17, 2026, 2:15 PM',
                actor: 'Dr. Sarah Jenkins',
              },
            ],
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [requestId]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await staffService.updateStatus(requestId, newStatus);
      setRequest((prev) => ({ ...prev, status: newStatus }));
      toast(`Request status updated to ${newStatus}`, 'success');
    } catch {
      toast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendStudentReply = async (e) => {
    e.preventDefault();
    if (!studentReplyText.trim()) return;

    try {
      await requestService.addReply(requestId, studentReplyText);
      const newComment = {
        id: `c-${Date.now()}`,
        sender_name: profile?.full_name || 'Dr. Sarah Jenkins',
        sender_role: 'Staff Advisor',
        text: studentReplyText,
        timestamp: 'Just now',
        is_staff: true,
      };

      setRequest((prev) => ({
        ...prev,
        comments: [...(prev?.comments || []), newComment],
      }));

      setStudentReplyText('');
      toast('Student-visible reply dispatched', 'success');
    } catch {
      toast('Failed to deliver reply', 'error');
    }
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;

    try {
      await staffService.addInternalNote(requestId, internalNoteText);
      const newNote = {
        id: `in-${Date.now()}`,
        author: `${profile?.full_name || 'Dr. Sarah Jenkins'} (Staff Advisor)`,
        text: internalNoteText,
        timestamp: 'Just now',
      };

      setRequest((prev) => ({
        ...prev,
        internal_notes: [...(prev?.internal_notes || []), newNote],
      }));

      setInternalNoteText('');
      toast('Internal staff note recorded (hidden from student)', 'info');
    } catch {
      toast('Failed to record internal note', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton count={4} height="60px" />
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px' }} />
        <h2>Request Not Found</h2>
        <Link to="/staff/requests">
          <Button variant="outline">Back to Staff Inbox</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={request.title}
        subtitle={`Tracking reference: ${request.reference_number || request.id} • Department Staff Review`}
        breadcrumbs={[
          { label: 'Staff Portal', to: '/staff/dashboard' },
          { label: 'Inbox', to: '/staff/requests' },
          { label: request.reference_number || request.id },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StatusBadge status={request.status} />
            <Link to="/staff/requests">
              <Button variant="outline" size="sm">
                <ArrowLeft size={14} />
                Back to Inbox
              </Button>
            </Link>
          </div>
        }
      />

      {/* Staff Status Action Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '16px 24px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Update Request Status:
        </span>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            disabled={updatingStatus || request.status === 'in_review'}
            onClick={() => handleStatusChange('in_review')}
          >
            <Clock size={14} />
            Mark In Review
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={updatingStatus || request.status === 'needs_info'}
            onClick={() => handleStatusChange('needs_info')}
            style={{ color: 'var(--color-warning)' }}
          >
            <HelpCircle size={14} />
            Request Student Info
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={updatingStatus || request.status === 'approved'}
            onClick={() => handleStatusChange('approved')}
            style={{ backgroundColor: 'var(--color-success)' }}
          >
            <CheckCircle2 size={14} />
            Approve & Resolve
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={updatingStatus || request.status === 'rejected'}
            onClick={() => handleStatusChange('rejected')}
            style={{ color: 'var(--color-danger)' }}
          >
            <XCircle size={14} />
            Reject
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Left Column: Student Details & Application Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Student Profile Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Applicant Details
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Student Name:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{request.student_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Student Roll No:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {request.student_id || 'CS-2023-042'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Institutional Email:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {request.student_email || 'alex.student@college.edu'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Semester Standing:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {request.semester || 'Semester 5'}
                </span>
              </div>
            </div>
          </div>

          {/* Statement */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Application Statement
            </h3>
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-app)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
              }}
            >
              {request.description}
            </div>
          </div>

          {/* Separate Internal Staff Notes Section (SECURE - HIDDEN FROM STUDENT) */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} style={{ color: '#b45309' }} />
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Internal Staff Notes
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(217, 119, 6, 0.1)',
                  color: '#b45309',
                }}
              >
                Confidential — Staff Only
              </span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
              Notes added here are strictly protected by server policy and never shown to the student.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(request.internal_notes || []).map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(217, 119, 6, 0.05)',
                    border: '1px solid rgba(217, 119, 6, 0.15)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                    <span>{note.author}</span>
                    <span>{note.timestamp}</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{note.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddInternalNote} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={internalNoteText}
                onChange={(e) => setInternalNoteText(e.target.value)}
                placeholder="Record confidential staff advisor note..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  fontSize: '0.8125rem',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="outline" size="sm" disabled={!internalNoteText.trim()}>
                  Record Note
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Student-Visible Communication Thread */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: 'fit-content',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Student Communication Thread
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
            Official messages exchanged with the student applicant.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '180px' }}>
            {(request.comments || []).map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: c.is_staff ? 'rgba(67, 56, 202, 0.05)' : 'var(--bg-app)',
                  border: `1px solid ${c.is_staff ? 'rgba(67, 56, 202, 0.15)' : 'var(--border-subtle)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c.is_staff ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                    {c.sender_name} ({c.sender_role})
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                    {c.timestamp}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {c.text}
                </div>
              </div>
            ))}
          </div>

          {/* Reply Composer */}
          <form onSubmit={handleSendStudentReply} style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              value={studentReplyText}
              onChange={(e) => setStudentReplyText(e.target.value)}
              placeholder="Send official update or information inquiry to student..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" size="sm" disabled={!studentReplyText.trim()}>
                <Send size={14} />
                Send Student Reply
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
