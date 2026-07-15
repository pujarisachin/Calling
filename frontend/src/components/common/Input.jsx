import React from 'react';

export const Input = React.forwardRef(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: error ? '#EF4444' : 'var(--border-color)',
            color: 'var(--text-primary)',
            focusRingColor: error ? '#EF4444' : '#4B6EF5',
            '--tw-ring-color': error ? '#EF4444' : '#4B6EF5',
          }}
          placeholder={props.placeholder}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-xs mt-1 transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = React.forwardRef(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none ${className}`}
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: error ? '#EF4444' : 'var(--border-color)',
            color: 'var(--text-primary)',
            '--tw-ring-color': error ? '#EF4444' : '#4B6EF5',
          }}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-xs mt-1 transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(
  ({ className = '', label, error, helperText, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: error ? '#EF4444' : 'var(--border-color)',
            color: 'var(--text-primary)',
            '--tw-ring-color': error ? '#EF4444' : '#4B6EF5',
          }}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-xs mt-1 transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
