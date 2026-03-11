import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';
import type { FileTableRow as FileTableRowData, FileType } from '@/types';

interface FileTableRowProps {
  row: FileTableRowData;
  index: number;
  isSelected: boolean;
  isExcluded: boolean;
  onSelect: (index: number) => void;
  onToggleExclusion: (path: string) => void;
}

function getExtBadgeClass(fileType: FileType): string {
  switch (fileType) {
    case 'raw':   return 'ext-badge ext-badge-raw';
    case 'jpg':   return 'ext-badge ext-badge-jpg';
    case 'video': return 'ext-badge ext-badge-vid';
    default:      return 'ext-badge';
  }
}

function getExtLabel(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase();
  return ext ?? '—';
}

function getStatusBadge(status: FileTableRowData['status']): { label: string; cls: string } {
  switch (status) {
    case 'ready':     return { label: 'Ready',     cls: 'status-badge status-badge-ready' };
    case 'new':       return { label: 'New',       cls: 'status-badge status-badge-new' };
    case 'duplicate': return { label: 'Duplicate', cls: 'status-badge status-badge-duplicate' };
    case 'copied':    return { label: 'Copied',    cls: 'status-badge status-badge-copied' };
    case 'error':     return { label: 'Error',     cls: 'status-badge status-badge-error' };
    case 'skipped':   return { label: 'Skipped',   cls: 'status-badge status-badge-skipped' };
    default:          return { label: 'Ready',     cls: 'status-badge status-badge-ready' };
  }
}

function getRowClass(row: FileTableRowData, isSelected: boolean, isExcluded: boolean): string {
  return cn(
    isSelected && 'row-selected',
    isExcluded && 'row-excluded',
    row.status === 'duplicate' && 'row-duplicate',
    row.status === 'error' && 'row-error'
  );
}

function getBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}

export function FileTableRow({ row, index, isSelected, isExcluded, onSelect, onToggleExclusion }: FileTableRowProps) {
  const { file, status, destinationPath } = row;
  const { label: statusLabel, cls: statusCls } = getStatusBadge(status);
  const extLabel = getExtLabel(file.filename);
  const extCls = getExtBadgeClass(file.fileType);

  return (
    <tr
      className={getRowClass(row, isSelected, isExcluded)}
      onClick={() => onSelect(index)}
    >
      <td className="check-cell">
        <input
          type="checkbox"
          checked={!isExcluded}
          onChange={() => onToggleExclusion(file.path)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      <td>
        <div className="thumb-placeholder">{file.fileType === 'raw' ? 'RAW' : file.fileType === 'video' ? 'VID' : 'JPG'}</div>
      </td>

      <td>
        <div className="filename-cell">
          <span className={extCls}>{extLabel}</span>
          <span className="filename-text">{getBaseName(file.filename)}</span>
        </div>
      </td>

      <td>
        <span className="meta-text">{file.fileType}</span>
      </td>

      <td>
        <span className="meta-text">{file.capturedAt ? file.capturedAt.slice(0, 10) : '—'}</span>
      </td>

      <td>
        <span className="meta-text">
          {file.cameraModel ?? file.cameraMake ?? '—'}
        </span>
      </td>

      <td>
        <span className="meta-text exposure-cell">
          {[file.aperture, file.shutterSpeed, file.iso != null ? `ISO${file.iso}` : null]
            .filter(Boolean).join(' ') || '—'}
        </span>
      </td>

      <td>
        <span className="meta-text">{formatBytes(file.sizeBytes)}</span>
      </td>

      <td>
        {destinationPath ? (
          <span className="dest-path-cell">
            {row.destinationBase && destinationPath !== row.destinationBase ? (
              <>
                <span className="dest-segment-base">{row.destinationBase}</span>
                <span className="dest-segment-sub">{destinationPath.slice(row.destinationBase.length)}</span>
              </>
            ) : (
              <span className="dest-segment">{destinationPath}</span>
            )}
          </span>
        ) : (
          <span className="dest-path-cell">—</span>
        )}
      </td>

      <td>
        <span className={statusCls}>{statusLabel}</span>
      </td>
    </tr>
  );
}
