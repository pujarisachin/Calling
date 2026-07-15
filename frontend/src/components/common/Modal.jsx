import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export const Modal = React.forwardRef(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      footer,
      size = 'md',
      closeOnEsc = true,
      closeOnOutsideClick = true,
    },
    ref
  ) => {
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e) => {
        if (closeOnEsc && e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'auto';
      };
    }, [isOpen, onClose, closeOnEsc]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
    };

    return (
      <div
        className="fixed inset-0 z-modal flex items-center justify-center transition-all duration-200"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
        onClick={(e) => closeOnOutsideClick && e.target === e.currentTarget && onClose()}
      >
        <div
          ref={ref}
          className={`rounded-lg shadow-xl max-h-[90vh] overflow-y-auto w-full mx-4 ${sizeClasses[size]}`}
          style={{ backgroundColor: 'var(--card-bg)' }}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b sticky top-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg transition-colors duration-200 hover:bg-opacity-50"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <X size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t sticky bottom-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';
