import { useRef } from 'react';
import type { DashboardPhase, FileFilter } from '@/types';
import { FilterChip } from './FilterChip';

const FILTERS: FileFilter[] = ['all', 'raw', 'jpg', 'dupes', 'new', 'errors'];

interface ToolbarProps {
  activeFilter: FileFilter;
  onFilterChange: (filter: FileFilter) => void;
  totalCount: number;
  filteredCount: number;
  importableCount: number;
  selectedCount: number;
  dupesCount: number;
  errorsCount: number;
  phase: DashboardPhase;
  importing: boolean;
  loading: boolean;
  canStartImport: boolean;
  onRescan: () => void;
  onStartImport: () => void;
  onCancelImport: () => void;
}

export function Toolbar({
  activeFilter,
  onFilterChange,
  totalCount,
  filteredCount,
  importableCount,
  selectedCount,
  dupesCount,
  errorsCount,
  phase,
  importing,
  loading,
  canStartImport,
  onRescan,
  onStartImport,
  onCancelImport,
}: ToolbarProps) {
  const showCount = totalCount > 0;
  const hasSelection = selectedCount > 0 && selectedCount < totalCount;
  const groupRef = useRef<HTMLDivElement>(null);

  const handleGroupKeyDown = (e: React.KeyboardEvent) => {
    const idx = FILTERS.indexOf(activeFilter);
    let nextIdx = idx;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % FILTERS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + FILTERS.length) % FILTERS.length;
    else return;
    e.preventDefault();
    onFilterChange(FILTERS[nextIdx]);
    const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
    buttons?.[nextIdx]?.focus();
  };

  return (
    <div className="toolbar" data-hidden={phase === 'idle' || undefined}>
      <span className="toolbar-label">Filter</span>

      <div
        ref={groupRef}
        role="tablist"
        aria-label="File filter"
        style={{ display: 'contents' }}
        onKeyDown={handleGroupKeyDown}
      >
        <FilterChip label="ALL"    active={activeFilter === 'all'}    onClick={() => onFilterChange('all')} />
        <FilterChip label="RAW"    active={activeFilter === 'raw'}    onClick={() => onFilterChange('raw')} />
        <FilterChip label="JPG"    active={activeFilter === 'jpg'}    onClick={() => onFilterChange('jpg')} />

        <div className="toolbar-sep" />

        <FilterChip label="DUPES"   active={activeFilter === 'dupes'}   onClick={() => onFilterChange('dupes')}  badge={dupesCount}  badgeVariant="amber" />
        <FilterChip label="NEW"     active={activeFilter === 'new'}     onClick={() => onFilterChange('new')} />
        <FilterChip label="ERRORS"  active={activeFilter === 'errors'}  onClick={() => onFilterChange('errors')} badge={errorsCount} badgeVariant="red" />
      </div>

      <div className="toolbar-spacer" />

      {showCount && (
        <>
          <span className="toolbar-count">
            {hasSelection
              ? `${selectedCount.toLocaleString()} selected · ${totalCount.toLocaleString()} total`
              : filteredCount !== totalCount
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

      {importing ? (
        <button
          className="btn btn-ghost"
          onClick={onCancelImport}
          title="Cancel import"
        >
          ✕ Cancel
        </button>
      ) : (
        <button
          className="btn btn-primary"
          onClick={onStartImport}
          disabled={!canStartImport}
          title="Start importing files"
        >
          {`↓ Import ${importableCount > 0 ? importableCount.toLocaleString() + ' files' : ''}`}
        </button>
      )}
    </div>
  );
}
