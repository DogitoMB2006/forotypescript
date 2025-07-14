import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserCustomTheme } from '../../services/profileThemeService';
import type { UserProfile } from '../../services/userService';
import type { CustomProfileTheme } from '../../types/profileTheme';
import BadgeList from '../user/BadgeList';
import UserRoleDisplay from '../user/UserRoleDisplay';
import ModerationPanel from '../moderation/ModerationPanel';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onEdit: () => void;
}

const ProfileHeader: FC<ProfileHeaderProps> = ({ profile, isOwnProfile, onEdit }) => {
  const { canModerate } = useAuth();
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [userTheme, setUserTheme] = useState<CustomProfileTheme | null>(null);
  
  const canShowModerationPanel = canModerate && !isOwnProfile;

  useEffect(() => {
    const fetchUserTheme = async () => {
      try {
        const theme = await getUserCustomTheme(profile.uid);
        setUserTheme(theme);
      } catch (error) {
        console.error('Error fetching user theme:', error);
      }
    };

    fetchUserTheme();
  }, [profile.uid]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const isLightColor = (hex: string): boolean => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 128;
  };

  const primaryColor = userTheme?.primaryColor || '#3B82F6';
  const accentColor = userTheme?.accentColor || '#60A5FA';
  const textColor = isLightColor(accentColor) ? '#000000' : '#FFFFFF';
  const secondaryTextColor = isLightColor(primaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';

  const getBannerStyle = () => {
    if (profile.bannerImageUrl) {
      return {
        backgroundImage: `url(${profile.bannerImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {
      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
    };
  };

  const getProfileImageStyle = () => ({
    border: `4px solid ${primaryColor}`,
    boxShadow: `0 0 0 2px ${accentColor}, 0 25px 25px -5px rgba(0, 0, 0, 0.25)`
  });

  return (
    <>
      <div 
        className="border border-gray-800 rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          borderColor: primaryColor
        }}
      >
        <div 
          className="h-48 relative transition-all duration-300"
          style={getBannerStyle()}
        >
          {!profile.bannerImageUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative">
          <div className="absolute -bottom-12 left-6 z-10">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full object-cover shadow-xl transition-all duration-300"
                style={getProfileImageStyle()}
              />
            ) : (
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl text-white text-2xl font-bold transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                  ...getProfileImageStyle()
                }}
              >
                {profile.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        
        <div className="px-6 pt-16 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 
                  className="text-2xl font-bold transition-colors duration-300"
                  style={{ color: textColor }}
                >
                  {profile.displayName}
                </h1>
                <UserRoleDisplay userId={profile.uid} size="md" />
              </div>
              <p 
                className="mb-2 transition-colors duration-300"
                style={{ color: secondaryTextColor }}
              >
                @{profile.username}
              </p>
              <p 
                className="text-sm mb-4 transition-colors duration-300"
                style={{ color: secondaryTextColor, opacity: 0.8 }}
              >
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
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border"
                  style={{
                    background: `rgba(255, 255, 255, ${isLightColor(primaryColor) ? '0.2' : '0.1'})`,
                    borderColor: textColor,
                    color: textColor,
                    backdropFilter: 'blur(10px)'
                  }}
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