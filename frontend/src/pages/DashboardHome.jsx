import React, { useRef } from 'react';
import { AICompanionCard } from '../components/dashboard/AICompanionCard';
import { AcademicOverview } from '../components/dashboard/AcademicOverview';
import { QuickActions } from '../components/dashboard/QuickActions';
import { CampusPulse } from '../components/dashboard/CampusPulse';

export function DashboardHome({
  searchQuery,
  onNavigateTab,
  onOpenPreview,
}) {
  const aiCardRef = useRef(null);

  const handleFocusAIInput = () => {
    if (aiCardRef.current) {
      aiCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = aiCardRef.current.querySelector('input');
      if (input) input.focus();
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. AI Companion Distinctive Panel */}
      <div ref={aiCardRef}>
        <AICompanionCard
          onNavigateToAI={() => onNavigateTab && onNavigateTab('ai-companion')}
        />
      </div>

      {/* 2. Campus Pulse Signature Feature */}
      <CampusPulse />

      {/* 3. Quick Campus Action Shortcuts */}
      <QuickActions
        onNavigateTab={onNavigateTab}
        onOpenPreview={onOpenPreview}
        onFocusAIInput={handleFocusAIInput}
      />

      {/* 4. Academic Overview Cards (Tasks, Deadlines, Notices, Requests) */}
      <div style={{ marginTop: '8px' }}>
        <AcademicOverview
          searchQuery={searchQuery}
          onOpenPreview={onOpenPreview}
          onNavigateTab={onNavigateTab}
        />
      </div>
    </div>
  );
}
