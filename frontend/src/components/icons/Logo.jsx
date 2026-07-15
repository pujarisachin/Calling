import React, { useContext } from 'react';
import logoDark from './PhantomCaller_Logo_Dark.png';
import logoLight from './PhantomCaller_Logo_Light.png';
import { ThemeContext } from '../../context/ThemeContext';

export function Logo({ size = 40, className = '' }) {
  const { theme } = useContext(ThemeContext);

  const logoSrc = theme === 'dark' ? logoDark : logoLight;

  return (
    <img
      src={logoSrc}
      alt="PhantomCaller Logo"
      width={size}
      height={size}
      className={`object-contain transition-all duration-300 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

Logo.displayName = 'Logo';
