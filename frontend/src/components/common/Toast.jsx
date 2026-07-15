import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const iconMap = {
  success: <CheckCircle size={20} className="text-success" />,
  error: <AlertCircle size={20} className="text-error" />,
  warning: <AlertCircle size={20} className="text-warning" />,
  info: <Info size={20} className="text-color-info" />,
};

const bgMap = {
  success: 'bg-success',
  error: 'bg-error',
  warning: 'bg-warning',
  info: 'bg-color-info',
};

export const Toast = React.forwardRef(
  ({ type = 'info', title, message, onClose, autoClose = 5000, action }, ref) => {
    useEffect(() => {
      if (!autoClose) return;
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }, [autoClose, onClose]);

    return (
      <div
        ref={ref}
        className={`flex items-start gap-3 px-4 py-3 rounded-lg text-white shadow-lg animate-in fade-in slide-in-from-right-5 ${bgMap[type]}`}
      >
        <div className="flex-shrink-0 mt-0.5">
          {iconMap[type]}
        </div>
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold text-sm">{title}</p>}
          {message && <p className="text-sm opacity-90">{message}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-medium opacity-90 hover:opacity-100 transition-opacity"
            >
              {action.label}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-white hover:bg-opacity-20 rounded transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-notification max-w-sm pointer-events-auto">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

ToastContainer.displayName = 'ToastContainer';
