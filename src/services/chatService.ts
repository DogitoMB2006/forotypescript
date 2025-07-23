import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { createNotification } from './notificationService';
import { showChatNotification, showInAppNotification } from './chatNotificationService';
import type { ChatMessage, ChatPreview } from '../types/chat';

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  defaultBadgeId?: string;
}

export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderProfile: UserProfile,
  content: string,
  type: 'text' | 'image' | 'audio' = 'text',
  fileUrl?: string
): Promise<string> => {
  try {
    const batch = writeBatch(db);
    
    const messageData = {
      chatId,
      senderId,
      senderUsername: senderProfile.username,
      senderDisplayName: senderProfile.displayName,
      senderProfileImage: senderProfile.profileImageUrl || null,
      content,
      type,
      fileUrl: fileUrl || null,
      isRead: false,
      isEdited: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const messageRef = await addDoc(collection(db, 'messages'), messageData);
    
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const otherUserId = chatData.participants.find((id: string) => id !== senderId);
      
      batch.update(chatRef, {
        lastMessage: {
          id: messageRef.id,
          content,
          senderId,
          timestamp: serverTimestamp(),
          type
        },
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: increment(1)
      });
      
      await batch.commit();

      if (otherUserId) {
        try {
          await createNotification({
            userId: otherUserId,
            type: 'message',
            title: `Nuevo mensaje de ${senderProfile.displayName}`,
            message: type === 'text' ? content : type === 'image' ? '📷 Envió una imagen' : '🎵 Envió un mensaje de voz',
            triggeredByUserId: senderId,
            triggeredByUsername: senderProfile.username,
            triggeredByDisplayName: senderProfile.displayName,
            triggeredByProfileImage: senderProfile.profileImageUrl,
            data: {
              chatId: chatId,
              senderId: senderId,
              messageType: type
            }
          });

          const chatNotificationData = {
            chatId,
            senderId,
            senderUsername: senderProfile.username,
            senderDisplayName: senderProfile.displayName,
            senderProfileImage: senderProfile.profileImageUrl,
            content,
            type
          };

          await showChatNotification(chatNotificationData, otherUserId);
          showInAppNotification(chatNotificationData);
        } catch (notificationError) {
          console.error('ChatService: Error sending notifications:', notificationError);
        }
      }
    }
    
    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getUserChats = async (userId: string): Promise<ChatPreview[]> => {
  try {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const chats: ChatPreview[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const chatData = docSnapshot.data();
      const otherUserId = chatData.participants.find((id: string) => id !== userId);
      const otherUserDetails = chatData.participantDetails[otherUserId];
      
      if (!otherUserDetails) {
        continue;
      }
      
      const chatPreview: ChatPreview = {
        id: docSnapshot.id,
        otherUser: {
          id: otherUserId,
          username: otherUserDetails.username,
          displayName: otherUserDetails.displayName,
          profileImage: otherUserDetails.profileImage || undefined,
          isOnline: false,
          lastSeen: otherUserDetails.lastSeen?.toDate() || new Date()
        },
        lastMessage: chatData.lastMessage ? {
          content: chatData.lastMessage.content,
          senderId: chatData.lastMessage.senderId,
          timestamp: chatData.lastMessage.timestamp?.toDate() || new Date(),
          type: chatData.lastMessage.type
        } : null,
        unreadCount: chatData.unreadCount[userId] || 0,
        isActive: chatData.isActive
      };
      
      chats.push(chatPreview);
    }
    
    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
};

export const getChatMessages = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      editedAt: doc.data().editedAt?.toDate()
    } as ChatMessage));
    
    callback(messages);
  });
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  try {
    const batch = writeBatch(db);
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('senderId', '!=', userId),
      where('isRead', '==', false)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    
    messagesSnapshot.docs.forEach((docSnapshot) => {
      batch.update(docSnapshot.ref, { isRead: true });
    });
    
    const chatRef = doc(db, 'chats', chatId);
    batch.update(chatRef, {
      [`unreadCount.${userId}`]: 0
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

export const editMessage = async (messageId: string, newContent: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      content: newContent,
      isEdited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const messageData = messageDoc.data();
      
      if (messageData.fileUrl) {
        try {
          const { deleteChatFile } = await import('./chatFileService');
          await deleteChatFile(messageData.fileUrl);
        } catch (fileError) {
          console.error('Error deleting associated file:', fileError);
        }
      }
      
      await deleteDoc(messageRef);
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const findExistingChat = async (userId1: string, userId2: string): Promise<string | null> => {
  try {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId1)
    );
    
    const querySnapshot = await getDocs(q);
    
    for (const docSnapshot of querySnapshot.docs) {
      const chatData = docSnapshot.data();
      if (chatData.participants.includes(userId2)) {
        return docSnapshot.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing chat:', error);
    return null;
  }
};

export const createChat = async (
  currentUserId: string, 
  otherUserId: string, 
  currentUserProfile: UserProfile, 
  otherUserProfile: { id: string; username: string; displayName: string; profileImageUrl?: string }
): Promise<string> => {
  try {
    const existingChatId = await findExistingChat(currentUserId, otherUserId);
    if (existingChatId) {
      return existingChatId;
    }

    const chatData = {
      participants: [currentUserId, otherUserId],
      participantDetails: {
        [currentUserId]: {
          username: currentUserProfile.username,
          displayName: currentUserProfile.displayName,
          profileImage: currentUserProfile.profileImageUrl || null,
          lastSeen: serverTimestamp()
        },
        [otherUserId]: {
          username: otherUserProfile.username,
          displayName: otherUserProfile.displayName,
          profileImage: otherUserProfile.profileImageUrl || null,
          lastSeen: serverTimestamp()
        }
      },
      lastMessage: null,
      lastMessageAt: serverTimestamp(),
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const subscribeToUserChats = (userId: string, callback: (chats: ChatPreview[]) => void) => {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const chats: ChatPreview[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const chatData = docSnapshot.data();
      
      const otherUserId = chatData.participants.find((id: string) => id !== userId);
      const otherUserDetails = chatData.participantDetails[otherUserId];
      
      if (!otherUserDetails) {
        continue;
      }
      
      const chatPreview: ChatPreview = {
        id: docSnapshot.id,
        otherUser: {
          id: otherUserId,
          username: otherUserDetails.username,
          displayName: otherUserDetails.displayName,
          profileImage: otherUserDetails.profileImage || undefined,
          isOnline: false,
          lastSeen: otherUserDetails.lastSeen?.toDate() || new Date()
        },
        lastMessage: chatData.lastMessage ? {
          content: chatData.lastMessage.content,
          senderId: chatData.lastMessage.senderId,
          timestamp: chatData.lastMessage.timestamp?.toDate() || new Date(),
          type: chatData.lastMessage.type
        } : null,
        unreadCount: chatData.unreadCount[userId] || 0,
        isActive: chatData.isActive
      };
      
      chats.push(chatPreview);
    }
    
    callback(chats);
  });
};