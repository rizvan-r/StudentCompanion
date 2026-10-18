import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentLibrary } from '../../components/documents/DocumentLibrary';
import { PageHeader } from '../../components/common/PageHeader';
import { BookOpen, BrainCircuit } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function StudyDocumentsPage() {
  const navigate = useNavigate();

  const handleSelectForAI = (doc) => {
    navigate(`/student/study?docId=${doc.id}`);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <PageHeader
        title="Central Google Drive Document Library"
        subtitle="Manage lecture notes, syllabus slides, and reference textbook PDFs stored centrally in the college Google Drive vault."
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'Study Companion', to: '/student/study' },
          { label: 'Drive Documents' },
        ]}
        actions={
          <Button variant="primary" onClick={() => navigate('/student/study')}>
            <BrainCircuit size={16} />
            Ask AI Mentor
          </Button>
        }
      />

      <DocumentLibrary
        onSelectForAI={handleSelectForAI}
        onOpenPreview={null}
      />
    </div>
  );
}
