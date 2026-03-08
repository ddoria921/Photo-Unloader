import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'destructive';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  onClose: () => void;
}

export function Toast({ title, description, variant = 'default', onClose }: ToastProps) {
  return (
    <article className={cn('ui-toast', variant === 'destructive' && 'ui-toast--destructive')} role="status">
      <div className="ui-toast__header">
        <div>
          <p className="ui-toast__title">{title}</p>
          {description && <p className="ui-toast__description">{description}</p>}
        </div>
        <button
          type="button"
          className="ui-toast__close"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          x
        </button>
      </div>
    </article>
  );
}
