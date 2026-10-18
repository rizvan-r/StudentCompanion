import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: '8px' }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '6px', listStyle: 'none', padding: 0, margin: 0, fontSize: '0.75rem' }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {index > 0 && <ChevronRight size={12} color="var(--text-tertiary)" />}
              {isLast || !item.to ? (
                <span style={{ color: 'var(--text-secondary)', fontWeight: isLast ? 600 : 400 }}>
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, badge }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '640px', lineHeight: 1.4 }}>
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
