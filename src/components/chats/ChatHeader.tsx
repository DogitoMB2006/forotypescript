import type { FC } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';

interface ChatHeaderProps {
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    profileImage?: string;
    isOnline: boolean;
    lastSeen: Date;
  };
  onBack?: () => void;
}

const ChatHeader: FC<ChatHeaderProps> = ({ otherUser, onBack }) => {
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (otherUser.isOnline) return 'En línea';
    if (minutes < 1) return 'Visto hace un momento';
    if (minutes < 60) return `Visto hace ${minutes}m`;
    if (hours < 24) return `Visto hace ${hours}h`;
    if (days < 7) return `Visto hace ${days}d`;
    return `Visto ${date.toLocaleDateString()}`;
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Back button (mobile) */}
          <button
            onClick={onBack}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* User info */}
          <Link 
            to={`/perfil/${otherUser.username}`}
            className="flex items-center space-x-3 hover:bg-gray-800/50 rounded-lg p-2 -m-2 transition-colors"
          >
            <div className="relative">
              <Avatar
                src={otherUser.profileImage}
                alt={otherUser.displayName}
                name={otherUser.displayName}
                size="md"
              />
              {otherUser.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-medium truncate">
                {otherUser.displayName}
              </h2>
              <p className="text-sm text-gray-400 truncate">
                {formatLastSeen(otherUser.lastSeen)}
              </p>
            </div>
          </Link>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;