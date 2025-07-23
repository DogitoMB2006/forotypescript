import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { useNotifications } from '../contexts/NotificationContext';
import { createNotification } from '../services/notificationService';
import { notificationPermissionService } from '../services/notificationPermissionService';
import type { ChatMessage } from '../types/chat';

export const useChatNotifications = () => {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const lastMessageTimestamp = useRef<number>(Date.now());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'messages'),
      where('senderId', '!=', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const messageData = change.doc.data() as ChatMessage;
          const messageTime = messageData.createdAt?.getTime() || 0;

          if (messageTime > lastMessageTimestamp.current) {
            lastMessageTimestamp.current = messageTime;

            const currentPath = window.location.pathname;
            const isInSameChat = currentPath === `/chats/${messageData.chatId}`;
            const isVisible = document.visibilityState === 'visible';

            if (isInSameChat && isVisible) {
              continue;
            }

            let messageContent = '';
            switch (messageData.type) {
              case 'text':
                messageContent = messageData.content;
                break;
              case 'image':
                messageContent = '📷 Envió una imagen';
                break;
              case 'audio':
                messageContent = '🎵 Envió un mensaje de voz';
                break;
              default:
                messageContent = 'Nuevo mensaje';
            }

            if (messageContent.length > 100) {
              messageContent = messageContent.substring(0, 97) + '...';
            }

            await createNotification({
              userId: user.uid,
              type: 'message',
              title: `Mensaje de ${messageData.senderDisplayName}`,
              message: messageContent,
              triggeredByUserId: messageData.senderId,
              triggeredByUsername: messageData.senderUsername,
              triggeredByDisplayName: messageData.senderDisplayName,
              triggeredByProfileImage: messageData.senderProfileImage,
              data: {
                chatId: messageData.chatId,
                messageId: messageData.id,
                messageType: messageData.type
              }
            });

            const toast = {
              id: `chat-${Date.now()}`,
              type: 'message' as const,
              title: messageData.senderDisplayName,
              message: messageContent,
              avatar: messageData.senderProfileImage,
              chatId: messageData.chatId,
              timestamp: new Date()
            };

            addToast(toast);

            if (notificationPermissionService.getPermissionStatus() === 'granted') {
              try {
                const notification = new Notification(messageData.senderDisplayName, {
                  body: messageContent,
                  icon: messageData.senderProfileImage || '/favicon.ico',
                  badge: '/favicon.ico',
                  tag: `chat-${messageData.chatId}`,
                  requireInteraction: false,
                  silent: false
                });

                notification.onclick = () => {
                  window.focus();
                  window.location.href = `/chats/${messageData.chatId}`;
                  notification.close();
                };

                setTimeout(() => {
                  notification.close();
                }, 5000);
              } catch (error) {
                console.error('Error showing browser notification:', error);
              }
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);
};

export const useChatRoomNotifications = (chatId: string | undefined) => {
  const { user } = useAuth();
  const lastMessageTimestamp = useRef<number>(Date.now());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('senderId', '!=', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const messageData = change.doc.data() as ChatMessage;
          const messageTime = messageData.createdAt?.getTime() || 0;

          if (messageTime > lastMessageTimestamp.current && document.visibilityState !== 'visible') {
            lastMessageTimestamp.current = messageTime;

            let messageContent = '';
            switch (messageData.type) {
              case 'text':
                messageContent = messageData.content;
                break;
              case 'image':
                messageContent = '📷 Envió una imagen';
                break;
              case 'audio':
                messageContent = '🎵 Envió un mensaje de voz';
                break;
              default:
                messageContent = 'Nuevo mensaje';
            }

            if (messageContent.length > 100) {
              messageContent = messageContent.substring(0, 97) + '...';
            }

            if (notificationPermissionService.getPermissionStatus() === 'granted') {
              try {
                const notification = new Notification(messageData.senderDisplayName, {
                  body: messageContent,
                  icon: messageData.senderProfileImage || '/favicon.ico',
                  badge: '/favicon.ico',
                  tag: `chat-${messageData.chatId}`,
                  requireInteraction: false,
                  silent: false
                });

                notification.onclick = () => {
                  window.focus();
                  window.location.href = `/chats/${messageData.chatId}`;
                  notification.close();
                };

                setTimeout(() => {
                  notification.close();
                }, 5000);
              } catch (error) {
                console.error('Error showing browser notification:', error);
              }
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [chatId, user?.uid]);
};

