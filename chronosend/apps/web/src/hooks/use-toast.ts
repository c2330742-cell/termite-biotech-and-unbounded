import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

let toastId = 0;
let globalSetToasts: ((toasts: Toast[] | ((prev: Toast[]) => Toast[])) => void) | null = null;

export function toast(title: string, options?: { description?: string; variant?: Toast['variant'] }) {
  const id = String(++toastId);
  if (globalSetToasts) {
    globalSetToasts((prev) => [...prev, { id, title, ...options }]);
  }
  setTimeout(() => {
    if (globalSetToasts) {
      globalSetToasts((prev) => prev.filter((t) => t.id !== id));
    }
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  globalSetToasts = setToasts;

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((title: string, options?: { description?: string; variant?: Toast['variant'] }) => {
    toast(title, options);
  }, []);

  return { toasts, dismiss, show, setToasts };
}
