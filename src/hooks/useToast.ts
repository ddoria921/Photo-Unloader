import { useRef, useState } from 'react';
import type { ToastItem } from '@/components/ui/toaster';

const TOAST_DURATION_MS = 4500;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastIdRef = useRef(1);
  const toastTimeoutsRef = useRef<Map<number, number>>(new Map());

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timeout = toastTimeoutsRef.current.get(id);
    if (timeout !== undefined) {
      window.clearTimeout(timeout);
      toastTimeoutsRef.current.delete(id);
    }
  };

  const showToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = nextToastIdRef.current;
    nextToastIdRef.current += 1;
    setToasts((current) => [...current, { id, ...toast }]);
    const timeout = window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    toastTimeoutsRef.current.set(id, timeout);
  };

  const clearAllToastTimers = () => {
    for (const timeout of toastTimeoutsRef.current.values()) {
      window.clearTimeout(timeout);
    }
    toastTimeoutsRef.current.clear();
  };

  return { toasts, showToast, dismissToast, clearAllToastTimers };
}
