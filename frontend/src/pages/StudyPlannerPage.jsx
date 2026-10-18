import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Play,
  Pause,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function StudyPlannerPage() {
  // Focus Pomodoro Timer (Local Interactive Demo)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  const toggleTimer = () => setTimerRunning((r) => !r);
  const resetTimer = () => {
    setTimerRunning(false);
    setSecondsLeft(25 * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const scheduleDays = [
    { day: 'Mon', tasks: 'Math 202 Problem Set • CS 210 Lab', active: false },
    { day: 'Tue', tasks: 'OS Chapter 4 • Networks Review', active: false },
    { day: 'Wed', tasks: 'Discrete Math Quiz Review', active: true },
    { day: 'Thu', tasks: 'Database ER Diagram Project', active: false },
    { day: 'Fri', tasks: 'Mini-project Git check-in', active: false },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Study Planner & Academic Schedule
            </h2>
            <Badge variant="teal">Sample Planner</Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Structure your coursework, timetable, and focused study sessions
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Pomodoro Focus Station */}
        <Card
          title="Pomodoro Focus Station"
          subtitle="25-minute deep academic focus cycle"
          icon={Clock}
          badge={<Badge variant="indigo">Interactive</Badge>}
          headerBorder
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 0',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '3rem',
                fontWeight: 800,
                color: timerRunning ? 'var(--color-primary)' : 'var(--text-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              {formattedTime}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {timerRunning ? '⚡ Focus in progress: discrete notes' : 'Ready to start study interval'}
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Button
                variant={timerRunning ? 'outline' : 'primary'}
                icon={timerRunning ? Pause : Play}
                onClick={toggleTimer}
              >
                {timerRunning ? 'Pause' : 'Start Focus'}
              </Button>
              <Button variant="ghost" icon={RotateCcw} onClick={resetTimer}>
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Weekly Milestones */}
        <Card
          title="Weekly Study Roadmap"
          subtitle="Target milestones for mid-term preparation"
          icon={CalendarCheck}
          badge={<Badge variant="slate">Sample Data</Badge>}
          headerBorder
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scheduleDays.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: s.active ? 'var(--color-primary-light)' : 'var(--bg-app)',
                  border: '1px solid',
                  borderColor: s.active ? 'rgba(49, 46, 129, 0.2)' : 'var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    width: '38px',
                    color: s.active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {s.day}
                </span>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: s.active ? 'var(--color-primary)' : 'var(--text-primary)',
                    fontWeight: s.active ? 600 : 500,
                  }}
                >
                  {s.tasks}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
