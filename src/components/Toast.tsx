import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastCallbacks: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const toast: Toast = {
    id: Math.random().toString(36).substring(7),
    message,
    type
  };
  // Also dispatch custom event for global access
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: toast }));
  }
  toastCallbacks.forEach(cb => cb(toast));
}

export function subscribeToasts(callback: (toast: Toast) => void) {
  toastCallbacks.push(callback);
  return () => {
    toastCallbacks = toastCallbacks.filter(cb => cb !== callback);
  };
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Listen to custom events from inline scripts
    const handleEvent = (e: Event) => {
      const toast = (e as CustomEvent).detail as Toast;
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 3000);
    };
    window.addEventListener('show-toast', handleEvent);

    return subscribeToasts((toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 3000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-in ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            'bg-indigo-600'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
