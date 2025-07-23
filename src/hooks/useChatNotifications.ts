import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { useNotifications } from '../contexts/NotificationContext';
import { notificationPermissionService } from '../services/notificationPermissionService';
import type { ChatMessage } from '../types/chat';

export const useChatNotifications = () => {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const lastMessageTimestamp = useRef<number>(Date.now());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Escuchar todos los mensajes nuevos donde el usuario no es el remitente
    const q = query(
      collection(db, 'messages'),
      where('senderId', '!=', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5) // Aumentamos el límite para capturar más mensajes
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const messageData = change.doc.data() as ChatMessage;
          
          // Fix: Properly handle Firebase timestamp
          let createdAt: Date;
          if (messageData.createdAt && typeof messageData.createdAt === 'object' && 'toDate' in messageData.createdAt) {
            createdAt = (messageData.createdAt as any).toDate();
          } else if (messageData.createdAt instanceof Date) {
            createdAt = messageData.createdAt;
          } else {
            createdAt = new Date();
          }
          const messageTime = createdAt.getTime();

          // Solo procesar mensajes más nuevos que el último timestamp
          if (messageTime > lastMessageTimestamp.current) {
            lastMessageTimestamp.current = messageTime;

            const currentPath = window.location.pathname;
            const isInSameChat = currentPath === `/chats/${messageData.chatId}`;
            const isVisible = document.visibilityState === 'visible';

            // No mostrar notificación si está en el mismo chat y la ventana es visible
            if (isInSameChat && isVisible) {
              continue;
            }

            // Preparar contenido del mensaje
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

            // Truncar contenido si es muy largo
            if (messageContent.length > 100) {
              messageContent = messageContent.substring(0, 97) + '...';
            }

            // Crear toast in-app
            const toast = {
              id: `chat-${messageData.chatId}-${Date.now()}`,
              type: 'message' as const,
              title: messageData.senderDisplayName,
              message: messageContent,
              avatar: messageData.senderProfileImage,
              chatId: messageData.chatId,
              timestamp: new Date()
            };

            addToast(toast);

            // Mostrar notificación del navegador si tiene permisos
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
                  // Usar router navigation en lugar de location.href para mejor UX
                  window.location.href = `/chats/${messageData.chatId}`;
                  notification.close();
                };

                // Auto-close después de 5 segundos
                setTimeout(() => {
                  notification.close();
                }, 5000);
              } catch (error) {
                console.error('Error showing browser notification:', error);
              }
            }

            console.log('Chat notification processed:', {
              chatId: messageData.chatId,
              sender: messageData.senderDisplayName,
              content: messageContent
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, addToast]);
};

// Hook específico para notificaciones en una sala de chat específica
export const useChatRoomNotifications = (chatId: string | undefined) => {
  const { user } = useAuth();
  const lastMessageTimestamp = useRef<number>(Date.now());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    // Reset when chatId changes
    isInitialLoad.current = true;
    lastMessageTimestamp.current = Date.now();

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

          // Solo mostrar notificaciones si la ventana no está visible
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

            // Solo notificación del navegador para mensajes en chats específicos cuando no está visible
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