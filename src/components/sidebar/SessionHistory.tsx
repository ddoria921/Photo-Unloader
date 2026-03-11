import { shortFileName } from '@/lib/utils';
import type { SessionRecord } from '@/types';

interface SessionHistoryProps {
  sessions: SessionRecord[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  return (
    <div className="sidebar-section" style={{ borderBottom: 'none' }}>
      <span className="sidebar-section-label">Sessions</span>
      {sessions.length === 0 ? (
        <div className="session-empty">No past sessions</div>
      ) : (
        <div className="session-list">
          {sessions.map((s) => (
            <div key={s.id} className={`session-item${s.completedWithErrors ? ' session-item-warn' : ''}`}>
              <div className="session-item-top">
                <span className="session-source">{shortFileName(s.sourcePath)}</span>
                <span className="session-date">{formatDate(s.completedAt)}</span>
              </div>
              <div className="session-item-stats">
                <span className="session-stat session-stat-ok">{s.copiedCount} copied</span>
                {s.skippedCount > 0 && <span className="session-stat session-stat-dim">{s.skippedCount} skipped</span>}
                {s.errorCount > 0 && <span className="session-stat session-stat-err">{s.errorCount} errors</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
