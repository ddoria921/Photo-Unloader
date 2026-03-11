import { useEffect, useRef } from 'react';
import type { DashboardPhase, FileTableRow, SortDir, SortKey } from '@/types';
import { FileTableEmpty } from './FileTableEmpty';
import { FileTableRow as FileTableRowComponent } from './FileTableRow';

interface FileTableProps {
  rows: FileTableRow[];
  selectedIndex: number | null;
  phase: DashboardPhase;
  sortKey: SortKey;
  sortDir: SortDir;
  excludedFiles: Set<string>;
  onRowSelect: (index: number) => void;
  onSortChange: (key: SortKey) => void;
  onToggleFileExclusion: (path: string) => void;
  onToggleAllFiles: () => void;
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="sort-indicator sort-indicator-idle">⇅</span>;
  return <span className="sort-indicator sort-indicator-active">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export function FileTable({ rows, selectedIndex, phase, sortKey, sortDir, excludedFiles, onRowSelect, onSortChange, onToggleFileExclusion, onToggleAllFiles }: FileTableProps) {
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);

  // Auto-scroll to bottom during import
  useEffect(() => {
    if (phase === 'importing' && tbodyRef.current) {
      const wrap = tbodyRef.current.closest('.file-table-wrap');
      if (wrap) {
        wrap.scrollTop = wrap.scrollHeight;
      }
    }
  }, [rows.length, phase]);

  if (phase === 'idle' || phase === 'scanning') {
    return (
      <div className="file-table-area">
        <FileTableEmpty scanning={phase === 'scanning'} />
      </div>
    );
  }

  return (
    <div className="file-table-area">
      <div className="file-table-wrap">
        <table className="file-table">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && excludedFiles.size === 0}
                  onChange={onToggleAllFiles}
                />
              </th>
              <th className="col-thumb">—</th>
              <th className="col-name col-sortable" onClick={() => onSortChange('filename')}>
                Filename <SortIndicator active={sortKey === 'filename'} dir={sortDir} />
              </th>
              <th className="col-type col-sortable" onClick={() => onSortChange('type')}>
                Type <SortIndicator active={sortKey === 'type'} dir={sortDir} />
              </th>
              <th className="col-date col-sortable" onClick={() => onSortChange('date')}>
                Date / Time <SortIndicator active={sortKey === 'date'} dir={sortDir} />
              </th>
              <th className="col-camera">Camera</th>
              <th className="col-exposure">Exposure</th>
              <th className="col-size col-sortable" onClick={() => onSortChange('size')}>
                Size <SortIndicator active={sortKey === 'size'} dir={sortDir} />
              </th>
              <th className="col-dest">Destination</th>
              <th className="col-status col-sortable" onClick={() => onSortChange('status')}>
                Status <SortIndicator active={sortKey === 'status'} dir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {rows.map((row, i) => (
              <FileTableRowComponent
                key={row.file.path}
                row={row}
                index={i}
                isSelected={selectedIndex === i}
                isExcluded={excludedFiles.has(row.file.path)}
                onSelect={onRowSelect}
                onToggleExclusion={onToggleFileExclusion}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
