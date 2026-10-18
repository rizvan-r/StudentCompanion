import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  Send,
  BookOpen,
  FileText,
  Bookmark,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { askAssistant, getDocuments } from '../services/api';

const DEFAULT_TOPICS = [
  'Data Structures & Algorithms',
  'Computer Systems & OS',
  'Discrete Mathematics',
  'Database Systems',
  'Computer Networks',
  'Software Engineering',
];

const INITIAL_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hello! I am your AI Study Mentor. I can explain complex syllabus concepts, solve coding problems, or answer exam revision questions directly from your college lecture notes and documents stored in Central Drive.',
  citations: [],
  timestamp: 'Ready',
};

export function AIStudyPage({ initialDocument = null, onNavigateToDocuments }) {
  const [selectedTopic, setSelectedTopic] = useState(DEFAULT_TOPICS[0]);
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [chatHistory, setChatHistory] = useState([INITIAL_WELCOME_MESSAGE]);
  const [activeExcerpt, setActiveExcerpt] = useState(null);

  const messagesEndRef = useRef(null);

  // Fetch student's ready documents
  useEffect(() => {
    async function loadDocs() {
      try {
        const docs = await getDocuments();
        const ready = (docs || []).filter((d) => d.processing_status === 'ready');
        setAvailableDocs(ready);

        if (initialDocument && ready.some((d) => d.id === initialDocument.id)) {
          setSelectedDocIds([initialDocument.id]);
        }
      } catch {
        // Fallback silently
      }
    }
    loadDocs();
  }, [initialDocument]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const toggleDocumentSelection = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!userQuery.trim() || isLoading) return;

    const queryText = userQuery.trim();
    setUserQuery('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await askAssistant(queryText, selectedDocIds, selectedTopic);

      const assistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        citations: response.citations || [],
        usedDocs: response.used_documents || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ Study Mentor Error: ${err.message || 'Unable to connect to Gemini Assistant. Please ensure your backend is running.'}`,
          citations: [],
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setUserQuery(promptText);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Intro Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          padding: '24px 28px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <BrainCircuit size={28} color="#38bdf8" />
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800 }}>AI Study Companion & Document Q&A</h2>
            <Badge variant="teal">Google Gemini Powered</Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#cbd5e1', maxWidth: '640px', lineHeight: 1.5 }}>
            Grounded academic tutor powered by Gemini 2.0. Select your Central Drive documents to get
            exam revision summaries, concept walk-throughs, and answers verified with page citations.
          </p>
        </div>

        {selectedDocIds.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '0.8125rem',
            }}
          >
            <BookOpen size={16} color="#38bdf8" />
            <span>
              <strong>{selectedDocIds.length}</strong> {selectedDocIds.length === 1 ? 'Doc' : 'Docs'} Grounded
            </span>
          </div>
        )}
      </div>

      {/* Subject Focus Area */}
      <Card title="Subject Focus Area" subtitle="Select your course topic for tailored explanations and problem solving">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          {DEFAULT_TOPICS.map((topic) => {
            const isSelected = selectedTopic === topic;
            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--bg-app)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Document Grounding Selector */}
      <Card
        title="Document Context (Optional Grounding)"
        subtitle="Select uploaded Central Drive documents to ground the AI with exact page citations"
      >
        {availableDocs.length === 0 ? (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} style={{ color: 'var(--color-primary)' }} />
              <span>No processed documents found in your library yet. AI will answer using general curriculum knowledge.</span>
            </div>
            {onNavigateToDocuments && (
              <Button variant="ghost" size="sm" onClick={onNavigateToDocuments} icon={ExternalLink}>
                Upload Document to Drive
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            {availableDocs.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => toggleDocumentSelection(doc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--bg-app)',
                    color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileText size={14} />
                  <span>{doc.title}</span>
                  {doc.page_count > 0 && (
                    <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({doc.page_count}p)</span>
                  )}
                  {isSelected && <CheckCircle2 size={14} color="var(--color-primary)" />}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Main Conversation Stream */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
          {/* Messages list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor:
                      msg.role === 'user'
                        ? 'var(--color-primary)'
                        : msg.isError
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'var(--bg-app)',
                    color:
                      msg.role === 'user'
                        ? '#ffffff'
                        : msg.isError
                        ? 'var(--color-danger)'
                        : 'var(--text-primary)',
                    boxShadow: msg.role === 'user' ? 'var(--shadow-xs)' : 'none',
                    border: msg.role === 'assistant' ? '1px solid var(--border-subtle)' : 'none',
                    lineHeight: 1.6,
                    fontSize: '0.9375rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text}

                  {/* Interactive Citation Pills */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-accent)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Bookmark size={12} />
                        <span>Verified Citations ({msg.citations.length}):</span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {msg.citations.map((cite, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveExcerpt(cite)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--color-accent-light)',
                              border: '1px solid rgba(13, 148, 136, 0.25)',
                              color: 'var(--color-accent-hover)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Click to inspect verified source chunk"
                          >
                            <span>
                              {cite.document_title} • Page {cite.page_number}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-tertiary)',
                    marginTop: '4px',
                    padding: '0 4px',
                  }}
                >
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', color: 'var(--text-secondary)' }}>
                <Loader2 size={18} className="spin-slow" color="var(--color-primary)" />
                <span style={{ fontSize: '0.875rem' }}>
                  {selectedDocIds.length > 0
                    ? 'Retrieving citations from Central Drive and reasoning with Gemini...'
                    : 'Gemini Study Mentor is thinking...'}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Citation Inspector Popover (if selected) */}
          {activeExcerpt && (
            <div
              className="animate-fade-in"
              style={{
                margin: '8px 0',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-accent-light)',
                border: '1px solid rgba(13, 148, 136, 0.3)',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                  📖 Source: {activeExcerpt.document_title} (Page {activeExcerpt.page_number})
                </div>
                <button
                  onClick={() => setActiveExcerpt(null)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  ✕ Close
                </button>
              </div>
              <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                "{activeExcerpt.excerpt}"
              </div>
            </div>
          )}

          {/* Quick study prompts */}
          <div
            style={{
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
            }}
          >
            <button
              onClick={() => handleQuickPrompt('Summarize the top 5 key takeaways and definitions from my selected documents')}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              💡 Key Takeaways
            </button>
            <button
              onClick={() => handleQuickPrompt('Generate 3 tricky exam practice questions with detailed answers based on these notes')}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              📝 Exam Questions
            </button>
            <button
              onClick={() => handleQuickPrompt('Explain the core algorithms step-by-step with simple analogies')}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              🔍 Step-by-step Explanation
            </button>
          </div>

          {/* Input Box Form */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder={
                selectedDocIds.length > 0
                  ? 'Ask any question grounded in your selected documents...'
                  : 'Ask your AI study mentor anything about course concepts or code...'
              }
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!userQuery.trim() || isLoading}
              icon={isLoading ? Loader2 : Send}
            >
              {isLoading ? 'Thinking...' : 'Ask'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
