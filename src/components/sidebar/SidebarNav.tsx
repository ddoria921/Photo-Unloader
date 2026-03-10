import type { FileFilter } from '@/types';

interface SidebarNavProps {
  activeFilter: FileFilter;
  onFilterChange: (filter: FileFilter) => void;
  queueCount: number;
  duplicateCount: number;
  importedCount: number;
  errorCount: number;
}

const navItems: Array<{ filter: FileFilter; label: string; icon: string }> = [
  { filter: 'all',    label: 'Import Queue', icon: '⊞' },
  { filter: 'dupes',  label: 'Duplicates',   icon: '⊘' },
  { filter: 'new',    label: 'Imported',     icon: '✓' },
  { filter: 'errors', label: 'Errors',       icon: '⚠' }
];

export function SidebarNav({
  activeFilter,
  onFilterChange,
  queueCount,
  duplicateCount,
  importedCount,
  errorCount
}: SidebarNavProps) {
  const counts: Record<FileFilter, number> = {
    all:    queueCount,
    dupes:  duplicateCount,
    new:    importedCount,
    errors: errorCount,
    raw:    0,
    jpg:    0
  };

  return (
    <div className="sidebar-section">
      <span className="sidebar-section-label">Views</span>
      <nav className="sidebar-nav">
        {navItems.map(({ filter, label, icon }) => {
          const count = counts[filter] ?? 0;
          return (
            <div
              key={filter}
              className={`nav-item${activeFilter === filter ? ' active' : ''}`}
              onClick={() => onFilterChange(filter)}
            >
              <span className="nav-item-icon">{icon}</span>
              <span className="nav-item-label">{label}</span>
              {count > 0 && <span className="nav-badge">{count.toLocaleString()}</span>}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
