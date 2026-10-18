import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toastFn = (msg, type = 'info', duration = 4000) => addToast(msg, type, duration);
  toastFn.success = (msg, duration) => addToast(msg, 'success', duration);
  toastFn.error = (msg, duration) => addToast(msg, 'error', duration);
  toastFn.warning = (msg, duration) => addToast(msg, 'warning', duration);
  toastFn.info = (msg, duration) => addToast(msg, 'info', duration);
  toastFn.toast = toastFn;

  return (
    <ToastContext.Provider value={toastFn}>
      {children}
      {/* Toast container floating bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          pointerEvents: 'none',
        }}
        aria-live="polite"
      >
        {toasts.map((t) => {
          let bgColor = 'var(--bg-surface)';
          let borderColor = 'var(--border-subtle)';
          let textColor = 'var(--text-primary)';
          let Icon = Info;
          let iconColor = 'var(--color-primary)';

          if (t.type === 'success') {
            borderColor = 'rgba(16, 185, 129, 0.4)';
            Icon = CheckCircle2;
            iconColor = 'var(--color-success)';
          } else if (t.type === 'error') {
            borderColor = 'rgba(239, 68, 68, 0.4)';
            Icon = AlertCircle;
            iconColor = 'var(--color-danger)';
          } else if (t.type === 'warning') {
            borderColor = 'rgba(245, 158, 11, 0.4)';
            Icon = AlertTriangle;
            iconColor = 'var(--color-warning)';
          }

          return (
            <div
              key={t.id}
              className="animate-fade-in"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                boxShadow: 'var(--shadow-md)',
                color: textColor,
                fontSize: '0.875rem',
                lineHeight: 1.4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Dismiss toast"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
