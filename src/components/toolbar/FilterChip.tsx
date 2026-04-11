import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  badgeVariant?: 'amber' | 'red';
}

export function FilterChip({ label, active, onClick, badge, badgeVariant }: FilterChipProps) {
  return (
    <button
      className={cn('filter-chip', active && 'active')}
      onClick={onClick}
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
    >
      {label}
      {badge != null && badge > 0 && (
        <span className={cn('filter-chip-badge', badgeVariant === 'red' ? 'filter-chip-badge-red' : 'filter-chip-badge-amber')}>
          {badge}
        </span>
      )}
    </button>
  );
}
