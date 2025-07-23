
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Users } from 'lucide-react';
import { getUserProfile } from '../../services/userService';
import { useCall } from '../../contexts/CallContext';
import type { UserProfile } from '../../services/userService';
import Avatar from '../ui/Avatar';
import DefaultBadge from '../user/DefaultBadge';
import UserModalPostcard from '../posts/UserModalPostcard';

interface ChatHeaderProps {
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    profileImage?: string;
    isOnline: boolean;
    lastSeen: Date;
  };
  chatId: string;
  onBack?: () => void;
}

const ChatHeader: FC<ChatHeaderProps> = ({ otherUser, chatId, onBack }) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalPosition, setUserModalPosition] = useState({ x: 0, y: 0 });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCallButtonActive, setIsCallButtonActive] = useState(false);
  const [isChannelButtonActive, setIsChannelButtonActive] = useState(false);
  
  const { startVoiceCall, startVideoCall, joinVoiceChannel, isInCall, isInChannel } = useCall();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile(otherUser.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [otherUser.id]);

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

  const handleUserClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setUserModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom
    });
    setShowUserModal(true);
  };

  const handleVoiceCall = () => {
    if (isInCall || isInChannel) return;
    
    setIsCallButtonActive(true);
    startVoiceCall({
      id: otherUser.id,
      username: otherUser.username,
      displayName: otherUser.displayName,
      profileImage: otherUser.profileImage
    }, chatId);

    setTimeout(() => setIsCallButtonActive(false), 300);
  };

  const handleVideoCall = () => {
    if (isInCall || isInChannel) return;
    
    startVideoCall({
      id: otherUser.id,
      username: otherUser.username,
      displayName: otherUser.displayName,
      profileImage: otherUser.profileImage
    }, chatId);
  };

  const handleJoinVoiceChannel = () => {
    if (isInCall || isInChannel) return;
    
    setIsChannelButtonActive(true);
    joinVoiceChannel({
      id: otherUser.id,
      username: otherUser.username,
      displayName: otherUser.displayName,
      profileImage: otherUser.profileImage
    }, chatId);

    setTimeout(() => setIsChannelButtonActive(false), 300);
  };

  return (
    <>
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <button 
              onClick={handleUserClick}
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
                <div className="flex items-center space-x-2">
                  <h2 className="text-white font-medium truncate">
                    {otherUser.displayName}
                  </h2>
                  {userProfile && (userProfile as any).defaultBadgeId && (
                    <DefaultBadge 
                      badgeId={(userProfile as any).defaultBadgeId}
                      size="sm"
                      className="flex-shrink-0"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {formatLastSeen(otherUser.lastSeen)}
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button 
              onClick={handleVoiceCall}
              disabled={isInCall || isInChannel}
              className={`p-2 rounded-full transition-all duration-200 ${
                isCallButtonActive 
                  ? 'bg-blue-600 text-white scale-110' 
                  : isInCall || isInChannel
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Llamada de voz"
            >
              <Phone className="w-5 h-5" />
            </button>

            <button 
              onClick={handleVideoCall}
              disabled={isInCall || isInChannel}
              className={`p-2 rounded-full transition-colors ${
                isInCall || isInChannel
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Videollamada"
            >
              <Video className="w-5 h-5" />
            </button>

            <button 
              onClick={handleJoinVoiceChannel}
              disabled={isInCall || isInChannel}
              className={`p-2 rounded-full transition-all duration-200 ${
                isChannelButtonActive 
                  ? 'bg-green-600 text-white scale-110' 
                  : isInCall || isInChannel
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Unirse al canal de voz"
            >
              <Users className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <UserModalPostcard
        userId={otherUser.id}
        username={otherUser.username}
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        anchorPosition={userModalPosition}
      />
    </>
  );
};

export default ChatHeader;