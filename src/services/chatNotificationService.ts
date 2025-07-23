import { createNotification } from './notificationService';

export interface ChatNotificationData {
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderProfileImage?: string;
  content: string;
  type: 'text' | 'image' | 'audio';
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showChatNotification = async (data: ChatNotificationData, userId: string) => {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    console.log('Permisos de notificación denegados');
    return;
  }

  if (document.visibilityState === 'visible' && window.location.pathname === `/chats/${data.chatId}`) {
    return;
  }

  let notificationBody = '';
  let icon = data.senderProfileImage || '/favicon.ico';

  switch (data.type) {
    case 'text':
      notificationBody = data.content;
      break;
    case 'image':
      notificationBody = '📷 Envió una imagen';
      break;
    case 'audio':
      notificationBody = '🎵 Envió un mensaje de voz';
      break;
    default:
      notificationBody = 'Nuevo mensaje';
  }

  if (notificationBody.length > 100) {
    notificationBody = notificationBody.substring(0, 97) + '...';
  }

  const notification = new Notification(data.senderDisplayName, {
    body: notificationBody,
    icon: icon,
    badge: '/favicon.ico',
    tag: `chat-${data.chatId}`,
    requireInteraction: false,
    silent: false
  });

  notification.onclick = () => {
    window.focus();
    window.location.href = `/chats/${data.chatId}`;
    notification.close();
  };

  setTimeout(() => {
    notification.close();
  }, 5000);

  await createNotification({
    userId: userId,
    type: 'message',
    title: `Nuevo mensaje de ${data.senderDisplayName}`,
    message: notificationBody,
    triggeredByUserId: data.senderId,
    triggeredByUsername: data.senderUsername,
    triggeredByDisplayName: data.senderDisplayName,
    data: {
      chatId: data.chatId,
      senderId: data.senderId,
      messageType: data.type
    }
  });
};

export const showInAppNotification = (data: ChatNotificationData) => {
  let notificationBody = '';

  switch (data.type) {
    case 'text':
      notificationBody = data.content;
      break;
    case 'image':
      notificationBody = 'Envió una imagen';
      break;
    case 'audio':
      notificationBody = 'Envió un mensaje de voz';
      break;
    default:
      notificationBody = 'Nuevo mensaje';
  }

  if (notificationBody.length > 60) {
    notificationBody = notificationBody.substring(0, 57) + '...';
  }

  const event = new CustomEvent('showInAppNotification', {
    detail: {
      id: `chat-${Date.now()}`,
      type: 'message',
      title: data.senderDisplayName,
      message: notificationBody,
      avatar: data.senderProfileImage,
      action: () => {
        window.location.href = `/chats/${data.chatId}`;
      },
      duration: 4000
    }
  });

  window.dispatchEvent(event);
};