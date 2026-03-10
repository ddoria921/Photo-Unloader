import { formatBytes } from '@/lib/utils';
import type { DashboardPhase, ImportSummary, ProgressState, ScanResult } from '@/types';
import { StatGrid } from './StatGrid';
import { ProgressBar } from './ProgressBar';

interface ProgressPanelProps {
  phase: DashboardPhase;
  progressState: ProgressState | null;
  importSummary: ImportSummary | null;
  scanResult: ScanResult | null;
  progressPercent: number;
  importableCount: number;
  onOpenInFinder: () => void;
  onImportAnother: () => void;
}

function getStatusLabel(phase: DashboardPhase): string {
  switch (phase) {
    case 'idle':      return 'Idle';
    case 'scanning':  return 'Scanning…';
    case 'ready':     return 'Ready';
    case 'importing': return 'Importing…';
    case 'done':      return 'Complete';
    default:          return '—';
  }
}

export function ProgressPanel({
  phase,
  progressState,
  importSummary,
  scanResult,
  progressPercent,
  importableCount,
  onOpenInFinder,
  onImportAnother
}: ProgressPanelProps) {
  const queued    = progressState ? progressState.totalFiles - progressState.processedFiles
                 : scanResult ? importableCount : 0;
  const dupes     = progressState?.skippedCount ?? 0;
  const imported  = progressState?.copiedCount ?? importSummary?.copiedCount ?? 0;
  const errors    = progressState?.errorCount ?? importSummary?.errorCount ?? 0;

  const totalSize = scanResult?.totalSizeBytes ?? 0;

  const isAccentStatus = phase === 'ready' || phase === 'scanning';
  const statusLabel = getStatusLabel(phase);

  return (
    <div className="progress-col">
      <div className="progress-col-header">Import Status</div>

      <StatGrid
        queued={queued}
        dupes={dupes}
        imported={imported}
        errors={errors}
      />

      <div className="progress-section">
        <div className="progress-section-row">
          <span className="progress-section-label">Overall</span>
          <span className={`progress-section-val${isAccentStatus ? ' progress-section-val-accent' : ''}`}>
            {statusLabel}
          </span>
        </div>
        <ProgressBar percent={progressPercent} animating={phase === 'importing'} />
      </div>

      <div className="progress-meta">
        {totalSize > 0 && (
          <div className="progress-meta-row">
            <span className="progress-meta-label">Total Size</span>
            <span className="progress-meta-val">{formatBytes(totalSize)}</span>
          </div>
        )}
        {progressPercent > 0 && progressPercent < 100 && (
          <div className="progress-meta-row">
            <span className="progress-meta-label">Progress</span>
            <span className="progress-meta-val">{progressPercent}%</span>
          </div>
        )}
      </div>

      {phase === 'done' && (
        <div className="progress-action">
          <button className="progress-action-btn" onClick={onOpenInFinder}>
            Open in Finder
          </button>
          <button
            className="progress-action-btn progress-action-btn-primary"
            onClick={onImportAnother}
            style={{ marginTop: '6px' }}
          >
            Import Another
          </button>
        </div>
      )}
    </div>
  );
}
