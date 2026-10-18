import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { uploadDocument } from '../../services/api';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Data Structures');
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | success | error
  const [uploadResult, setUploadResult] = useState(null);

  const fileInputRef = useRef(null);

  const availableSubjects = [
    'Data Structures',
    'Algorithms',
    'Operating Systems',
    'Database Management',
    'Computer Networks',
    'Artificial Intelligence',
    'Discrete Mathematics',
    'Other / General',
  ];

  const handleReset = () => {
    setSelectedFile(null);
    setTitle('');
    setErrorMsg('');
    setUploadState('idle');
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateAndSetFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    // Check extension
    const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
    if (!['pdf', 'txt'].includes(ext)) {
      setErrorMsg(`Unsupported file type (.${ext}). Only PDF (.pdf) and Text (.txt) files are accepted.`);
      return;
    }

    // Check size (25MB limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(`File exceeds the 25 MB size limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a smaller file.`);
      return;
    }

    if (file.size === 0) {
      setErrorMsg('The selected file is empty (0 bytes). Please choose a valid document.');
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      // Default title to base filename without extension
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a PDF or text file to upload.');
      return;
    }

    try {
      setUploadState('uploading');
      setErrorMsg('');

      const result = await uploadDocument(selectedFile, title, subject);
      setUploadResult(result);
      setUploadState('success');

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      setUploadState('error');
      setErrorMsg(err.message || 'Failed to upload document to Central Drive.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Study Document"
      subtitle="Original files are securely archived in the college Central Google Drive vault."
    >
      {uploadState === 'success' ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Document Uploaded & Queued for Processing!
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
            <strong>{uploadResult?.title}</strong> has been stored in Central Google Drive.
            Text chunks and page numbers are being indexed for AI study citations.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <Button variant="secondary" onClick={handleReset}>
              Upload Another
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Done & View Library
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Centralized Drive Trust Notice */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid rgba(49, 46, 129, 0.15)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
            }}
          >
            <HardDrive size={18} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-primary)' }}>College Central Drive Vault:</strong> Original files
              are managed directly by the college Google Workspace. Text is safely extracted and protected by strict
              database isolation rules.
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed',
              borderColor: dragOver ? 'var(--color-primary)' : selectedFile ? 'var(--color-success)' : 'var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragOver ? 'var(--color-primary-light)' : selectedFile ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-app)',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {selectedFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <FileText size={32} style={{ color: 'var(--color-success)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <UploadCloud size={24} />
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Click to upload</span> or drag and drop
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  PDF (.pdf) or Plain Text (.txt) up to 25 MB
                </div>
              </div>
            )}
          </div>

          {/* Document Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 - Tree Traversal & Balancing"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Subject Focus Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Academic Subject / Module
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--color-danger)',
                fontSize: '0.8125rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="ghost" type="button" onClick={handleClose} disabled={uploadState === 'uploading'}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!selectedFile || uploadState === 'uploading'}
              icon={uploadState === 'uploading' ? Loader2 : UploadCloud}
            >
              {uploadState === 'uploading' ? 'Uploading to Drive...' : 'Upload & Process'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
