import React from 'react';
import { X, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '../common/Button';
import { formatDistanceToNow } from 'date-fns';

const iconMap = {
  success: <CheckCircle size={20} className="text-success" />,
  error: <AlertCircle size={20} className="text-error" />,
  warning: <AlertCircle size={20} className="text-warning" />,
  info: <Info size={20} className="text-color-info" />,
};

export function NotificationDrawer({ onClose }) {
  const {
    notifications,
    removeNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    unreadCount,
  } = useNotifications();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-modal"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-16 w-96 max-w-full h-[calc(100vh-4rem)] border-l overflow-hidden flex flex-col z-tooltip shadow-lg animate-in fade-in slide-in-from-right" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{unreadCount} unread</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors duration-200"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <X size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Info size={40} style={{ color: 'var(--text-tertiary)' }} className="mb-3" />
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No notifications yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                You'll see updates here as tests complete
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 rounded-lg border transition-all duration-200 cursor-pointer group"
                  style={{
                    borderColor: notification.read ? 'var(--border-color)' : 'var(--color-blue)',
                    backgroundColor: notification.read ? 'transparent' : 'var(--bg-tertiary)'
                  }}
                  onMouseEnter={(e) => !notification.read && (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => !notification.read && (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {iconMap[notification.type || 'info']}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 rounded transition-all duration-200"
                      style={{ backgroundColor: '#EF4444' }}
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>

                  {/* CTA Button if present */}
                  {notification.action && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        notification.action.onClick();
                      }}
                      className="mt-2 w-full text-xs px-3 py-1.5 rounded transition-colors duration-200 text-white"
                      style={{ backgroundColor: 'var(--color-blue)' }}
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={markAllNotificationsRead}
            >
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={clearNotifications}
              className="text-error hover:bg-error hover:bg-opacity-10"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

NotificationDrawer.displayName = 'NotificationDrawer';
