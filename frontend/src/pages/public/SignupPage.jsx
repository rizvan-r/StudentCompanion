import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, Hash, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/common/FormField';

export function SignupPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, {
        fullName,
        studentIdNumber: studentId,
      });

      setSuccess(true);
      toast('Registration initiated! Welcome to Student Companion AI.', 'success');
    } catch (err) {
      setError(err?.message || 'Registration failed. Please verify your details or institutional email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4338ca 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <GraduationCap size={20} />
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Student Companion AI
          </span>
        </Link>

        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Registration Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            padding: '36px 32px',
          }}
        >
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Account Created Successfully!
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Your student profile has been registered. If email confirmation was sent to <strong>{email}</strong>, please click the link in your college mailbox to verify.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/student/dashboard')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Proceed to Student Portal
                <ArrowRight size={18} />
              </Button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Create Student Account
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Join your campus digital companion for AI study & department services
                </p>
              </div>

              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-danger)',
                    fontSize: '0.875rem',
                    marginBottom: '20px',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FormField label="Full Name" required htmlFor="fullName">
                  <div style={{ position: 'relative' }}>
                    <User
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                      }}
                    />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </FormField>

                <FormField label="College Email" required htmlFor="signup-email" hint="Use your college domain (e.g. @college.edu)">
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                      }}
                    />
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@college.edu"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </FormField>

                <FormField label="Student ID / Roll Number" required htmlFor="studentId">
                  <div style={{ position: 'relative' }}>
                    <Hash
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                      }}
                    />
                    <input
                      id="studentId"
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="CSE-2024-089"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </FormField>

                <FormField label="Password" required htmlFor="signup-password" hint="At least 8 characters">
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                      }}
                    />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 38px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormField>

                <FormField label="Confirm Password" required htmlFor="confirmPassword">
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                      }}
                    />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </FormField>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  By creating an account, you agree to abide by the institution's academic honor code and digital asset usage policy.
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '4px' }}
                >
                  {loading ? 'Creating Student Profile...' : 'Complete Registration'}
                  <ArrowRight size={18} />
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
