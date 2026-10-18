import React, { useState } from 'react';
import { Sparkles, Send, BrainCircuit, Lightbulb, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { askAssistant } from '../../services/api';

export function AICompanionCard({ onSelectPrompt, onNavigateToAI }) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [liveAnswer, setLiveAnswer] = useState(null);

  const examplePrompts = [
    { label: 'Explain a concept', text: 'Explain dynamic programming and memoization with simple examples.' },
    { label: 'Summarize notes', text: 'Can you summarize how B-Trees maintain balance in databases?' },
    { label: 'Study plan', text: 'Create a focused 2-hour study schedule for my upcoming exams.' },
    { label: 'Practice questions', text: 'Generate 3 self-assessment practice questions on Operating Systems.' },
  ];

  const handlePromptClick = (promptText) => {
    setQuestion(promptText);
    if (onSelectPrompt) onSelectPrompt(promptText);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const queryText = question.trim();
    setIsLoading(true);
    setLiveAnswer(null);

    try {
      const response = await askAssistant(queryText, []);
      setLiveAnswer({
        query: queryText,
        answer: response.answer,
        citations: response.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err) {
      setLiveAnswer({
        query: queryText,
        answer: `Notice: ${err.message || 'Unable to connect to Gemini Assistant. Please ensure backend is running.'}`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="ai-companion-card"
      style={{
        background: 'linear-gradient(145deg, #1e1b4b 0%, #2e1065 60%, #042f2e 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* Decorative background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <BrainCircuit size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                AI Study Companion
              </h2>
              <Badge variant="teal">Google Gemini Live</Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '2px' }}>
              Academic mentor powered by Gemini • Grounded in Central Drive study documents
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Badge variant="slate" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.15)' }}>
            <Sparkles size={12} color="#38bdf8" />
            <span>Interactive AI</span>
          </Badge>
        </div>
      </div>

      {/* Prompt Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '4px 6px 4px 16px',
            backdropFilter: 'blur(6px)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your AI tutor anything or pick an example prompt below..."
            aria-label="Ask the AI study assistant"
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.9375rem',
              padding: '8px 0',
            }}
          />

          <Button
            type="submit"
            variant="accent"
            size="md"
            icon={isLoading ? Loader2 : Send}
            disabled={!question.trim() || isLoading}
            style={{ flexShrink: 0 }}
          >
            {isLoading ? 'Thinking...' : 'Ask AI'}
          </Button>
        </div>
      </form>

      {/* Quick Prompts */}
      <div style={{ marginTop: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: '#cbd5e1',
            marginBottom: '8px',
          }}
        >
          <Lightbulb size={13} color="#facc15" />
          <span>Try an example study prompt:</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {examplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePromptClick(prompt.text)}
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              className="prompt-chip"
            >
              <span>{prompt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live AI Response Preview */}
      {liveAnswer && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '18px',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38bdf8' }}>
                Gemini Response
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {liveAnswer.timestamp}
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '8px' }}>
            <strong>Question:</strong> "{liveAnswer.query}"
          </p>

          <div style={{ fontSize: '0.875rem', color: '#f1f5f9', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {liveAnswer.answer}
          </div>

          {liveAnswer.citations && liveAnswer.citations.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {liveAnswer.citations.map((cite, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(13, 148, 136, 0.3)',
                    color: '#5eead4',
                  }}
                >
                  Source: {cite.document_title} (Page {cite.page_number})
                </span>
              ))}
            </div>
          )}

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {onNavigateToAI && (
              <button
                onClick={onNavigateToAI}
                style={{
                  fontSize: '0.75rem',
                  color: '#38bdf8',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                <span>Open full AI Study Workspace</span>
                <ArrowRight size={12} />
              </button>
            )}
            <button
              onClick={() => setLiveAnswer(null)}
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
