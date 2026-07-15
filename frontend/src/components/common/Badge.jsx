import React from 'react';

const variantStyles = {
  default: 'text-white',
  primary: 'bg-blue-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-cyan-600 text-white',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const Badge = React.forwardRef(
  ({ className = '', variant = 'default', size = 'sm', children, ...props }, ref) => {
    const defaultStyle = variant === 'default' ? {
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
    } : {};

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        style={defaultStyle}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
