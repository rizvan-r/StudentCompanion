import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileQuestion,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export function StatusBadge({ status, size = 'sm' }) {
  const norm = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  switch (norm) {
    case 'ready':
    case 'completed':
    case 'approved':
    case 'resolved':
      return (
        <Badge variant="teal" size={size}>
          <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
          {status === 'ready' ? 'Ready for AI' : status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );

    case 'processing':
    case 'chunking':
      return (
        <Badge variant="blue" size={size}>
          <RefreshCw size={12} className="spin-slow" style={{ marginRight: '4px' }} />
          Processing
        </Badge>
      );

    case 'in_review':
    case 'under_review':
      return (
        <Badge variant="indigo" size={size}>
          <Clock size={12} style={{ marginRight: '4px' }} />
          Under Review
        </Badge>
      );

    case 'pending':
    case 'queued':
      return (
        <Badge variant="amber" size={size}>
          <Clock size={12} style={{ marginRight: '4px' }} />
          Pending
        </Badge>
      );

    case 'needs_info':
      return (
        <Badge variant="amber" size={size}>
          <FileQuestion size={12} style={{ marginRight: '4px' }} />
          Needs Information
        </Badge>
      );

    case 'failed':
    case 'rejected':
      return (
        <Badge variant="rose" size={size}>
          <XCircle size={12} style={{ marginRight: '4px' }} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" size={size}>
          {status || 'Unknown'}
        </Badge>
      );
  }
}
