import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      className={cn('filter-chip', active && 'active')}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
