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
        className="fixed inset-0 z-modal bg-black bg-opacity-50 flex items-center justify-center transition-all duration-200"
        onClick={(e) => closeOnOutsideClick && e.target === e.currentTarget && onClose()}
      >
        <div
          ref={ref}
          className={`bg-surface-1 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto w-full mx-4 ${sizeClasses[size]}`}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-border-light sticky top-0 bg-surface-1">
              <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-bg-secondary rounded-lg transition-colors duration-200"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border-light sticky bottom-0 bg-surface-1">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';
