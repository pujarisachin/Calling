import React from 'react';

export const Card = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`bg-surface-1 border border-border-light rounded-lg p-6 shadow-sm transition-all duration-200 ${className}`}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center justify-between pb-4 border-b border-border-light ${className}`}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold text-text-primary ${className}`}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`pt-4 ${className}`}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center justify-between pt-4 border-t border-border-light ${className}`}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';
