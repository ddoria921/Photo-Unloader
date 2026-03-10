import { cn } from '@/lib/utils';

interface ProgressBarProps {
  percent: number;
  animating?: boolean;
}

export function ProgressBar({ percent, animating }: ProgressBarProps) {
  return (
    <div className="progress-bar-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn('progress-bar-fill', animating && 'progress-bar-fill-animating')}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
