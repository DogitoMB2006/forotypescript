export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderProfileImage?: string;
  content: string;
  type: 'text' | 'image' | 'audio';
  fileUrl?: string;
  isRead: boolean;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      username: string;
      displayName: string;
      profileImage?: string;
      lastSeen: Date;
    };
  };
  lastMessage: ChatMessage | null;
  lastMessageAt: Date;
  unreadCount: {
    [userId: string]: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatPreview {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    profileImage?: string;
    isOnline: boolean;
    lastSeen: Date;
  };
  lastMessage: {
    content: string;
    senderId: string;
    timestamp: Date;
    type: 'text' | 'image' | 'audio';
  } | null;
  unreadCount: number;
  isActive: boolean;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  username: string;
  timestamp: Date;
}