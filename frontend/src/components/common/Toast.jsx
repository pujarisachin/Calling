import React, { useEffect, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

const iconMap = {
  success: <CheckCircle size={20} className="text-green-500" />,
  error: <AlertCircle size={20} className="text-red-500" />,
  warning: <AlertCircle size={20} className="text-yellow-500" />,
  info: <Info size={20} className="text-blue-500" />,
};

const bgMap = {
  success: { light: '#10B981', dark: '#059669' },
  error: { light: '#EF4444', dark: '#DC2626' },
  warning: { light: '#F59E0B', dark: '#D97706' },
  info: { light: '#3B82F6', dark: '#2563EB' },
};

export const Toast = React.forwardRef(
  ({ type = 'info', title, message, onClose, autoClose = 5000, action }, ref) => {
    const { theme } = useContext(ThemeContext);

    useEffect(() => {
      if (!autoClose) return;
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }, [autoClose, onClose]);

    const bgColor = bgMap[type]?.[theme] || bgMap.info[theme];

    return (
      <div
        ref={ref}
        className="flex items-start gap-3 px-4 py-3 rounded-lg text-white shadow-lg animate-in fade-in slide-in-from-right-5 transition-all duration-300"
        style={{ backgroundColor: bgColor }}
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
