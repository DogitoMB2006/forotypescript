import type { FC } from 'react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { UserProfile } from '../../services/userService';
import BadgeList from '../user/BadgeList';
import UserRoleDisplay from '../user/UserRoleDisplay';
import ModerationPanel from '../moderation/ModerationPanel';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onEdit: () => void;
}

const ProfileHeader: FC<ProfileHeaderProps> = ({ profile, isOwnProfile, onEdit }) => {
  const { user, canModerate } = useAuth();
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  
  const canShowModerationPanel = canModerate && !isOwnProfile;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div 
          className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative"
          style={{
            backgroundImage: profile.bannerImageUrl ? `url(${profile.bannerImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!profile.bannerImageUrl && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-80"></div>
          )}
        </div>
        
        <div className="relative">
          <div className="absolute -bottom-12 left-6 z-10">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full border-4 border-gray-900 object-cover shadow-xl ring-2 ring-gray-800"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-600 rounded-full border-4 border-gray-900 flex items-center justify-center shadow-xl ring-2 ring-gray-800">
                <span className="text-white text-2xl font-bold">
                  {profile.displayName?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-6 pt-16 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
                <UserRoleDisplay userId={profile.uid} size="md" />
              </div>
              <p className="text-gray-400 mb-2">@{profile.username}</p>
              <p className="text-gray-500 text-sm mb-4">
                Se unió en {formatDate(profile.createdAt)}
              </p>
              <div>
                <BadgeList userId={profile.uid} size="md" />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 ml-6">
              {isOwnProfile && (
                <button
                  onClick={onEdit}
                  className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Editar perfil</span>
                </button>
              )}
              
              {canShowModerationPanel && (
                <button
                  onClick={() => setShowModerationPanel(true)}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Moderación</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ModerationPanel
        targetUserId={profile.uid}
        targetUsername={profile.username}
        isOpen={showModerationPanel}
        onClose={() => setShowModerationPanel(false)}
      />
    </>
  );
};

export default ProfileHeader;