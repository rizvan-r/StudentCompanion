import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  UploadCloud,
  RefreshCw,
  Trash2,
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  HardDrive,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SearchInput } from '../common/SearchInput';
import { UploadModal } from './UploadModal';
import { getDocuments, deleteDocument, retryDocument, getDocumentStatus, API_BASE_URL } from '../../services/api';

export function DocumentLibrary({ onSelectForAI, _onOpenPreview }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const fetchDocs = useCallback(async () => {
    try {
      setError('');
      const data = await getDocuments();
      setDocuments(data || []);
    } catch (err) {
      setError(err.message || 'Could not load documents from backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getDocuments()
      .then((data) => {
        if (isMounted) {
          setDocuments(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Could not load documents from backend');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Periodic polling for active processing jobs
  useEffect(() => {
    const hasActiveJobs = documents.some(
      (d) => d.processing_status === 'pending' || d.processing_status === 'processing'
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(async () => {
      let changed = false;
      const updated = await Promise.all(
        documents.map(async (doc) => {
          if (doc.processing_status === 'pending' || doc.processing_status === 'processing') {
            try {
              const statusData = await getDocumentStatus(doc.id);
              const newStatus = statusData.processing_status || statusData.status;
              if (newStatus && newStatus !== doc.processing_status) {
                changed = true;
                return {
                  ...doc,
                  processing_status: newStatus,
                  status: newStatus,
                  error_message: statusData.error_message,
                  chunk_count: statusData.chunk_count,
                  page_count: statusData.page_count ?? doc.page_count,
                };
              }
            } catch {
              // Ignore polling errors
            }
          }
          return doc;
        })
      );

      if (changed) {
        setDocuments(updated);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [documents]);

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove the file from both Central Drive and the database.`)) {
      return;
    }

    try {
      setDeletingId(docId);
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (docId) => {
    try {
      setRetryingId(docId);
      const updated = await retryDocument(docId);
      setDocuments((prev) => prev.map((d) => (d.id === docId ? updated : d)));
    } catch (err) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
      case 'completed':
        return (
          <Badge variant="teal">
            <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
            Ready for AI
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="blue">
            <RefreshCw size={12} className="spin-slow" style={{ marginRight: '4px' }} />
            Chunking...
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="amber">
            <Clock size={12} style={{ marginRight: '4px' }} />
            Queued
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="rose">
            <AlertTriangle size={12} style={{ marginRight: '4px' }} />
            Processing Failed
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const filename = doc.file_name || doc.original_filename || '';
    const subject =
      doc.subject ||
      (doc.description?.startsWith('Subject: ') ? doc.description.replace('Subject: ', '') : doc.description) ||
      'General';
    const matchesSearch =
      (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const subjectsList = [
    'all',
    ...Array.from(
      new Set(
        documents
          .map(
            (d) =>
              d.subject ||
              (d.description?.startsWith('Subject: ') ? doc.description.replace('Subject: ', '') : d.description)
          )
          .filter(Boolean)
      )
    ),
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Filter and Search Bar with Upload Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          backgroundColor: 'var(--bg-surface)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px', maxWidth: '420px' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by title or filename..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            aria-label="Filter documents by subject"
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            {subjectsList.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Subjects' : s}
              </option>
            ))}
          </select>

          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchDocs} disabled={loading} style={{ height: '36px' }}>
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={UploadCloud}
            onClick={() => setUploadModalOpen(true)}
            style={{ height: '36px' }}
          >
            Upload Notes
          </Button>
        </div>
      </div>

      {/* Documents List */}
      {loading && documents.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin-slow" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.8125rem' }}>Loading documents from Central Drive vault...</p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--color-danger)' }}>
            <AlertTriangle size={28} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchDocs} style={{ marginTop: '8px' }}>
              Try Again
            </Button>
          </div>
        </Card>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'var(--color-primary)',
              }}
            >
              <FileCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No study documents found
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 16px', lineHeight: 1.4 }}>
              {searchQuery || subjectFilter !== 'all'
                ? 'No documents matched your current search criteria.'
                : 'Upload lecture slides or revision notes to Central Google Drive for AI grounded Q&A.'}
            </p>
            <Button variant="primary" size="sm" icon={UploadCloud} onClick={() => setUploadModalOpen(true)}>
              Upload First Document
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
          {filteredDocs.map((doc) => (
            <Card key={doc.id}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: 1.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={doc.title}
                      >
                        {doc.title}
                      </h4>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.file_name || doc.original_filename}
                      </div>
                    </div>
                  </div>
                  <div>{getStatusBadge(doc.processing_status)}</div>
                </div>

                {/* Metadata tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                  <span
                    style={{
                      backgroundColor: 'var(--bg-app)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                    }}
                  >
                    {doc.subject || (doc.description?.startsWith('Subject: ') ? doc.description.replace('Subject: ', '') : doc.description) || 'General'}
                  </span>
                  <span style={{ backgroundColor: 'var(--bg-app)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                    {formatFileSize(doc.file_size_bytes)}
                  </span>
                  {doc.page_count > 0 && (
                    <span style={{ backgroundColor: 'var(--bg-app)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                      {doc.page_count} {doc.page_count === 1 ? 'Page' : 'Pages'}
                    </span>
                  )}
                  {doc.chunk_count > 0 && (
                    <span style={{ backgroundColor: 'var(--bg-app)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                      {doc.chunk_count} Chunks
                    </span>
                  )}
                </div>

                {/* Processing Error Notice (if failed) */}
                {doc.processing_status === 'failed' && (
                  <div
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontSize: '0.6875rem',
                      color: 'var(--color-danger)',
                      lineHeight: 1.35,
                    }}
                  >
                    {doc.error_message || 'Text extraction failed. Try re-uploading or click retry.'}
                  </div>
                )}

                {/* Drive Storage Footer */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                    <HardDrive size={11} />
                    <span>Central Drive</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {doc.processing_status === 'failed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRetry(doc.id)}
                        disabled={retryingId === doc.id}
                        icon={RefreshCw}
                      >
                        {retryingId === doc.id ? 'Retrying...' : 'Retry'}
                      </Button>
                    )}

                    {(doc.processing_status === 'ready' || doc.processing_status === 'completed') && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSelectForAI && onSelectForAI(doc)}
                        icon={BrainCircuit}
                      >
                        Ask AI
                      </Button>
                    )}

                    <a
                      href={`${API_BASE_URL}/api/documents/${doc.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                      title="View Authorized Original Document"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                    >
                      <ExternalLink size={14} />
                    </a>

                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      disabled={deletingId === doc.id}
                      title="Delete Document"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal Dialog */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => {
          fetchDocs();
        }}
      />
    </div>
  );
}
