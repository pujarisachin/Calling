import React from 'react';

export const Skeleton = React.forwardRef(
  ({ className = '', height = 'h-4', width = 'w-full', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-bg-tertiary rounded animate-pulse ${height} ${width} ${className}`}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export const SkeletonCard = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 bg-surface-1 rounded-lg border border-border-light">
        <Skeleton className="h-4 w-1/3 mb-3" />
        <Skeleton className="h-3 w-2/3 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

SkeletonCard.displayName = 'SkeletonCard';

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-3">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton
            key={j}
            className="h-8 flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

SkeletonTable.displayName = 'SkeletonTable';
