import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { getUserProfile } from '../../services/userService';
import { getUserCustomTheme } from '../../services/profileThemeService';
import type { UserProfile } from '../../services/userService';
import type { CustomProfileTheme } from '../../types/profileTheme';
import BadgeList from '../user/BadgeList';

interface UserModalPostcardProps {
  userId: string;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  anchorPosition?: { x: number; y: number };
}

const UserModalPostcard: FC<UserModalPostcardProps> = ({
  userId,
  isOpen,
  onClose,
  anchorPosition
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userTheme, setUserTheme] = useState<CustomProfileTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchProfile = async () => {
        try {
          const [profile, theme] = await Promise.all([
            getUserProfile(userId),
            getUserCustomTheme(userId)
          ]);
          setUserProfile(profile);
          setUserTheme(theme);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-modal-postcard')) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const formatDate = (date: Date | any) => {
    if (!date) return '';
    const actualDate = date.toDate ? date.toDate() : new Date(date);
    return actualDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isLightColor = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  };

  const handleProfileClick = () => {
    if (userProfile?.uid) {
      window.open(`/perfil/${userProfile.uid}`, '_blank');
      onClose();
    }
  };

  if (!isOpen) return null;

  const primaryColor = userTheme?.primaryColor || '#1f2937';
  const accentColor = userTheme?.accentColor || '#10b981';

  const getModalStyle = () => {
    if (!anchorPosition) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50
      };
    }

    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50
      };
    }

    const modalWidth = 320;
    const padding = 20;
    const maxLeft = window.innerWidth - modalWidth - padding;
    const minLeft = padding;
    
    let left = anchorPosition.x - (modalWidth / 2);
    left = Math.max(minLeft, Math.min(left, maxLeft));
    
    let top = anchorPosition.y + 10;
    if (top + 400 > window.innerHeight) {
      top = anchorPosition.y - 410;
    }
    
    return {
      position: 'fixed' as const,
      top: Math.max(10, top),
      left,
      zIndex: 50
    };
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        className="user-modal-postcard pointer-events-auto"
        ref={modalRef}
        style={getModalStyle()}
      >
        {loading ? (
          <div className="rounded-2xl shadow-2xl w-80 max-w-[90vw] h-96 bg-slate-800 border border-slate-600 flex items-center justify-center mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-300">Cargando...</span>
            </div>
          </div>
        ) : userProfile ? (
          <div
            className="rounded-2xl shadow-2xl w-80 max-w-[90vw] overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200 border-2 mx-auto"
            style={{
              backgroundColor: primaryColor,
              backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              borderColor: accentColor,
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${accentColor}40`
            }}
          >
            <div className="relative">
              <div
                className="h-24 sm:h-32"
                style={{
                  backgroundImage: userProfile.bannerImageUrl
                    ? `url(${userProfile.bannerImageUrl})`
                    : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                <div className="relative">
                  <img
                    src={userProfile.profileImageUrl || '/default-avatar.png'}
                    alt={userProfile.displayName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 object-cover shadow-lg"
                    style={{ borderColor: accentColor }}
                  />
                  <div className="absolute -bottom-1 -right-1">
                    <BadgeList userId={userId} size="sm" maxDisplay={1} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 sm:pt-12 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="text-center">
                <h3 
                  className="text-lg sm:text-xl font-bold mb-1" 
                  style={{ color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }}
                >
                  {userProfile.displayName}
                </h3>
                
                <p 
                  className="text-sm mb-3" 
                  style={{ color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}
                >
                  @{userProfile.username}
                </p>

                {userProfile.bio && (
                  <p 
                    className="text-sm mb-3 leading-relaxed" 
                    style={{ color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }}
                  >
                    {userProfile.bio}
                  </p>
                )}

                <p 
                  className="mb-3 sm:mb-4 text-xs" 
                  style={{ color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}
                >
                  Se unió en {formatDate(userProfile.createdAt)}
                </p>

                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={handleProfileClick}
                    disabled={!userProfile?.uid}
                    className="flex-1 text-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 transform hover:scale-105 text-white border disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: userProfile?.uid ? `linear-gradient(135deg, ${accentColor}, ${primaryColor})` : '#6b7280',
                      borderColor: accentColor
                    }}
                  >
                    Ver perfil
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 sm:p-2.5 rounded-lg transition-colors duration-200 border"
                    title="Cerrar"
                    style={{
                      borderColor: accentColor + '40',
                      color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'
                    }}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl shadow-2xl w-80 max-w-[90vw] h-96 bg-red-900/50 border border-red-500 flex items-center justify-center mx-auto">
            <div className="text-center p-6">
              <h3 className="text-lg font-bold text-red-300 mb-2">Error</h3>
              <p className="text-red-300">No se pudo cargar el perfil</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserModalPostcard;