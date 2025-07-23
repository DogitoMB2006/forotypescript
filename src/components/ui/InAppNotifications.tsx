import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';

interface InAppNotification {
  id: string;
  type: 'message' | 'system';
  title: string;
  message: string;
  avatar?: string;
  action?: () => void;
  duration: number;
}

const InAppNotifications: FC = () => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    const handleShowNotification = (event: CustomEvent) => {
      const notification: InAppNotification = event.detail;
      
      setNotifications(prev => [...prev, notification]);

      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    };

    window.addEventListener('showInAppNotification', handleShowNotification as EventListener);

    return () => {
      window.removeEventListener('showInAppNotification', handleShowNotification as EventListener);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: InAppNotification) => {
    if (notification.action) {
      notification.action();
    }
    removeNotification(notification.id);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 animate-in slide-in-from-right"
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {notification.avatar ? (
                <Avatar
                  src={notification.avatar}
                  alt={notification.title}
                  name={notification.title}
                  size="sm"
                />
              ) : (
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white truncate">
                  {notification.title}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="ml-2 p-1 text-gray-400 hover:text-white rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">
                {notification.message}
              </p>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Toca para abrir
          </div>
        </div>
      ))}
    </div>
  );
};

export default InAppNotifications;