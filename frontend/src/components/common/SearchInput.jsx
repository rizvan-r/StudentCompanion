import React from 'react';
import { Search, X } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search...', onClear }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'var(--bg-app)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '0 10px',
        height: '36px',
        boxSizing: 'border-box',
        minWidth: '220px',
        flex: 1,
      }}
    >
      <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: 'none',
          backgroundColor: 'transparent',
          outline: 'none',
          fontSize: '0.8125rem',
          color: 'var(--text-primary)',
          width: '100%',
        }}
      />
      {value && (
        <button
          onClick={() => {
            if (onClear) onClear();
            else onChange('');
          }}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
          }}
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
