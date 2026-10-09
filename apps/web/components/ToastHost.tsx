'use client';

import { useEffect, useRef, useState } from 'react';

export type ToastDetail = { message: string; type: 'success' | 'error' };

export function ToastHost() {
  const [toasts, setToasts] = useState<(ToastDetail & { id: number })[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const show = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) return;
      const id = ++nextId.current;
      setToasts((current) => [...current.slice(-2), { ...detail, id }]);
      timers.current.push(
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 6000),
      );
    };
    window.addEventListener('bloodsync:toast', show);
    return () => {
      window.removeEventListener('bloodsync:toast', show);
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <div className="toast-stack" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          className={`toast toast-${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
          key={toast.id}
        >
          <span className="toast-symbol" aria-hidden="true">
            {toast.type === 'error' ? '!' : '✓'}
          </span>
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
