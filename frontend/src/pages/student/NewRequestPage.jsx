import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  Calendar,
  Award,
  Wrench,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { PageHeader } from '../../components/common/PageHeader';
import { FormField } from '../../components/common/FormField';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

const CATEGORIES = [
  {
    id: 'complaint',
    title: 'Campus Complaint',
    description: 'Report issues regarding hostel facilities, Wi-Fi connectivity, library, or food services.',
    icon: AlertCircle,
    color: '#ef4444',
  },
  {
    id: 'leave',
    title: 'Leave of Absence',
    description: 'Apply for official attendance exemption for medical recovery, academic symposiums, or personal emergencies.',
    icon: Calendar,
    color: '#10b981',
  },
  {
    id: 'certificate',
    title: 'Certificate Request',
    description: 'Request signed bonafide certificates, transfer letters, or medium of instruction verification.',
    icon: Award,
    color: '#d97706',
  },
  {
    id: 'service',
    title: 'Department Service Request',
    description: 'Request lab computer allocations, ID card reissue, or academic advisor consultations.',
    icon: Wrench,
    color: '#4338ca',
  },
];

export function NewRequestPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const initialType = searchParams.get('type') || 'complaint';

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(initialType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdRequest, setCreatedRequest] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(profile?.department_name || 'Computer Science & Engineering');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [leaveType, setLeaveType] = useState('Medical');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [certType, setCertType] = useState('Bonafide Student Certificate');
  const [purpose, setPurpose] = useState('');

  const handleNextToReview = (e) => {
    e.preventDefault();
    setError('');

    if (!title && selectedType !== 'leave' && selectedType !== 'certificate') {
      setError('Please provide a title for your request.');
      return;
    }

    if (!description && selectedType !== 'certificate') {
      setError('Please provide a detailed explanation of your request.');
      return;
    }

    if (selectedType === 'leave' && (!startDate || !endDate)) {
      setError('Please specify both the start and end dates for your leave.');
      return;
    }

    setStep(3); // Proceed to Review Step
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');

    const payload = {
      title:
        title ||
        (selectedType === 'leave'
          ? `${leaveType} Leave (${startDate} to ${endDate})`
          : `${certType} Request`),
      request_type: selectedType,
      category:
        selectedType === 'leave'
          ? leaveType
          : selectedType === 'certificate'
          ? certType
          : 'Department Request',
      department_name: department,
      description: description || `Purpose: ${purpose}`,
      metadata: {
        location: location || null,
        start_date: startDate || null,
        end_date: endDate || null,
        certificate_type: certType || null,
        purpose: purpose || null,
      },
    };

    try {
      const res = await requestService.createRequest(payload);
      setCreatedRequest(res || { reference_number: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`, ...payload });
      toast('Request submitted successfully!', 'success');
      setStep(4); // Success Step
    } catch (err) {
      setError(err?.message || 'Could not submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '780px', margin: '0 auto' }}>
      <PageHeader
        title="Submit Department Request"
        subtitle="Follow the step-by-step wizard to file transparent grievances, leaves, or certificate applications."
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'Requests', to: '/student/requests' },
          { label: 'New Request' },
        ]}
      />

      {/* Wizard Step Progression Bar */}
      {step < 4 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {[
            { num: 1, label: 'Category' },
            { num: 2, label: 'Details' },
            { num: 3, label: 'Review' },
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: step >= s.num ? 'var(--color-primary)' : 'var(--border-subtle)',
                  color: step >= s.num ? '#ffffff' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: step >= s.num ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {s.label}
              </span>
            </div>
          ))}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              height: '2px',
              backgroundColor: 'var(--border-subtle)',
              zIndex: 1,
            }}
          />
        </div>
      )}

      {/* STEP 1: Select Category */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Step 1: Choose Request Category
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedType === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedType(cat.id)}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {cat.title}
                      </h3>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {cat.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="primary" onClick={() => setStep(2)}>
              Proceed to Details
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Fill Details */}
      {step === 2 && (
        <form
          onSubmit={handleNextToReview}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Step 2: Enter Request Details
            </h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'capitalize' }}>
              Category: {selectedType}
            </span>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {/* Department Destination */}
          <FormField label="Assigned Department / Academic Office" required htmlFor="dept-select">
            <select
              id="dept-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Dean Office / Registrar">Dean Office / Registrar</option>
              <option value="IT Network Infrastructure">IT Network Infrastructure</option>
              <option value="Campus Hostel Administration">Campus Hostel Administration</option>
              <option value="Central Library Committee">Central Library Committee</option>
            </select>
          </FormField>

          {/* Type Specific Fields: Complaint */}
          {selectedType === 'complaint' && (
            <>
              <FormField label="Complaint Title" required htmlFor="req-title">
                <input
                  id="req-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wi-Fi dropping repeatedly on 3rd floor Block B"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
                />
              </FormField>

              <FormField label="Campus Location / Room Number" htmlFor="req-loc" hint="Helps technicians locate the facility quickly">
                <input
                  id="req-loc"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Block C, Room 304"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
                />
              </FormField>

              <FormField label="Detailed Description" required htmlFor="req-desc">
                <textarea
                  id="req-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed context regarding the issue..."
                  rows={4}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </FormField>
            </>
          )}

          {/* Type Specific Fields: Leave Request */}
          {selectedType === 'leave' && (
            <>
              <FormField label="Leave Type" required htmlFor="leave-type">
                <select
                  id="leave-type"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
                >
                  <option value="Medical">Medical Recovery</option>
                  <option value="Academic">Academic Symposium / Hackathon</option>
                  <option value="Family">Personal / Family Emergency</option>
                  <option value="Sports">Inter-Collegiate Sports Tournament</option>
                </select>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Start Date" required htmlFor="start-date">
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
                  />
                </FormField>
                <FormField label="End Date" required htmlFor="end-date">
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
                  />
                </FormField>
              </div>

              <FormField label="Reason for Leave" required htmlFor="leave-reason">
                <textarea
                  id="leave-reason"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why leave is required and attach clinic or conference slip if available..."
                  rows={4}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </FormField>
            </>
          )}

          {/* Type Specific Fields: Certificate Request */}
          {selectedType === 'certificate' && (
            <>
              <FormField label="Certificate Type" required htmlFor="cert-type">
                <select
                  id="cert-type"
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
                >
                  <option value="Bonafide Student Certificate">Bonafide Student Certificate</option>
                  <option value="Medium of Instruction Certificate">Medium of Instruction (English)</option>
                  <option value="No Objection Certificate (NOC)">No Objection Certificate (Internship)</option>
                  <option value="Character & Conduct Certificate">Character & Conduct Certificate</option>
                </select>
              </FormField>

              <FormField label="Purpose of Certificate" required htmlFor="cert-purpose">
                <input
                  id="cert-purpose"
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Passport application, Educational Bank Loan, or Visa verification"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
                />
              </FormField>

              <FormField label="Additional Notes" htmlFor="cert-notes">
                <textarea
                  id="cert-notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any specific addressing requirements (e.g. addressed to the Regional Passport Officer)..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </FormField>
            </>
          )}

          {/* Type Specific Fields: Service Request */}
          {selectedType === 'service' && (
            <>
              <FormField label="Service Request Title" required htmlFor="serv-title">
                <input
                  id="serv-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Request for Lab Machine Allocation for Capstone Project"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
                />
              </FormField>

              <FormField label="Service Details & Specifications" required htmlFor="serv-desc">
                <textarea
                  id="serv-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide all required software or hardware specifications..."
                  rows={4}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.875rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </FormField>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft size={16} />
              Change Category
            </Button>
            <Button type="submit" variant="primary">
              Review Application
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: Review Application */}
      {step === 3 && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Step 3: Review Before Final Submission
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Please confirm your application details. Once submitted, your request will be immediately dispatched to the department staff inbox.
          </p>

          <div
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{selectedType}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Department:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{department}</span>
            </div>

            {selectedType === 'leave' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dates Requested:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{startDate} to {endDate}</span>
              </div>
            )}

            {selectedType === 'certificate' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Certificate:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{certType}</span>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Statement / Description:</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {description || purpose}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft size={16} />
              Edit Details
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={loading}
              onClick={handleFinalSubmit}
            >
              {loading ? 'Transmitting to Department...' : 'Confirm & Submit Application'}
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Real Submission Success Screen */}
      {step === 4 && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '40px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Application Submitted Successfully!
          </h2>

          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.6, marginBottom: '20px' }}>
            Your request has been filed with <strong>{department}</strong>. You can follow live updates and reply to staff in your tracking timeline.
          </p>

          <div
            style={{
              padding: '16px 24px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-strong)',
              marginBottom: '28px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Reference Tracking Number
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
              {createdRequest?.reference_number || 'REQ-2026-049'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/student/requests">
              <Button variant="outline">
                All Requests
              </Button>
            </Link>
            <Link to={`/student/requests/${createdRequest?.id || 'req-001'}`}>
              <Button variant="primary">
                View Tracking Timeline
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
