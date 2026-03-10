import type { ChangeEvent } from 'react';
import { formatBytes } from '@/lib/utils';
import type { DashboardPhase, ScanResult } from '@/types';

interface DeviceCardProps {
  sourcePath: string;
  scanResult: ScanResult | null;
  phase: DashboardPhase;
  loading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBrowse: () => void;
  onSelectBrowserDirectory: (event: ChangeEvent<HTMLInputElement>) => void;
}

function deviceDisplayName(sourcePath: string): string {
  const normalized = sourcePath.replace(/\\/g, '/').replace(/\/$/, '');
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? sourcePath;
}

export function DeviceCard({
  sourcePath,
  scanResult,
  phase,
  loading,
  fileInputRef,
  onBrowse,
  onSelectBrowserDirectory
}: DeviceCardProps) {
  const hasSource = !!sourcePath;

  return (
    <div className="sidebar-section">
      <span className="sidebar-section-label">Source</span>

      {hasSource ? (
        <div className="device-card">
          <div className="device-name">{deviceDisplayName(sourcePath)}</div>
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
          <button
            className="browse-btn"
            onClick={onBrowse}
            disabled={loading || phase === 'importing'}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Scanning…' : '⟳ Rescan / Change'}
          </button>
        </div>
      ) : (
        <div className="device-card-empty">
          <span className="device-card-empty-label">No source selected</span>
          <button
            className="browse-btn"
            onClick={onBrowse}
            disabled={loading}
            style={{ marginTop: 0 }}
          >
            {loading ? 'Scanning…' : '⊕ Browse Folder'}
          </button>
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
