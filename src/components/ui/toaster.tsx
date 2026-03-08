import { Toast, type ToastVariant } from '@/components/ui/toast';

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToasterProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <section className="ui-toaster" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id}>
          <Toast
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            onClose={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </section>
  );
}
