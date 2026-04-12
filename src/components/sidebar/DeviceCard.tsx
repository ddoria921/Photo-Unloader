import type { ChangeEvent } from 'react';
import { formatBytes, shortFileName } from '@/lib/utils';
import type { DashboardPhase, ScanResult } from '@/types';

interface DeviceCardProps {
  sourcePath: string;
  scanResult: ScanResult | null;
  phase: DashboardPhase;
  loading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBrowse: () => void;
  onReset: () => void;
  onSelectBrowserDirectory: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function DeviceCard({
  sourcePath,
  scanResult,
  phase,
  loading,
  fileInputRef,
  onReset,
  onSelectBrowserDirectory
}: DeviceCardProps) {
  const hasSource = !!sourcePath;

  return (
    <div className="sidebar-section">
      <span className="sidebar-section-label">Source</span>

      {hasSource ? (
        <div className="device-card">
          <div className="device-source-row">
            <div className="device-name">{shortFileName(sourcePath)}</div>
            <button
              className="device-source-reset"
              onClick={onReset}
              disabled={loading || phase === 'importing'}
              title="Clear source"
              aria-label="Clear source"
            >
              ×
            </button>
          </div>
          <div className="device-meta">{sourcePath}</div>
          {scanResult && (
            <div className="device-meta">
              {scanResult.files.length.toLocaleString()} files · {formatBytes(scanResult.totalSizeBytes)}
            </div>
          )}
          {scanResult && scanResult.totalSizeBytes > 0 && (
            <div className="device-bar-track">
              <div className="device-bar-fill" style={{ width: '62%' }} />
            </div>
          )}
        </div>
      ) : (
        <div className="device-card-empty">
          <span className="device-card-empty-label">No source selected</span>
        </div>
      )}

      {/* Hidden file input for browser mode */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={onSelectBrowserDirectory}
      />
    </div>
  );
}
