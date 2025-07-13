import type { FC } from 'react';
import type { UserProfile } from '../../services/userService';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onEdit: () => void;
}

const ProfileHeader: FC<ProfileHeaderProps> = ({ profile, isOwnProfile, onEdit }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
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
      
      <div className="p-6">
        <div className="flex items-start justify-between -mt-16">
          <div className="flex items-start space-x-4">
            <div className="relative">
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile.displayName}
                  className="w-24 h-24 rounded-full border-4 border-gray-900 object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-blue-600 rounded-full border-4 border-gray-900 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {profile.displayName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-12">
              <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
              <p className="text-gray-400">@{profile.username}</p>
              <p className="text-gray-500 text-sm mt-1">
                Se unió en {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
          
          {isOwnProfile && (
            <button
              onClick={onEdit}
              className="mt-12 flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Editar perfil</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;