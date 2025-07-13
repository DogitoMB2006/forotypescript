export type NotificationPermissionStatus = 'default' | 'granted' | 'denied';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Extendemos NotificationOptions para incluir actions cuando esté disponible
interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationPermissionService {
  private static instance: NotificationPermissionService;

  static getInstance(): NotificationPermissionService {
    if (!NotificationPermissionService.instance) {
      NotificationPermissionService.instance = new NotificationPermissionService();
    }
    return NotificationPermissionService.instance;
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) return 'denied';
    return Notification.permission as NotificationPermissionStatus;
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  }

  async showNotification(data: PushNotificationData): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        // Usar Service Worker para notificaciones con acciones
        const registration = await navigator.serviceWorker.ready;
        const options: ExtendedNotificationOptions = {
          body: data.body,
          icon: data.icon || '/favicon.ico',
          badge: data.badge || '/favicon.ico',
          tag: data.tag,
          data: data.data,
          requireInteraction: true,
          silent: false,
        };

        // Solo agregar actions si están disponibles
        if (data.actions && data.actions.length > 0) {
          options.actions = data.actions;
        }

        await registration.showNotification(data.title, options);
      } else {
        // Fallback para navegadores que no soportan Service Worker
        const options: NotificationOptions = {
          body: data.body,
          icon: data.icon || '/favicon.ico',
          tag: data.tag,
          data: data.data,
          requireInteraction: true,
          silent: false,
        };

        new Notification(data.title, options);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      
      // Fallback adicional: notificación básica
      try {
        new Notification(data.title, {
          body: data.body,
          icon: data.icon || '/favicon.ico',
        });
      } catch (fallbackError) {
        console.error('Error showing fallback notification:', fallbackError);
      }
    }
  }

  setPermissionDismissed(): void {
    localStorage.setItem('notification-permission-dismissed', 'true');
  }

  isPermissionDismissed(): boolean {
    return localStorage.getItem('notification-permission-dismissed') === 'true';
  }

  clearPermissionDismissed(): void {
    localStorage.removeItem('notification-permission-dismissed');
  }
}

export const notificationPermissionService = NotificationPermissionService.getInstance();