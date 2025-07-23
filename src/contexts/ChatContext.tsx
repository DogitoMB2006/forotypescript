import type { FC } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToUserChats } from '../services/chatService';
import type { ChatPreview } from '../types/chat';

interface ChatContextType {
  chats: ChatPreview[];
  unreadChatsCount: number;
  refreshChats: () => void;
  loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChats = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChats must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: FC<ChatProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadChatsCount = chats.reduce((total, chat) => total + chat.unreadCount, 0);

  const refreshChats = () => {
    if (user?.uid) {
      console.log('ChatProvider: Manual refresh requested');
      setLoading(true);
    }
  };

  useEffect(() => {
    console.log('ChatProvider: Auth state changed', { user: user?.uid, authLoading });
    
    if (authLoading) {
      console.log('ChatProvider: Still loading auth...');
      return;
    }

    if (!user?.uid) {
      console.log('ChatProvider: No user, clearing chats');
      setChats([]);
      setLoading(false);
      return;
    }

    console.log('ChatProvider: Setting up chat subscription for user:', user.uid);
    setLoading(true);
    
    const unsubscribe = subscribeToUserChats(user.uid, (userChats: ChatPreview[]) => {
      console.log('ChatProvider: Received chats update:', userChats.length);
      setChats(userChats);
      setLoading(false);
    });

    return () => {
      console.log('ChatProvider: Cleaning up chat subscription');
      unsubscribe();
    };
  }, [user?.uid, authLoading]);

  return (
    <ChatContext.Provider 
      value={{ 
        chats, 
        unreadChatsCount,
        refreshChats,
        loading
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};