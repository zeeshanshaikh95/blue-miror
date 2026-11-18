import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

export type ToastApi = {
  push: (toast: { title: string; description?: string; tone?: ToastTone }) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return context;
}
