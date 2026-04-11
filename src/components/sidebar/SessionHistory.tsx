import { shortFileName } from '@/lib/utils';
import type { SessionRecord } from '@/types';

interface SessionHistoryProps {
  sessions: SessionRecord[];
}

type SessionStatus = 'success' | 'error' | 'warning';

function getSessionStatus(s: SessionRecord): SessionStatus {
  if (s.errorCount > 0) return 'error';
  if (s.skippedCount > 0) return 'warning';
  return 'success';
}

function compactStats(s: SessionRecord): string {
  if (s.errorCount > 0) return `${s.copiedCount} copied · ${s.errorCount} error${s.errorCount !== 1 ? 's' : ''}`;
  if (s.skippedCount > 0) return `${s.copiedCount} copied · ${s.skippedCount} skipped`;
  return `${s.copiedCount} copied`;
}

function dotTooltip(s: SessionRecord): string {
  if (s.errorCount > 0) return `${s.errorCount} error${s.errorCount !== 1 ? 's' : ''}`;
  if (s.skippedCount > 0) return `${s.skippedCount} skipped`;
  return 'All files copied successfully';
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
          {sessions.map((s) => {
            const status = getSessionStatus(s);
            return (
              <div
                key={s.id}
                className={`session-item session-item-${status}`}
              >
                <div className="session-item-top">
                  <span className="session-source">{shortFileName(s.sourcePath)}</span>
                  <span
                    className={`session-status-dot session-status-dot-${status}`}
                    title={dotTooltip(s)}
                  />
                </div>
                <div className="session-item-bottom">
                  <span className="session-date">{formatDate(s.completedAt)}</span>
                  <span className="session-stats">{compactStats(s)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
