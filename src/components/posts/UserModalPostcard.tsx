import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { getUserProfile } from '../../services/userService';
import { getUserCustomTheme } from '../../services/profileThemeService';
import { getUserBadges } from '../../services/badgeService';
import type { UserProfile } from '../../services/userService';
import type { CustomProfileTheme } from '../../types/profileTheme';
import type { UserBadgeWithDetails } from '../../types/badge';
import Badge from '../user/Badge';

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
  const [userBadges, setUserBadges] = useState<UserBadgeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchProfile = async () => {
        try {
          const [profile, theme, badges] = await Promise.all([
            getUserProfile(userId),
            getUserCustomTheme(userId),
            getUserBadges(userId)
          ]);
          setUserProfile(profile);
          setUserTheme(theme);
          setUserBadges(badges);
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
    if (top + 450 > window.innerHeight) {
      top = anchorPosition.y - 460;
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
            className="rounded-2xl shadow-2xl w-80 max-w-[90vw] border overflow-hidden mx-auto"
            style={{
              backgroundColor: primaryColor,
              borderColor: accentColor
            }}
          >
            <div
              className="h-24 relative"
              style={{
                background: userProfile.bannerImageUrl
                  ? `url(${userProfile.bannerImageUrl})`
                  : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="absolute inset-0 bg-black/20" />
            </div>
            
            <div className="px-4 pt-2">
              <div className="relative -top-12 flex justify-start -mb-8">
                {userProfile.profileImageUrl ? (
                  <img
                    src={userProfile.profileImageUrl}
                    alt={userProfile.displayName}
                    className="w-20 h-20 rounded-full object-cover shadow-xl transition-all duration-300"
                    style={{
                      border: `4px solid ${primaryColor}`,
                      boxShadow: `0 0 0 2px ${accentColor}40`
                    }}
                  />
                ) : (
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl text-white text-2xl font-bold transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                      border: `4px solid ${primaryColor}`,
                      boxShadow: `0 0 0 2px ${accentColor}40`
                    }}
                  >
                    {userProfile.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div 
              className="p-4 relative -mt-2"
              style={{
                backgroundColor: primaryColor,
                color: isLightColor(primaryColor) ? '#000000' : '#FFFFFF'
              }}
            >
              <div className="relative z-10 -mt-2">
                <div className="mb-3">
                  <h3 
                    className="font-bold text-lg leading-tight"
                    style={{ color: isLightColor(primaryColor) ? '#000000' : '#FFFFFF' }}
                  >
                    {userProfile.displayName}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }}
                  >
                    @{userProfile.username}
                  </p>
                </div>

                
                {userBadges.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {userBadges.map((userBadge) => (
                        <div
                          key={userBadge.badgeId}
                          className="relative group"
                        >
                          <Badge 
                            badge={userBadge.badge} 
                            size="md" 
                            showTooltip={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {userProfile.bio && (
                  <p 
                    className="text-sm leading-relaxed mb-4"
                    style={{ color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }}
                  >
                    {userProfile.bio}
                  </p>
                )}

                <p 
                  className="mb-4 text-xs"
                  style={{ color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}
                >
                  Se unió en {formatDate(userProfile.createdAt)}
                </p>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleProfileClick}
                    className="flex-1 text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 text-white border border-white/20"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                      boxShadow: `0 4px 12px ${accentColor}30`
                    }}
                  >
                    Ver perfil completo
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-lg transition-colors duration-200 border border-white/20 hover:bg-white/10"
                    style={{ color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }}
                    title="Cerrar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl shadow-2xl w-80 max-w-[90vw] h-96 bg-slate-800 border border-slate-600 flex items-center justify-center mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5C2.962 18.333 3.924 20 5.464 20z" />
                </svg>
              </div>
              <p className="text-slate-300 text-sm">Error al cargar el perfil</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserModalPostcard;