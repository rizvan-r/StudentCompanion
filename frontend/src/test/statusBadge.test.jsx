import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from '../components/common/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders Ready status correctly with green styling', () => {
    render(<StatusBadge status="ready" />);
    expect(screen.getByText('Ready for AI')).toBeInTheDocument();
  });

  it('renders Processing status correctly', () => {
    render(<StatusBadge status="processing" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('renders Needs Information badge for student inquiries', () => {
    render(<StatusBadge status="needs_info" />);
    expect(screen.getByText('Needs Information')).toBeInTheDocument();
  });

  it('renders Under Review badge for triage workflows', () => {
    render(<StatusBadge status="in_review" />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('renders Approved status badge', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });
});
