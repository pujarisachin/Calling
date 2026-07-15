import React from 'react';
import brandLogo from './PhantomCaller_Brand.jpg';

export function Logo({ size = 40, className = '' }) {
  return (
    <img
      src={brandLogo}
      alt="PhantomCaller Logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

Logo.displayName = 'Logo';
