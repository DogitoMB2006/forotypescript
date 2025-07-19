import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserCustomTheme } from '../../services/profileThemeService';
import type { UserProfile } from '../../services/userService';
import type { CustomProfileTheme } from '../../types/profileTheme';
import BadgeList from '../user/BadgeList';
import UserRoleDisplay from '../user/UserRoleDisplay';
import ModerationPanel from '../moderation/ModerationPanel';
import SelfBadgeManager from '../moderation/SelfBadgeManager';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onEdit: () => void;
}

const ProfileHeader: FC<ProfileHeaderProps> = ({ profile, isOwnProfile, onEdit }) => {
  const { canModerate, user } = useAuth();
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [showSelfBadgeManager, setShowSelfBadgeManager] = useState(false);
  const [userTheme, setUserTheme] = useState<CustomProfileTheme | null>(null);
  
  const canShowModerationPanel = canModerate && !isOwnProfile;
  const canShowSelfBadgeManager = user?.email === 'dogitomb2022@gmail.com' && isOwnProfile;

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

  const handleSelfBadgeSuccess = () => {
    window.location.reload();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const primaryColor = userTheme?.primaryColor || '#3B82F6';
  const accentColor = userTheme?.accentColor || '#60A5FA';
  const isLightColor = (hex: string): boolean => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 128;
  };

  const textColor = isLightColor(accentColor) ? '#000000' : '#FFFFFF';
  const secondaryTextColor = isLightColor(primaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
  const tertiaryTextColor = isLightColor(primaryColor) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';

  const getProfileImageStyle = () => ({
    border: `4px solid ${primaryColor}`,
    boxShadow: `0 0 0 2px ${accentColor}40`
  });
  
  return (
    <div className="relative">
      <div
        className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-br from-blue-600 to-purple-600 overflow-hidden"
        style={{
          backgroundImage: profile.bannerImageUrl
            ? `url(${profile.bannerImageUrl})`
            : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="relative">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.displayName}
                className="w-32 h-32 rounded-full object-cover shadow-xl transition-all duration-300"
                style={getProfileImageStyle()}
              />
            ) : (
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center shadow-xl text-white text-4xl font-bold transition-all duration-300"
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
      </div>
      
      <div
        className="px-6 pt-20 pb-6"
        style={{
          backgroundColor: primaryColor,
          backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          color: textColor
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h1 
                className="text-3xl font-bold transition-colors duration-300 text-white"
              >
                {profile.displayName}
              </h1>
              <UserRoleDisplay userId={profile.uid} size="md" />
            </div>
            <p className="mb-2" style={{ color: secondaryTextColor }}>
              @{profile.username}
            </p>

            <p className="text-sm mb-4" style={{ color: tertiaryTextColor }}>
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
                className="flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Editar perfil</span>
              </button>
            )}

            {canShowSelfBadgeManager && (
              <button
                onClick={() => setShowSelfBadgeManager(true)}
                className="p-3 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border bg-purple-600/20 border-purple-600/40 text-purple-300 hover:bg-purple-600/30"
                title="Asignar todos los badges"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            
            {canShowModerationPanel && (
              <button
                onClick={() => setShowModerationPanel(true)}
                className="p-3 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border bg-red-600/20 border-red-600/40 text-red-300 hover:bg-red-600/30"
                title="Panel de moderación"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5C2.962 18.333 3.924 20 5.464 20z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {showModerationPanel && (
        <ModerationPanel
          targetUserId={profile.uid}
          targetUsername={profile.username}
          isOpen={showModerationPanel}
          onClose={() => setShowModerationPanel(false)}
        />
      )}

      {showSelfBadgeManager && (
        <SelfBadgeManager
          isOpen={showSelfBadgeManager}
          onClose={() => setShowSelfBadgeManager(false)}
          onSuccess={handleSelfBadgeSuccess}
        />
      )}
    </div>
  );
};

export default ProfileHeader;