import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserNotifications, markNotificationAsRead, clearAllNotifications } from '../../services/notificationService';
import type { Notification } from '../../types/notification';
import Avatar from './Avatar';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      loadNotifications();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const userNotifications = await getUserNotifications(user.uid);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      }

      if (notification.postId) {
        if (notification.commentId) {
          navigate(`/post/${notification.postId}#comment-${notification.commentId}`);
        } else {
          navigate(`/post/${notification.postId}`);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleClearAll = async () => {
    if (!user?.uid) return;

    try {
      await clearAllNotifications(user.uid);
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment':
        return (
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'reply':
        return (
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case 'like':
        return (
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case 'mention':
        return (
          <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'comment':
        return `${notification.triggeredByDisplayName} comentó en tu post`;
      case 'reply':
        return `${notification.triggeredByDisplayName} respondió a tu comentario`;
      case 'like':
        return `${notification.triggeredByDisplayName} le gustó tu post`;
      case 'mention':
        return `${notification.triggeredByDisplayName} te mencionó`;
      default:
        return notification.content;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="fixed inset-x-4 top-16 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:inset-x-auto w-auto sm:w-80 md:w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-[calc(100vh-5rem)] sm:max-h-80 md:max-h-96 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Notificaciones</h3>
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-md hover:bg-emerald-400/10 active:bg-emerald-400/20"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <div className="max-h-[calc(100vh-8rem)] sm:max-h-64 md:max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17l-5-5h5v5z" />
            </svg>
            <p className="text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="py-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start space-x-3 p-4 hover:bg-gray-800 cursor-pointer transition-colors active:bg-gray-700 touch-manipulation ${
                  !notification.isRead ? 'bg-gray-800/50' : ''
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  <Avatar
                    src={notification.triggeredByProfileImage}
                    alt={notification.triggeredByDisplayName}
                    name={notification.triggeredByDisplayName}
                    size="sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-relaxed">
                        {getNotificationText(notification)}
                      </p>
                      {notification.content && notification.type !== 'like' && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                          "{notification.content}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {formatTime(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;