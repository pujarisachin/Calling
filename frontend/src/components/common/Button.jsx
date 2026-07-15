import React from 'react';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white hover:shadow-lg active:scale-95',
        secondary: 'bg-bg-secondary border border-border-light text-text-primary hover:bg-bg-tertiary',
        ghost: 'text-text-primary hover:bg-bg-secondary',
        danger: 'bg-error text-white hover:bg-red-700 active:scale-95',
        success: 'bg-success text-white hover:bg-green-700 active:scale-95',
        warning: 'bg-warning text-white hover:bg-amber-600 active:scale-95',
      },
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm h-8',
        md: 'px-4 py-2 text-base h-10',
        lg: 'px-6 py-3 text-base h-12',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const Button = React.forwardRef(
  ({ className, variant, size, fullWidth, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={buttonVariants({ variant, size, fullWidth })}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
