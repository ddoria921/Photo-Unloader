import { useEffect, useRef, useState } from 'react';
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

interface ColWidths {
  name: number;
  type: number;
  date: number;
  camera: number;
  exposure: number;
  size: number;
  dest: number;
  status: number;
}

const DEFAULT_WIDTHS: ColWidths = {
  name: 220,
  type: 56,
  date: 100,
  camera: 110,
  exposure: 120,
  size: 66,
  dest: 150,
  status: 76,
};

const FIXED_CHECK = 28;
const FIXED_THUMB = 44;
const MIN_COL_WIDTH = 40;

export function FileTable({ rows, selectedIndex, phase, sortKey, sortDir, excludedFiles, onRowSelect, onSortChange, onToggleFileExclusion, onToggleAllFiles }: FileTableProps) {
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);
  const [colWidths, setColWidths] = useState<ColWidths>(DEFAULT_WIDTHS);
  const dragRef = useRef<{ col: keyof ColWidths; startX: number; startWidth: number } | null>(null);

  // Auto-scroll to bottom during import
  useEffect(() => {
    if (phase === 'importing' && tbodyRef.current) {
      const wrap = tbodyRef.current.closest('.file-table-wrap');
      if (wrap) {
        wrap.scrollTop = wrap.scrollHeight;
      }
    }
  }, [rows.length, phase]);

  // Scroll selected row into view when selection changes
  useEffect(() => {
    if (selectedIndex === null || !tbodyRef.current) return;
    const row = tbodyRef.current.children[selectedIndex] as HTMLElement | undefined;
    row?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Global mouse event listeners for column resize
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { col, startX, startWidth } = dragRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(MIN_COL_WIDTH, startWidth + delta);
      setColWidths((prev) => ({ ...prev, [col]: newWidth }));
    };

    const onMouseUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (rows.length === 0) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    if (selectedIndex === null) {
      onRowSelect(e.key === 'ArrowDown' ? 0 : rows.length - 1);
    } else if (e.key === 'ArrowDown' && selectedIndex < rows.length - 1) {
      onRowSelect(selectedIndex + 1);
    } else if (e.key === 'ArrowUp' && selectedIndex > 0) {
      onRowSelect(selectedIndex - 1);
    }
  };

  const startResize = (e: React.MouseEvent, col: keyof ColWidths) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { col, startX: e.clientX, startWidth: colWidths[col] };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  if (phase === 'idle' || phase === 'scanning') {
    return (
      <div className="file-table-area">
        <FileTableEmpty scanning={phase === 'scanning'} />
      </div>
    );
  }

  const totalWidth = FIXED_CHECK + FIXED_THUMB +
    colWidths.name + colWidths.type + colWidths.date +
    colWidths.camera + colWidths.exposure + colWidths.size +
    colWidths.dest + colWidths.status;

  return (
    <div className="file-table-area">
      <div className="file-table-wrap" tabIndex={0} onKeyDown={handleKeyDown} style={{ outline: 'none' }}>
        <table className="file-table" style={{ width: totalWidth, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: FIXED_CHECK }} />
            <col style={{ width: FIXED_THUMB }} />
            <col style={{ width: colWidths.name }} />
            <col style={{ width: colWidths.type }} />
            <col style={{ width: colWidths.date }} />
            <col style={{ width: colWidths.camera }} />
            <col style={{ width: colWidths.exposure }} />
            <col style={{ width: colWidths.size }} />
            <col style={{ width: colWidths.dest }} />
            <col style={{ width: colWidths.status }} />
          </colgroup>
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && rows.every((r) => !excludedFiles.has(r.file.path))}
                  onChange={onToggleAllFiles}
                />
              </th>
              <th className="col-thumb">—</th>
              <th className="col-name col-sortable col-resizable" onClick={() => onSortChange('filename')}>
                Filename <SortIndicator active={sortKey === 'filename'} dir={sortDir} />
                <div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'name')} />
              </th>
              <th className="col-type col-sortable col-resizable" onClick={() => onSortChange('type')}>
                Type <SortIndicator active={sortKey === 'type'} dir={sortDir} />
                <div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'type')} />
              </th>
              <th className="col-date col-sortable col-resizable" onClick={() => onSortChange('date')}>
                Date / Time <SortIndicator active={sortKey === 'date'} dir={sortDir} />
                <div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'date')} />
              </th>
              <th className="col-camera col-resizable">
                Camera
                <div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'camera')} />
              </th>
              <th className="col-exposure col-resizable">
                Exposure
                <div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'exposure')} />
              </th>
              <th className="col-size col-sortable col-resizable" onClick={() => onSortChange('size')}>
                Size <SortIndicator active={sortKey === 'size'} dir={sortDir} />
                <div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'size')} />
              </th>
              <th className="col-dest col-resizable">
                Destination
                <div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'dest')} />
              </th>
              <th className="col-status col-sortable col-resizable" onClick={() => onSortChange('status')}>
                Status <SortIndicator active={sortKey === 'status'} dir={sortDir} />
                <div className="col-resize-handle" onMouseDown={(e) => startResize(e, 'status')} />
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
