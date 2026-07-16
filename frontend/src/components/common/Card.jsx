import React from 'react';

export const Card = React.forwardRef(({ className = '', children, style = {}, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg p-6 shadow-sm transition-all duration-200 ${className}`}
    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderWidth: '1px', ...style }}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ className = '', children, style = {}, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center justify-between pb-4 ${className}`}
    style={{ borderColor: 'var(--border-color)', borderBottomWidth: '1px', ...style }}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ className = '', children, style = {}, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold ${className}`}
    style={{ color: 'var(--text-primary)', ...style }}
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

export const CardFooter = React.forwardRef(({ className = '', children, style = {}, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center justify-between pt-4 ${className}`}
    style={{ borderColor: 'var(--border-color)', borderTopWidth: '1px', ...style }}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';
