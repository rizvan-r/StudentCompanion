import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { NewRequestPage } from '../pages/student/NewRequestPage';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

describe('NewRequestPage Wizard', () => {
  it('renders Step 1 with category selection chips', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <NewRequestPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Step 1: Choose Request Category/i)).toBeInTheDocument();
    expect(screen.getByText('Campus Complaint')).toBeInTheDocument();
    expect(screen.getByText('Leave of Absence')).toBeInTheDocument();
    expect(screen.getByText('Certificate Request')).toBeInTheDocument();
    expect(screen.getByText('Department Service Request')).toBeInTheDocument();
  });

  it('navigates to Step 2 when category is selected and proceeded', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <NewRequestPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const proceedBtn = screen.getByText(/Proceed to Details/i);
    fireEvent.click(proceedBtn);

    expect(screen.getByText(/Step 2: Enter Request Details/i)).toBeInTheDocument();
  });
});
