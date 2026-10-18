import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

describe('Public Pages Rendering', () => {
  it('renders LandingPage brand identity and calls to action', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Student Companion AI')).toBeInTheDocument();
    expect(screen.getByText(/Your campus day, made simpler/i)).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders LoginPage with college email field and Google login option', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <LoginPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText(/College Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Google College Account/i)).toBeInTheDocument();
  });

  it('renders NotFoundPage for unknown routes', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('renders UnauthorizedPage when role does not permit access', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <UnauthorizedPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });
});
