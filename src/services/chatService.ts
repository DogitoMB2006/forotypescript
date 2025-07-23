import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ChatMessage, ChatPreview } from '../types/chat';

export const createChat = async (currentUserId: string, otherUserId: string, currentUserProfile: any, otherUserProfile: any): Promise<string> => {
  try {
    console.log('ChatService: Creating chat between', currentUserId, 'and', otherUserId);
    console.log('ChatService: Current user profile:', currentUserProfile);
    console.log('ChatService: Other user profile:', otherUserProfile);
    
    const existingChatId = await findExistingChat(currentUserId, otherUserId);
    if (existingChatId) {
      console.log('ChatService: Found existing chat:', existingChatId);
      return existingChatId;
    }

    console.log('ChatService: Creating new chat...');
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

    console.log('ChatService: Chat data to create:', chatData);
    const docRef = await addDoc(collection(db, 'chats'), chatData);
    console.log('ChatService: Chat created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
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
      const chat = docSnapshot.data();
      if (chat.participants.includes(userId2)) {
        return docSnapshot.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing chat:', error);
    return null;
  }
};

export const sendMessage = async (chatId: string, senderId: string, senderProfile: any, content: string, type: 'text' | 'image' | 'audio' = 'text', fileUrl?: string): Promise<string> => {
  try {
    console.log('ChatService: Sending message', { chatId, senderId, content, type });
    
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

    console.log('ChatService: Message data:', messageData);
    const messageRef = await addDoc(collection(db, 'messages'), messageData);
    console.log('ChatService: Message created with ID:', messageRef.id);
    
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
      console.log('ChatService: Chat updated with last message');
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
    console.log('ChatService: Editing message', messageId, 'with content:', newContent);
    
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      content: newContent,
      isEdited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('ChatService: Message edited successfully');
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    console.log('ChatService: Deleting message', messageId);
    
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const messageData = messageDoc.data();
      
      // Si el mensaje tiene archivo adjunto, eliminarlo de Storage
      if (messageData.fileUrl) {
        try {
          const { deleteChatFile } = await import('./chatFileService');
          await deleteChatFile(messageData.fileUrl);
          console.log('ChatService: Associated file deleted');
        } catch (fileError) {
          console.error('Error deleting associated file:', fileError);
          // Continuar con la eliminación del mensaje aunque falle el archivo
        }
      }
      
      // Eliminar el mensaje de Firestore
      await deleteDoc(messageRef);
      console.log('ChatService: Message deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const editMessage = async (messageId: string, newContent: string): Promise<void> => {
  try {
    console.log('ChatService: Editing message', messageId, 'with content:', newContent);
    
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      content: newContent,
      isEdited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('ChatService: Message edited successfully');
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    console.log('ChatService: Deleting message', messageId);
    
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const messageData = messageDoc.data();
      
      // Si el mensaje tiene archivo adjunto, eliminarlo de Storage
      if (messageData.fileUrl) {
        try {
          const { deleteChatFile } = await import('./chatFileService');
          await deleteChatFile(messageData.fileUrl);
          console.log('ChatService: Associated file deleted');
        } catch (fileError) {
          console.error('Error deleting associated file:', fileError);
          // Continuar con la eliminación del mensaje aunque falle el archivo
        }
      }
      
      // Eliminar el mensaje de Firestore
      await deleteDoc(messageRef);
      console.log('ChatService: Message deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};
  console.log('ChatService: Setting up subscription for user:', userId);
  
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, async (querySnapshot) => {
    console.log('ChatService: Snapshot received, docs:', querySnapshot.docs.length);
    const chats: ChatPreview[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const chatData = docSnapshot.data();
      console.log('ChatService: Processing chat:', docSnapshot.id, chatData);
      
      const otherUserId = chatData.participants.find((id: string) => id !== userId);
      const otherUserDetails = chatData.participantDetails[otherUserId];
      
      if (!otherUserDetails) {
        console.warn('ChatService: Missing participant details for:', otherUserId);
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
    
    console.log('ChatService: Final chats processed:', chats.length);
    callback(chats);
  }, (error) => {
    console.error('ChatService: Subscription error:', error);
    callback([]);
  });
};