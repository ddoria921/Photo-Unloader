import type { DashboardPhase, FileFilter } from '@/types';
import { FilterChip } from './FilterChip';

interface ToolbarProps {
  activeFilter: FileFilter;
  onFilterChange: (filter: FileFilter) => void;
  totalCount: number;
  filteredCount: number;
  importableCount: number;
  phase: DashboardPhase;
  importing: boolean;
  loading: boolean;
  canStartImport: boolean;
  onRescan: () => void;
  onStartImport: () => void;
}

export function Toolbar({
  activeFilter,
  onFilterChange,
  totalCount,
  filteredCount,
  importableCount,
  phase,
  importing,
  loading,
  canStartImport,
  onRescan,
  onStartImport
}: ToolbarProps) {
  const showCount = totalCount > 0;

  return (
    <div className="toolbar">
      <span className="toolbar-label">Filter</span>

      <FilterChip label="ALL"  active={activeFilter === 'all'}  onClick={() => onFilterChange('all')} />
      <FilterChip label="RAW"  active={activeFilter === 'raw'}  onClick={() => onFilterChange('raw')} />
      <FilterChip label="JPG"  active={activeFilter === 'jpg'}  onClick={() => onFilterChange('jpg')} />

      <div className="toolbar-sep" />

      <FilterChip label="DUPES"   active={activeFilter === 'dupes'}   onClick={() => onFilterChange('dupes')} />
      <FilterChip label="NEW"     active={activeFilter === 'new'}     onClick={() => onFilterChange('new')} />
      <FilterChip label="ERRORS"  active={activeFilter === 'errors'}  onClick={() => onFilterChange('errors')} />

      <div className="toolbar-spacer" />

      {showCount && (
        <>
          <span className="toolbar-count">
            {filteredCount !== totalCount
              ? `${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()}`
              : `${totalCount.toLocaleString()} files`}
          </span>
          <div className="toolbar-sep" />
        </>
      )}

      <button
        className="btn btn-ghost"
        onClick={onRescan}
        disabled={loading || importing || !phase || phase === 'idle'}
        title="Rescan source folder"
      >
        ⟳ Rescan
      </button>

      <button
        className="btn btn-primary"
        onClick={onStartImport}
        disabled={!canStartImport}
        title="Start importing files"
      >
        {importing
          ? 'Importing…'
          : `↓ Import ${importableCount > 0 ? importableCount.toLocaleString() + ' files' : ''}`}
      </button>
    </div>
  );
}
