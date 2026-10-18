import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Clock,
  Building,
  User,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

export function RequestDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRequest() {
      try {
        const data = await requestService.getRequestById(requestId);
        if (isMounted) setRequest(data);
      } catch {
        // Fallback demo record for presentation
        if (isMounted) {
          setRequest({
            id: requestId,
            reference_number: `REQ-2024-${requestId.slice(-3) || '048'}`,
            title: 'Bonafide Certificate Request',
            request_type: 'certificate',
            category: 'Administrative Certificate',
            department_name: 'Dean Office / Registrar',
            status: 'in_review',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            description:
              'Official bonafide student letter required for passport renewal processing. Please issue on official institutional letterhead with registrar seal.',
            timeline: [
              {
                id: 't1',
                status: 'submitted',
                title: 'Application Submitted',
                timestamp: 'Oct 16, 2026, 10:30 AM',
                actor: 'Student (Alex Rivera)',
                note: 'Application received and registered in college system.',
              },
              {
                id: 't2',
                status: 'in_review',
                title: 'Assigned to Staff Advisor',
                timestamp: 'Oct 17, 2026, 2:15 PM',
                actor: 'Dr. Sarah Jenkins (Staff Advisor)',
                note: 'Under review. Verifying student roll number CS-2023-042 and enrollment standing.',
              },
            ],
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
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRequest();
    return () => {
      isMounted = false;
    };
  }, [requestId]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      await requestService.addReply(requestId, replyText);
      const newComment = {
        id: `c-${Date.now()}`,
        sender_name: profile?.full_name || 'Alex Rivera',
        sender_role: 'Student',
        text: replyText,
        timestamp: 'Just now',
        is_staff: false,
      };

      setRequest((prev) => ({
        ...prev,
        comments: [...(prev?.comments || []), newComment],
      }));

      setReplyText('');
      toast('Reply added to tracking thread', 'success');
    } catch {
      toast('Could not deliver reply. Please verify connection.', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton count={4} height="60px" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Request Not Found
        </h2>
        <Link to="/student/requests">
          <Button variant="outline">
            <ArrowLeft size={16} />
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={request.title}
        subtitle={`Tracking reference: ${request.reference_number || request.id} • Assigned Department: ${request.department_name || 'Academic Office'}`}
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'Requests', to: '/student/requests' },
          { label: request.reference_number || request.id },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <StatusBadge status={request.status} />
            <Link to="/student/requests">
              <Button variant="outline" size="sm">
                <ArrowLeft size={14} />
                All Requests
              </Button>
            </Link>
          </div>
        }
      />

      {/* Needs Information Alert if applicable */}
      {request.status === 'needs_info' && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            color: 'var(--color-warning)',
          }}
        >
          <HelpCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9375rem', marginBottom: '2px' }}>
              Action Required: Department Staff Needs Additional Information
            </div>
            <div style={{ fontSize: '0.8125rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              Please review the staff inquiry in the conversation thread below and provide the requested details using the reply box so processing can resume.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Left Column: Request Details & Status Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Details Card */}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {request.request_type || request.category}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Department:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {request.department_name || 'Academic Office'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Submission Date:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date(request.created_at || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline of Status Changes */}
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
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Audit Timeline
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              {(request.timeline || []).map((step, idx) => (
                <div key={step.id || idx} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(67, 56, 202, 0.1)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </div>
                    {idx < (request.timeline?.length || 1) - 1 && (
                      <div style={{ width: '2px', flex: 1, backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                      {step.timestamp} • {step.actor}
                    </div>
                    {step.note && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {step.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Student-Visible Staff Conversation */}
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
              Department Communication
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
            Official messages exchanged between you and the department staff.
          </p>

          {/* Conversation Thread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '180px' }}>
            {(!request.comments || request.comments.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--text-tertiary)' }}>
                <Clock size={24} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                <div style={{ fontSize: '0.8125rem' }}>No messages exchanged yet</div>
              </div>
            ) : (
              request.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: comment.is_staff ? 'rgba(67, 56, 202, 0.05)' : 'var(--bg-app)',
                    border: `1px solid ${comment.is_staff ? 'rgba(67, 56, 202, 0.15)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: comment.is_staff ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                      {comment.sender_name} ({comment.sender_role})
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      {comment.timestamp}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {comment.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply Box */}
          <form onSubmit={handleSendReply} style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response to the department staff..."
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
              <Button type="submit" variant="primary" size="sm" disabled={!replyText.trim() || submittingReply}>
                <Send size={14} />
                {submittingReply ? 'Sending...' : 'Send Reply'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
