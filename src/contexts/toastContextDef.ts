import { createContext } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);
