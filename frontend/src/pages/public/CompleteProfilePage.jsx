import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, BookOpen, Hash, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/common/FormField';

export function CompleteProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState(profile?.student_id_number || '');
  const [department, setDepartment] = useState(profile?.department_name || 'Computer Science & Engineering');
  const [course, setCourse] = useState(profile?.course_name || 'B.Tech Computer Science');
  const [semester, setSemester] = useState(profile?.semester || 'Semester 5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!studentId) {
      setError('Student ID / Roll number is mandatory.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        student_id_number: studentId,
        course_name: course,
        semester: semester,
      });

      toast('Academic profile completed successfully!', 'success');
      navigate('/student/dashboard');
    } catch (err) {
      setError(err?.message || 'Could not save profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        </div>
      </header>

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
            maxWidth: '520px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            padding: '36px 32px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Complete Academic Profile
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Confirm your college registration details to access syllabus study materials and department services
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
            <FormField label="Student Identification / Roll No" required htmlFor="student-id-field">
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
                  id="student-id-field"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="CS-2024-042"
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

            <FormField label="Academic Department" required htmlFor="dept-field">
              <div style={{ position: 'relative' }}>
                <Building2
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                  }}
                />
                <select
                  id="dept-field"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Course / Degree" required htmlFor="course-field">
                <input
                  id="course-field"
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="B.Tech Computer Science"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                  }}
                />
              </FormField>

              <FormField label="Current Semester" required htmlFor="sem-field">
                <select
                  id="sem-field"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
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
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </FormField>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px' }}
            >
              {loading ? 'Saving Academic Profile...' : 'Save & Enter Campus Portal'}
              <ArrowRight size={18} />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
