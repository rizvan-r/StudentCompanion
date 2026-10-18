import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  BrainCircuit,
  HardDrive,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { getDocuments, deleteDocument, retryDocument } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';

export function DocumentDetailPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDoc() {
      try {
        const docs = await getDocuments();
        const found = (docs || []).find((d) => d.id === documentId);
        if (isMounted) {
          if (found) {
            setDocument(found);
          } else {
            setError('The requested document was not found or access is unauthorized.');
          }
        }
      } catch (err) {
        if (isMounted) setError(err?.message || 'Failed to retrieve document metadata.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDoc();
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteDocument(documentId);
      toast('Document removed from Central Google Drive vault', 'success');
      navigate('/student/study/documents');
    } catch (err) {
      toast(err?.message || 'Could not delete document', 'error');
    } finally {
      setActionLoading(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleRetry = async () => {
    setActionLoading(true);
    try {
      await retryDocument(documentId);
      toast('Text extraction and chunking re-queued', 'info');
      setDocument((prev) => ({ ...prev, processing_status: 'processing' }));
    } catch (err) {
      toast(err?.message || 'Retry failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <LoadingSkeleton count={4} height="50px" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Document Unavailable
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {error || 'Document metadata could not be retrieved.'}
        </p>
        <Link to="/student/study/documents">
          <Button variant="outline">
            <ArrowLeft size={16} />
            Back to Document Library
          </Button>
        </Link>
      </div>
    );
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={document.title || document.filename}
        subtitle="Centralized College Google Drive storage details and syllabus grounding status"
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'Drive Documents', to: '/student/study/documents' },
          { label: document.title || document.filename },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(true)}
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 size={16} />
              Delete
            </Button>

            {document.processing_status === 'failed' && (
              <Button variant="outline" onClick={handleRetry} disabled={actionLoading}>
                <RefreshCw size={16} className={actionLoading ? 'animate-spin' : ''} />
                Retry Processing
              </Button>
            )}

            <Button
              variant="primary"
              onClick={() => navigate(`/student/study?docId=${document.id}`)}
              disabled={document.processing_status !== 'ready'}
            >
              <BrainCircuit size={16} />
              Ask AI About This File
            </Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Metadata Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(67, 56, 202, 0.1)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  File Specifications
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Institutional repository asset
                </span>
              </div>
            </div>
            <StatusBadge status={document.processing_status} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>File Name:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{document.filename}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>File Size:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatFileSize(document.file_size_bytes)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Page Count:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {document.page_count ? `${document.page_count} pages extracted` : 'Pending extraction'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Central Drive ID:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {document.drive_file_id || 'Stored in Shared Vault'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Uploaded On:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {new Date(document.created_at || Date.now()).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Grounding & Chunking Status */}
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
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                color: 'var(--color-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Gemini Vector Indexing
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Supabase PostgreSQL Full-Text & Embedding chunks
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
            }}
          >
            {document.processing_status === 'ready' ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--color-success)' }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: 'var(--text-primary)' }}>
                  This document has been fully parsed by the backend pypdf worker. Chunks have been indexed in PostgreSQL and are actively available for Gemini AI grounding.
                </span>
              </div>
            ) : document.processing_status === 'failed' ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--color-danger)' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {document.last_error || 'Text extraction failed. If this is a scanned image PDF, text parsing may require OCR.'}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-warning)' }}>
                <RefreshCw size={18} className="animate-spin" />
                <span>
                  Background worker is extracting syllabus passages and creating embeddings. This usually takes 5-15 seconds.
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
            <Link to="/student/study/documents" style={{ textDecoration: 'none' }}>
              <Button variant="outline">
                <ArrowLeft size={16} />
                Return to Documents
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Remove Document from Drive?"
        message={`Are you sure you want to permanently delete "${document.title || document.filename}"? This will delete the original file from the Central College Drive vault and all indexed text chunks.`}
        confirmText={actionLoading ? 'Deleting...' : 'Delete Permanently'}
        variant="danger"
      />
    </div>
  );
}
