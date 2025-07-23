import type { FC } from 'react';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserNotifications, subscribeToUserNotifications } from '../services/notificationService';
import { notificationPermissionService } from '../services/notificationPermissionService';
import type { Notification, NotificationToast } from '../types/notification';

interface NotificationContextType {
  notifications: Notification[];
  toasts: NotificationToast[];
  addToast: (toast: NotificationToast) => void;
  removeToast: (id: string) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const isFirstLoad = useRef(true);
  const previousNotificationIds = useRef<string[]>([]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  const refreshNotifications = async () => {
    if (!user?.uid) return;
    
    try {
      const userNotifications = await getUserNotifications(user.uid);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setToasts([]);
      isFirstLoad.current = true;
      previousNotificationIds.current = [];
      return;
    }

    refreshNotifications();

    const unsubscribe = subscribeToUserNotifications(user.uid, async (newNotifications) => {
      if (isFirstLoad.current) {
        setNotifications(prev => [...prev, ...newNotifications]);
        previousNotificationIds.current = newNotifications.map(n => n.id);
        isFirstLoad.current = false;
        return;
      }

      const reallyNewNotifications = newNotifications.filter(
        notification => !previousNotificationIds.current.includes(notification.id)
      );

      if (reallyNewNotifications.length > 0) {
        setNotifications(prev => [...reallyNewNotifications, ...prev]);
        previousNotificationIds.current = [...previousNotificationIds.current, ...reallyNewNotifications.map(n => n.id)];

        for (const notification of reallyNewNotifications) {
          const toast: NotificationToast = {
            id: notification.id,
            type: notification.type,
            title: getToastTitle(notification.type),
            message: `${notification.triggeredByDisplayName} ${getToastMessage(notification.type)}`,
            avatar: notification.triggeredByProfileImage,
            postId: notification.postId,
            commentId: notification.commentId,
            timestamp: new Date()
          };
          
          addToast(toast);

          if (notificationPermissionService.getPermissionStatus() === 'granted') {
            try {
              await notificationPermissionService.showNotification({
                title: toast.title,
                body: toast.message,
                icon: toast.avatar || '/favicon.ico',
                tag: notification.id,
                data: {
                  postId: notification.postId,
                  commentId: notification.commentId
                }
              });
            } catch (error) {
              console.error('Error showing browser notification:', error);
            }
          }
        }
      }
    });

    return unsubscribe;
  }, [user?.uid]);

  const addToast = (toast: NotificationToast) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      removeToast(toast.id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastTitle = (type: Notification['type']): string => {
    switch (type) {
      case 'comment':
        return 'Nuevo comentario';
      case 'reply':
        return 'Nueva respuesta';
      case 'like':
        return 'Le gustó tu post';
      case 'mention':
        return 'Te mencionaron';
      default:
        return 'Nueva notificación';
    }
  };

  const getToastMessage = (type: Notification['type']): string => {
    switch (type) {
      case 'comment':
        return 'comentó en tu post';
      case 'reply':
        return 'respondió a tu comentario';
      case 'like':
        return 'le gustó tu post';
      case 'mention':
        return 'te mencionó en un post';
      default:
        return 'nueva actividad';
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        toasts, 
        addToast, 
        removeToast,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};