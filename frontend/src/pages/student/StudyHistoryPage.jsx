import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History,
  BrainCircuit,
  MessageSquare,
  Trash2,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';

export function StudyHistoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sessions, setSessions] = useState([
    {
      id: 'session-1',
      title: 'Dijkstra Shortest Path vs Bellman-Ford Complexity',
      lastMessage: 'Comparison of negative cycle handling and Big-O efficiency across sparse graphs...',
      docGrounded: 'Algorithms_Core_LectureNotes.pdf',
      date: 'Today, 11:20 AM',
      messageCount: 6,
    },
    {
      id: 'session-2',
      title: 'Database Normalization & BCNF Lossless Join Tests',
      lastMessage: 'Explained functional dependency preservation with decomposition proofs...',
      docGrounded: 'Database_Systems_Unit3.pdf',
      date: 'Yesterday, 4:15 PM',
      messageCount: 4,
    },
    {
      id: 'session-3',
      title: 'Virtual Memory & Page Replacement Algorithms',
      lastMessage: 'Walked through Belady’s anomaly on FIFO vs optimal page replacement...',
      docGrounded: null,
      date: 'Oct 15, 2026',
      messageCount: 8,
    },
  ]);

  const [selectedForDelete, setSelectedForDelete] = useState(null);

  const handleDelete = () => {
    if (!selectedForDelete) return;
    setSessions((prev) => prev.filter((s) => s.id !== selectedForDelete.id));
    toast('Study conversation removed from history', 'info');
    setSelectedForDelete(null);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="AI Study History"
        subtitle="Review, resume, or export your syllabus revision conversations with the Gemini Study Mentor."
        breadcrumbs={[
          { label: 'Student Portal', to: '/student/dashboard' },
          { label: 'Study Companion', to: '/student/study' },
          { label: 'Study History' },
        ]}
        actions={
          <Button variant="primary" onClick={() => navigate('/student/study')}>
            <BrainCircuit size={16} />
            Start New Session
          </Button>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Past Conversations"
          description="Your questions and syllabus revision dialogues with Gemini AI will be archived here for easy retrieval before exams."
          actionText="Ask First Question"
          onAction={() => navigate('/student/study')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                transition: 'box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(67, 56, 202, 0.08)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {session.title}
                    </h3>
                    {session.docGrounded && (
                      <Badge variant="teal">Drive Grounded</Badge>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {session.lastMessage}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {session.date}
                    </span>
                    <span>•</span>
                    <span>{session.messageCount} messages</span>
                    {session.docGrounded && (
                      <>
                        <span>•</span>
                        <span>Source: {session.docGrounded}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedForDelete(session)}
                  style={{ color: 'var(--color-danger)' }}
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/student/study')}
                >
                  Resume Dialogue
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        onConfirm={handleDelete}
        title="Delete Conversation Session?"
        message={`Are you sure you want to remove "${selectedForDelete?.title}" from your study history? This action cannot be undone.`}
        confirmText="Remove Session"
        variant="danger"
      />
    </div>
  );
}
