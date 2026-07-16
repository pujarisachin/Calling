import React, { useState } from 'react';
import { Search, Bell, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationDrawer } from './NotificationDrawer';
import { Badge } from '../common/Badge';

export function Topbar({ pageTitle = 'Dashboard' }) {
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <header className="fixed top-0 right-0 left-64 h-16 flex items-center justify-between px-6 z-30 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderBottomWidth: '1px', boxShadow: '0 1px 3px var(--shadow-color)' }}>
        {/* Page Title + Search */}
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{pageTitle}</h2>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center gap-2 rounded-lg px-4 py-2 w-64 ml-auto mr-auto transition-all duration-300" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', borderWidth: '1px', boxShadow: '0 1px 2px var(--shadow-color)' }}>
            <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search tests, calls, agents..."
              className="bg-transparent outline-none text-sm w-full transition-colors duration-300"
              style={{ color: 'var(--text-primary)', caretColor: 'var(--color-blue)', fontFamily: "'Inter', sans-serif" }}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg transition-colors duration-200 relative hover:bg-bg-tertiary"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge
                  variant="error"
                  size="sm"
                  className="absolute -top-1 -right-1 text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </button>
            {showNotifications && (
              <NotificationDrawer onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-bg-tertiary"
            style={{ color: 'var(--text-secondary)' }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon size={20} />
            ) : (
              <Sun size={20} />
            )}
          </button>

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center text-inherit font-semibold hover:shadow-lg transition-all duration-200"
            >
              AC
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg z-50 transition-all duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderWidth: '1px', boxShadow: '0 4px 12px var(--shadow-color)' }}>
                <div className="p-4 transition-colors duration-300" style={{ borderColor: 'var(--border-color)', borderBottomWidth: '1px' }}>
                  <p className="font-semibold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>AI Caller</p>
                  <p className="text-xs transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>Platform Admin</p>
                </div>
                <nav className="space-y-1 p-2">
                  <a
                    href="#"
                    className="block px-3 py-2 rounded text-sm transition-colors duration-200 hover:bg-bg-tertiary"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Profile Settings
                  </a>
                  <a
                    href="#"
                    className="block px-3 py-2 rounded text-sm transition-colors duration-200 hover:bg-bg-tertiary"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    API Keys
                  </a>
                </nav>
                <div className="p-2 transition-colors duration-300" style={{ borderColor: 'var(--border-color)', borderTopWidth: '1px' }}>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded transition-colors duration-200 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

Topbar.displayName = 'Topbar';
