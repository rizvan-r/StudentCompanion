import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  BrainCircuit,
  Send,
  BookOpen,
  FileText,
  Bookmark,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  HelpCircle,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import {
  getDocuments,
  askAssistant,
  getConversations,
  createConversation,
  getConversationMessages,
  deleteConversation,
  API_BASE_URL,
} from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/common/StatusBadge';

const SAMPLE_PROMPT_CHIPS = [
  'Explain Dijkstra’s algorithm and time complexity',
  'Summarize the core differences between TCP and UDP',
  'Compare B-Trees vs B+ Trees in database indexing',
  'What are the 4 conditions for deadlock in operating systems?',
  'Explain normalization forms (1NF, 2NF, 3NF, BCNF) with examples',
];

export function StudyAssistantPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const docIdParam = searchParams.get('docId');

  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeCitationExcerpt, setActiveCitationExcerpt] = useState(null);

  // Conversations & Sidebar State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats' | 'docs'

  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: 'Hello! I am your AI Study Mentor. Ask me any conceptual question or syllabus topic. When you select lecture files from your Central Drive vault below, my answers will be strictly grounded in your syllabus notes with precise page citations.',
      citations: [],
      timestamp: 'Ready',
    },
  ]);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load documents
  useEffect(() => {
    let isMounted = true;
    async function loadDocs() {
      try {
        const docs = await getDocuments();
        const ready = (docs || []).filter(
          (d) => d.processing_status === 'ready' || d.processing_status === 'completed'
        );
        if (isMounted) {
          setAvailableDocs(ready);
          if (docIdParam && ready.some((d) => d.id === docIdParam)) {
            setSelectedDocIds([docIdParam]);
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadDocs();
    return () => {
      isMounted = false;
    };
  }, [docIdParam]);

  // Load conversation history sessions
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        const convList = await getConversations();
        if (isMounted && Array.isArray(convList)) {
          setConversations(convList);
        }
      } catch {
        // Local fallback
      }
    }
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const toggleDocSelection = (id) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast('Copied response to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartNewConversation = async () => {
    try {
      const newConv = await createConversation('New Study Session');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setChatMessages([
        {
          id: 'msg-welcome',
          role: 'assistant',
          text: 'Started a new study session. What topic or lecture notes would you like to explore today?',
          citations: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      toast('Started new study conversation', 'info');
    } catch {
      setActiveConversationId(null);
      setChatMessages([
        {
          id: 'msg-welcome',
          role: 'assistant',
          text: 'Started a new study session. Ask any syllabus question!',
          citations: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleSelectConversation = async (conv) => {
    if (activeConversationId === conv.id) return;
    setActiveConversationId(conv.id);
    setIsLoading(true);
    try {
      const messages = await getConversationMessages(conv.id);
      if (Array.isArray(messages) && messages.length > 0) {
        setChatMessages(
          messages.map((m) => ({
            id: m.id,
            role: m.role,
            text: m.content,
            citations: m.sources || [],
            timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          }))
        );
      } else {
        setChatMessages([
          {
            id: `msg-${conv.id}`,
            role: 'assistant',
            text: `Loaded conversation "${conv.title}". Send a query to continue.`,
            citations: [],
            timestamp: 'Loaded',
          },
        ]);
      }
    } catch {
      toast('Failed to load conversation history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        setActiveConversationId(null);
        setChatMessages([
          {
            id: 'msg-welcome',
            role: 'assistant',
            text: 'Conversation deleted. Ready for your next academic question.',
            citations: [],
            timestamp: 'Ready',
          },
        ]);
      }
      toast('Conversation deleted', 'info');
    } catch {
      toast('Failed to delete conversation', 'error');
    }
  };

  const handleSend = async (queryToSend = null) => {
    const q = (queryToSend || userQuery).trim();
    if (!q || isLoading) return;

    setUserQuery('');
    const userMsg = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await askAssistant(q, selectedDocIds, activeConversationId);
      
      if (response.conversation_id && response.conversation_id !== activeConversationId) {
        setActiveConversationId(response.conversation_id);
        // Refresh conversations list
        getConversations().then((list) => {
          if (Array.isArray(list)) setConversations(list);
        }).catch(() => {});
      }

      const assistantMsg = {
        id: response.message_id || `msg-assistant-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        citations: response.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        isError: true,
        lastQuery: q,
        text: 'Unable to connect with AI Assistant or retrieve document vectors. Please verify the FastAPI backend connection and retry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: 'calc(100vh - 90px)' }}>
      {/* Top Controls Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowHistorySidebar((prev) => !prev)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
            title={showHistorySidebar ? 'Collapse Side Panel' : 'Expand Side Panel'}
          >
            {showHistorySidebar ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
            <span>{showHistorySidebar ? 'Hide Panel' : 'Show Panel'}</span>
          </button>

          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #4338ca 0%, #0d9488 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BrainCircuit size={16} />
          </div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            AI Study Companion
          </h1>
          <Badge variant="teal">Gemini + Atlas RAG</Badge>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Grounded in indexed lecture notes with exact page citations
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="primary" size="sm" onClick={handleStartNewConversation}>
            <Plus size={14} />
            New Chat
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/student/study/documents')}>
            <FolderOpen size={14} />
            Drive Library
          </Button>
        </div>
      </div>

      {/* Main Viewport: Unified Left Sidebar & Spacious Chat Feed */}
      <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0 }}>
        {/* Unified Left Sidebar */}
        {showHistorySidebar && (
          <div
            style={{
              width: '280px',
              flexShrink: 0,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            {/* Segmented Switcher Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                padding: '6px',
                gap: '4px',
                backgroundColor: 'var(--bg-app)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <button
                onClick={() => setSidebarTab('chats')}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: sidebarTab === 'chats' ? 'var(--bg-surface)' : 'transparent',
                  color: sidebarTab === 'chats' ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: sidebarTab === 'chats' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: sidebarTab === 'chats' ? 'var(--shadow-xs)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <MessageSquare size={13} />
                <span>Chats ({conversations.length})</span>
              </button>

              <button
                onClick={() => setSidebarTab('docs')}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: sidebarTab === 'docs' ? 'var(--bg-surface)' : 'transparent',
                  color: sidebarTab === 'docs' ? 'var(--color-teal)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: sidebarTab === 'docs' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: sidebarTab === 'docs' ? 'var(--shadow-xs)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <BookOpen size={13} />
                <span>Docs {selectedDocIds.length > 0 ? `(${selectedDocIds.length})` : `(${availableDocs.length})`}</span>
              </button>
            </div>

            {/* Tab 1: Chat Sessions */}
            {sidebarTab === 'chats' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '10px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Saved Sessions
                  </span>
                  <button
                    onClick={handleStartNewConversation}
                    title="Start new chat"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <Plus size={13} />
                    <span>New</span>
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {conversations.length === 0 ? (
                    <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      <MessageSquare size={18} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                      No saved chat sessions
                    </div>
                  ) : (
                    conversations.map((c) => {
                      const isActive = activeConversationId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectConversation(c)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isActive ? 'rgba(67, 56, 202, 0.08)' : 'transparent',
                            border: `1px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--color-primary)' : 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {c.title || 'Study Session'}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                              {c.updated_at ? new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteConversation(e, c.id)}
                            title="Delete session"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-tertiary)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: 0.6,
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Prompts */}
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                    Quick Questions
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {SAMPLE_PROMPT_CHIPS.slice(0, 3).map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt)}
                        style={{
                          padding: '5px 7px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-app)',
                          textAlign: 'left',
                          fontSize: '0.6875rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          lineHeight: 1.25,
                        }}
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Study Documents Grounding */}
            {sidebarTab === 'docs' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '10px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Syllabus Notes
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {availableDocs.length > 0 && selectedDocIds.length < availableDocs.length && (
                      <button
                        onClick={() => setSelectedDocIds(availableDocs.map((d) => d.id))}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Select All
                      </button>
                    )}
                    {selectedDocIds.length > 0 && (
                      <button
                        onClick={() => setSelectedDocIds([])}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {availableDocs.length === 0 ? (
                    <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                      <BookOpen size={20} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                      <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>No lecture files ready</div>
                      <p style={{ fontSize: '0.6875rem', margin: '4px 0 10px' }}>Upload PDFs to Central Drive to enable grounded answers with citations.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate('/student/study/documents')}>
                        <FolderOpen size={13} />
                        Upload Notes
                      </Button>
                    </div>
                  ) : (
                    availableDocs.map((doc) => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <button
                          key={doc.id}
                          onClick={() => toggleDocSelection(doc.id)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${isSelected ? 'var(--color-teal)' : 'var(--border-subtle)'}`,
                            backgroundColor: isSelected ? 'rgba(13, 148, 136, 0.08)' : 'var(--bg-app)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              border: `1.5px solid ${isSelected ? 'var(--color-teal)' : 'var(--text-tertiary)'}`,
                              backgroundColor: isSelected ? 'var(--color-teal)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: '#ffffff',
                            }}
                          >
                            {isSelected && <Check size={11} strokeWidth={3} />}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.title || doc.filename}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                              {doc.page_count ? `${doc.page_count} pages` : 'Ready'} • Central Drive
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.6875rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  Checked documents ground answers with page citations.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Side: Chat Feed & Input */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          {/* Active Grounding Subheader */}
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Sparkles size={14} style={{ color: 'var(--color-teal)' }} />
                <span>
                  {selectedDocIds.length > 0
                    ? `Grounding query in ${selectedDocIds.length} lecture note(s):`
                    : 'Grounded in General CS & Engineering syllabus knowledge + indexed notes'}
                </span>
              </div>

              {/* Show chips for selected documents with quick remove */}
              {selectedDocIds.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {availableDocs
                    .filter((d) => selectedDocIds.includes(d.id))
                    .map((d) => (
                      <span
                        key={d.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(13, 148, 136, 0.12)',
                          color: 'var(--color-teal)',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                        }}
                      >
                        <BookOpen size={10} />
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.title || d.filename}
                        </span>
                        <button
                          onClick={() => toggleDocSelection(d.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-teal)', cursor: 'pointer', padding: 0, fontSize: '0.75rem', lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedDocIds.length > 0 ? (
                <Badge variant="teal">{selectedDocIds.length} active</Badge>
              ) : (
                <button
                  onClick={() => {
                    setShowHistorySidebar(true);
                    setSidebarTab('docs');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <BookOpen size={12} />
                  <span>Choose Documents →</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ maxWidth: '840px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {chatMessages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAssistant ? 'flex-start' : 'flex-end',
                      maxWidth: '85%',
                      alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                        fontSize: '0.6875rem',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      <span>{isAssistant ? 'Student Companion AI' : 'You'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: isAssistant
                          ? '3px 14px 14px 14px'
                          : '14px 3px 14px 14px',
                        backgroundColor: isAssistant
                          ? msg.isError
                            ? 'rgba(239, 68, 68, 0.08)'
                            : 'var(--bg-app)'
                          : 'var(--color-primary)',
                        color: isAssistant
                          ? msg.isError
                            ? 'var(--color-danger)'
                            : 'var(--text-primary)'
                          : '#ffffff',
                        border: isAssistant ? '1px solid var(--border-subtle)' : 'none',
                        fontSize: '0.875rem',
                        lineHeight: 1.55,
                        boxShadow: 'var(--shadow-xs)',
                        position: 'relative',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      {isAssistant && !msg.isError ? (
                        <div className="prose dark:prose-invert max-w-none" style={{ wordBreak: 'break-word' }}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</div>
                      )}

                      {/* Citations Footer */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                            Syllabus Document Citations:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {msg.citations.map((cite, cIdx) => (
                              <a
                                key={cIdx}
                                href={`${API_BASE_URL}/api/documents/${cite.document_id}/view`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'rgba(13, 148, 136, 0.1)',
                                  border: '1px solid rgba(13, 148, 136, 0.25)',
                                  color: 'var(--color-teal)',
                                  fontSize: '0.625rem',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <BookOpen size={11} />
                                <span>{cite.title || cite.document_title || 'Document'}</span>
                                {cite.page && <span>(p. {cite.page})</span>}
                                <ExternalLink size={10} style={{ opacity: 0.7 }} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar: Copy & Retry */}
                      {isAssistant && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '6px',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            title="Copy Answer"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-tertiary)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.625rem',
                            }}
                          >
                            {copiedId === msg.id ? <Check size={12} color="var(--color-teal)" /> : <Copy size={12} />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          {msg.isError && msg.lastQuery && (
                            <button
                              onClick={() => handleSend(msg.lastQuery)}
                              title="Retry message"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.625rem',
                                fontWeight: 600,
                              }}
                            >
                              <RefreshCw size={12} />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '3px 12px 12px 12px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    maxWidth: '220px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  <span>Searching & synthesizing...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat Input Bar */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ maxWidth: '840px', width: '100%', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <textarea
                ref={textareaRef}
                rows={1}
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a syllabus question or concept topic... (Shift+Enter for new line)"
                style={{
                  flex: 1,
                  resize: 'none',
                  minHeight: '40px',
                  maxHeight: '120px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  lineHeight: 1.4,
                  boxSizing: 'border-box',
                }}
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => handleSend()}
                disabled={isLoading || !userQuery.trim()}
                style={{ height: '40px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
            <div style={{ maxWidth: '840px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
              <span>Press Enter ↵ to send • Shift+Enter for new line</span>
              <span>Atlas Vector Search + Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
