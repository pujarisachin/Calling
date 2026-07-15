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
        className="fixed inset-0 bg-black bg-opacity-50 z-modal"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-16 w-96 max-w-full h-[calc(100vh-4rem)] bg-surface-1 border-l border-border-light overflow-hidden flex flex-col z-tooltip shadow-lg animate-in fade-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <div>
            <h3 className="font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-text-tertiary">{unreadCount} unread</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-secondary rounded transition-colors duration-200"
          >
            <X size={20} className="text-text-primary" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Info size={40} className="text-text-tertiary mb-3" />
              <p className="text-text-secondary font-medium">No notifications yet</p>
              <p className="text-xs text-text-tertiary mt-1">
                You'll see updates here as tests complete
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer group hover:bg-bg-secondary ${
                    notification.read
                      ? 'border-border-light bg-transparent'
                      : 'border-primary bg-bg-secondary'
                  }`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {iconMap[notification.type || 'info']}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-text-primary">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-text-tertiary mt-2">
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
                      className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-error rounded transition-all duration-200"
                    >
                      <Trash2 size={16} className="text-error" />
                    </button>
                  </div>

                  {/* CTA Button if present */}
                  {notification.action && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        notification.action.onClick();
                      }}
                      className="mt-2 w-full text-xs px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-dark transition-colors duration-200"
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
          <div className="p-3 border-t border-border-light space-y-2 bg-bg-secondary">
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
