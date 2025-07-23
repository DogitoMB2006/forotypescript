import type { FC } from 'react';
import { useChats } from '../../contexts/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import ChatListItem from './ChatListItem';
import ChatSearch from './ChatSearch';

const ChatList: FC = () => {
  const { chats, loading } = useChats();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Chats</h1>
        </div>
        
        <ChatSearch onSearchToggle={() => {}} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No tienes chats aún</h3>
            <p className="text-gray-400 mb-4">
              Busca usuarios para comenzar una conversación
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                currentUserId={user.uid}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;