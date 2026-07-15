import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function MainLayout({ children, pageTitle = 'Dashboard' }) {
  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <Topbar pageTitle={pageTitle} />

      {/* Main Content */}
      <main className="ml-64 mt-16 p-6 transition-all duration-300">
        <div className="max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}

MainLayout.displayName = 'MainLayout';
