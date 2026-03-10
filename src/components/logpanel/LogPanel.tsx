import { useEffect, useRef, useState } from 'react';
import type { ImportLogEntry } from '@/types';
import { LogEntry } from './LogEntry';

interface LogPanelProps {
  entries: ImportLogEntry[];
  errorCount: number;
  skippedCount: number;
}

type TabId = 'activity' | 'errors' | 'skipped';

export function LogPanel({ entries, errorCount, skippedCount }: LogPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('activity');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (activeTab === 'activity' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, activeTab]);

  const visibleEntries = entries.filter((entry) => {
    if (activeTab === 'errors') return entry.level === 'error';
    if (activeTab === 'skipped') return entry.prefix === 'DUPE' || entry.level === 'warn';
    return true;
  });

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: 'activity', label: 'Activity Log' },
    { id: 'errors',   label: `Errors${errorCount > 0 ? ` (${errorCount})` : ''}` },
    { id: 'skipped',  label: `Skipped${skippedCount > 0 ? ` (${skippedCount})` : ''}` }
  ];

  return (
    <div className="logpanel">
      <div className="logpanel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="logpanel-entries" ref={scrollRef}>
        {visibleEntries.length === 0 ? (
          <div className="logpanel-empty">
            {activeTab === 'activity' ? 'Waiting for activity…' : 'None'}
          </div>
        ) : (
          visibleEntries.map((entry) => <LogEntry key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
