import { useEffect } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import './toast.css';

/**
 * Toast Container & Notification Item (React Bits)
 *
 * Provides non-intrusive, auto-dismissing animated toast notifications.
 */
export default function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-portal-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 size={18} className="toast-icon text-emerald" />,
    info: <Info size={18} className="toast-icon text-indigo" />,
    warning: <AlertTriangle size={18} className="toast-icon text-amber" />,
    error: <XCircle size={18} className="toast-icon text-rose" />,
  };

  return (
    <div className={`toast-card toast-${toast.type || 'info'}`}>
      <div className="toast-lead">
        {icons[toast.type || 'info']}
        <div className="toast-content">
          {toast.title && <strong className="toast-title">{toast.title}</strong>}
          <p className="toast-message">{toast.message}</p>
        </div>
      </div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

