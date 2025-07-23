import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { ChatPreview } from '../../types/chat';
import Avatar from '../ui/Avatar';

interface ChatListItemProps {
  chat: ChatPreview;
  currentUserId: string;
}

const ChatListItem: FC<ChatListItemProps> = ({ chat, currentUserId }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? 'Ahora' : `${minutes}m`;
    }
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return 'Nuevo chat';
    
    const isOwn = chat.lastMessage.senderId === currentUserId;
    const prefix = isOwn ? 'Tú: ' : '';
    
    switch (chat.lastMessage.type) {
      case 'image':
        return `${prefix}📷 Imagen`;
      case 'audio':
        return `${prefix}🎵 Audio`;
      default:
        return `${prefix}${chat.lastMessage.content}`;
    }
  };

  return (
    <Link 
      to={`/chats/${chat.id}`}
      className="flex items-center space-x-3 p-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50"
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={chat.otherUser.profileImage}
          alt={chat.otherUser.displayName}
          name={chat.otherUser.displayName}
          size="lg"
        />
        {chat.otherUser.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium truncate">
            {chat.otherUser.displayName}
          </h3>
          {chat.lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatTime(chat.lastMessage.timestamp)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-400 truncate">
            {getLastMessagePreview()}
          </p>
          {chat.unreadCount > 0 && (
            <span className="bg-emerald-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center flex-shrink-0 ml-2">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mt-0.5">
          @{chat.otherUser.username}
        </p>
      </div>
    </Link>
  );
};

export default ChatListItem;