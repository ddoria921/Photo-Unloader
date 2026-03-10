import { useEffect, useRef } from 'react';
import type { DashboardPhase, FileTableRow } from '@/types';
import { FileTableEmpty } from './FileTableEmpty';
import { FileTableRow as FileTableRowComponent } from './FileTableRow';

interface FileTableProps {
  rows: FileTableRow[];
  selectedIndex: number | null;
  phase: DashboardPhase;
  onRowSelect: (index: number) => void;
}

export function FileTable({ rows, selectedIndex, phase, onRowSelect }: FileTableProps) {
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
                <input type="checkbox" readOnly checked={rows.length > 0} />
              </th>
              <th className="col-thumb">—</th>
              <th className="col-name">Filename</th>
              <th className="col-type">Type</th>
              <th className="col-date">Date / Time</th>
              <th className="col-size">Size</th>
              <th className="col-dest">Destination</th>
              <th className="col-status">Status</th>
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {rows.map((row, i) => (
              <FileTableRowComponent
                key={row.file.path}
                row={row}
                index={i}
                isSelected={selectedIndex === i}
                onSelect={onRowSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
