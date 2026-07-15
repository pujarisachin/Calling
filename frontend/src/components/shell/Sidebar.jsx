import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Phone,
  Wifi,
  Brain,
  MessageCircle,
  Settings,
  Home,
  FileText,
} from 'lucide-react';
import { Logo } from '../icons/Logo';

const NAV_ITEMS = [
  { icon: Home, label: 'Landing', path: '/' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Phone, label: 'Calling', path: '/calling' },
  { icon: Wifi, label: 'SIP Providers', path: '/sip-providers' },
  { icon: Brain, label: 'LLM Providers', path: '/llm-providers' },
  { icon: MessageCircle, label: 'Intelligence', path: '/intelligence' },
  { icon: FileText, label: 'Documentation', path: '/docs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen transition-all duration-300 z-40 flex flex-col ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        borderRightWidth: '1px'
      }}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 transition-colors duration-300 h-16" style={{ borderColor: 'var(--border-color)', borderBottomWidth: '1px' }}>
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <div className="flex flex-col">
              <h1 className="text-sm font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                PhantomCaller
              </h1>
              <p className="text-xs text-text-tertiary">Voice Testing</p>
            </div>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg transition-colors duration-200 hover:opacity-70"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group font-medium text-sm ${
                active
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-inherit shadow-md'
                  : 'hover:bg-bg-tertiary'
              }`}
              style={{
                color: active ? 'white' : 'var(--text-secondary)',
              }}
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 transition-colors duration-300" style={{ borderColor: 'var(--border-color)', borderTopWidth: '1px' }}>
        <div className="text-xs text-center transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
          {isCollapsed ? (
            <span>v1.0</span>
          ) : (
            <p>PhantomCaller v1.0</p>
          )}
        </div>
      </div>
    </aside>
  );
}

Sidebar.displayName = 'Sidebar';
