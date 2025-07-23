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

      // Mejorado: Mejor manejo de redirección para diferentes tipos de notificaciones
      if (notification.type === 'message' && notification.data?.chatId) {
        navigate(`/chats/${notification.data.chatId}`);
      } else if (notification.postId) {
        if (notification.commentId) {
          navigate(`/post/${notification.postId}#comment-${notification.commentId}`);
        } else {
          navigate(`/post/${notification.postId}`);
        }
      }
      onClose();
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
      case 'message':
        return (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'comment':
        return (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'reply':
        return (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case 'like':
        return (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'mention':
        return (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM12 12h.01" />
          </svg>
        );
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'comment':
        return `${notification.triggeredByDisplayName} comentó tu post`;
      case 'reply':
        return `${notification.triggeredByDisplayName} respondió a tu comentario`;
      case 'like':
        return `${notification.triggeredByDisplayName} le gustó tu post`;
      case 'mention':
        return `${notification.triggeredByDisplayName} te mencionó`;
      case 'message':
        // Para mensajes, mostramos el contenido del mensaje directamente
        return notification.message;
      default:
        return notification.message || 'Nueva notificación';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 left-2 sm:left-auto mt-0 sm:mt-2 w-auto sm:w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden"
    >
      <div className="p-3 sm:p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-white">Notificaciones</h3>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Limpiar todo
            </button>
          )}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM12 12h.01" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-gray-800/30' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                    {notification.triggeredByProfileImage ? (
                      <Avatar
                        src={notification.triggeredByProfileImage}
                        alt={notification.triggeredByDisplayName || 'Usuario'}
                        name={notification.triggeredByDisplayName || 'Usuario'}
                        size="sm"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Para mensajes, mostramos el nombre del remitente como título */}
                        {notification.type === 'message' ? (
                          <div className="text-sm font-medium text-white mb-1">
                            {notification.triggeredByDisplayName}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-300 mb-1">
                            {getNotificationMessage(notification)}
                          </div>
                        )}
                        
                        {/* Para mensajes, mostramos el contenido del mensaje */}
                        {notification.type === 'message' && (
                          <div className="text-sm text-gray-400 break-words">
                            {notification.message}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
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