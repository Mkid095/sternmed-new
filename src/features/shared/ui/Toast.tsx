/**
 * Toast Notification System
 *
 * Provides non-intrusive toast notifications for user feedback.
 * Replaces native alert() dialogs with a better UX.
 *
 * @module Toast
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification data
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;

  /** Type of toast */
  type: ToastType;

  /** Message to display */
  message: string;

  /** Optional title */
  title?: string;

  /** Duration in milliseconds (0 for no auto-dismiss) */
  duration?: number;
}

/**
 * Toast context interface
 */
interface ToastContextValue {
  /** Add a toast notification */
  show: (toast: Omit<Toast, 'id'>) => void;

  /** Remove a toast by id */
  remove: (id: string) => void;

  /** Clear all toasts */
  clear: () => void;
}

/**
 * Toast context
 */
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast Provider Props
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Generate unique toast ID
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Toast Provider Component
 *
 * Wraps the app to provide toast functionality to all components.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Show a toast notification
   */
  const show = useCallback((toast: Omit<Toast, 'id'>) => {
    const newToast: Toast = {
      ...toast,
      id: generateId(),
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration (if specified)
    if (toast.duration !== 0) {
      setTimeout(() => {
        remove(newToast.id);
      }, toast.duration || 5000);
    }
  }, []);

  /**
   * Remove a toast by id
   */
  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ show, remove, clear }}>
      {children}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

/**
 * Use toast hook
 *
 * @example
 * const toast = useToast();
 * toast.show({ type: 'success', message: 'Saved successfully!' });
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

/**
 * Convenience hooks for specific toast types
 */
export function useToastSuccess() {
  const toast = useToast();

  return useCallback((message: string, title?: string) => {
    toast.show({ type: 'success', message, title });
  }, [toast]);
}

export function useToastError() {
  const toast = useToast();

  return useCallback((message: string, title?: string) => {
    toast.show({ type: 'error', message, title, duration: 0 }); // Don't auto-dismiss errors
  }, [toast]);
}

export function useToastWarning() {
  const toast = useToast();

  return useCallback((message: string, title?: string) => {
    toast.show({ type: 'warning', message, title });
  }, [toast]);
}

export function useToastInfo() {
  const toast = useToast();

  return useCallback((message: string, title?: string) => {
    toast.show({ type: 'info', message, title });
  }, [toast]);
}

/**
 * Toast container component
 */
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full"
      role="alert"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const item = <ToastItem toast={toast} onRemove={onRemove} />;
        return <React.Fragment key={toast.id}>{item}</React.Fragment>;
      })}
    </div>
  );
}

/**
 * Individual toast item
 */
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <div
      className={`bg-white border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in ${
        getToastStyles(toast.type)
      }`}
    >
      {/* Icon */}
      <ToastIcon type={toast.type} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm text-slate-900 mb-1">
            {toast.title}
          </p>
        )}
        <p className="text-sm text-slate-700">{toast.message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}

/**
 * Get toast styles based on type
 */
function getToastStyles(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'border-green-200';
    case 'error':
      return 'border-red-200';
    case 'warning':
      return 'border-yellow-200';
    case 'info':
      return 'border-blue-200';
    default:
      return 'border-slate-200';
  }
}

/**
 * Toast icon based on type
 */
interface ToastIconProps {
  type: ToastType;
}

function ToastIcon({ type }: ToastIconProps) {
  const icons = {
    success: <CheckCircle size={20} className="text-green-500 flex-shrink-0" />,
    error: <AlertCircle size={20} className="text-red-500 flex-shrink-0" />,
    warning: <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0" />,
    info: <Info size={20} className="text-blue-500 flex-shrink-0" />,
  };

  return icons[type];
}

/**
 * Add slide-in animation
 */
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('toast-animations')) {
  style.id = 'toast-animations';
  document.head.appendChild(style);
}
