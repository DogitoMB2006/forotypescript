import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile } from '../../services/userService';
import { getUserCustomTheme } from '../../services/profileThemeService';
import type { UserProfile } from '../../services/userService';
import type { CustomProfileTheme } from '../../types/profileTheme';
import BadgeList from '../user/BadgeList';

interface UserPreviewModalProps {
  userId: string;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  anchorPosition?: { x: number; y: number };
}

const UserPreviewModal: FC<UserPreviewModalProps> = ({
  userId,
  //username,
  isOpen,
  onClose,
  anchorPosition
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userTheme, setUserTheme] = useState<CustomProfileTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialScrollY = useRef<number>(0);

  useEffect(() => {
    if (isOpen && userId) {
      initialScrollY.current = window.scrollY;
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
      if (!target.closest('.user-preview-modal')) {
        onClose();
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - initialScrollY.current);
      if (scrollDifference > 100) onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  const getModalPosition = () => {
    if (!anchorPosition) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
      };
    }

    const modalWidth = 320;
    const modalHeight = 400;
    const padding = 16;

    let top = anchorPosition.y + 8;
    let left = anchorPosition.x;

    if (left + modalWidth > window.innerWidth - padding) {
      left = window.innerWidth - modalWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    if (top + modalHeight > window.innerHeight - padding) {
      top = anchorPosition.y - modalHeight - 8;
    }
    if (top < padding + 80) {
      top = padding + 80;
    }

    return {
      position: 'fixed' as const,
      top: Math.max(padding + 80, top),
      left: Math.max(padding, left),
      zIndex: 9999,
    };
  };

  if (!isOpen || loading || !userProfile) return null;

  const primaryColor = userTheme?.primaryColor || '#0f172a';
  const accentColor = userTheme?.accentColor || '#10b981';
  const useCustomTheme = userTheme && (userTheme.primaryColor !== '#3B82F6' || userTheme.accentColor !== '#60A5FA');

  return (
    <div className="user-preview-modal" style={getModalPosition()} ref={modalRef}>
      <div className="relative">
        {useCustomTheme ? (
          <div
            className="rounded-2xl shadow-2xl w-80 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200 border-2"
            style={{
              backgroundColor: primaryColor,
              backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              borderColor: accentColor,
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${accentColor}40`
            }}
          >
            <div className="relative">
              <div
                className="h-32"
                style={{
                  backgroundImage: userProfile.bannerImageUrl
                    ? `url(${userProfile.bannerImageUrl})`
                    : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <div className="px-4 pt-2">
                <div className="relative -top-12 flex justify-start -mb-8">
                  {userProfile.profileImageUrl ? (
                    <img
                      src={userProfile.profileImageUrl}
                      alt={userProfile.displayName}
                      className="w-20 h-20 rounded-full object-cover border-4"
                      style={{ borderColor: primaryColor }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-white font-bold text-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                        borderColor: primaryColor
                      }}
                    >
                      {userProfile.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 relative -mt-2">
              <div className="relative z-10 -mt-2">
                <div className="mb-3">
                  <h3 
                    className="font-bold text-lg leading-tight" 
                    style={{ color: isLightColor(accentColor) ? '#000000' : '#FFFFFF' }}
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

                <div className="mb-4">
                  <BadgeList userId={userProfile.uid} size="sm" />
                </div>

                {userProfile.bio && (
                  <p 
                    className="text-sm leading-relaxed mb-4" 
                    style={{ color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }}
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
                  <Link
                    to={`/perfil/${userProfile.uid}`}
                    onClick={onClose}
                    className="flex-1 text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 text-white border"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                      borderColor: accentColor
                    }}
                  >
                    Ver perfil completo
                  </Link>
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-lg transition-colors duration-200 border"
                    title="Cerrar"
                    style={{
                      borderColor: accentColor + '40',
                      color: isLightColor(primaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'
                    }}
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
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-2xl w-80 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="relative">
              <div
                className="h-32 bg-gradient-to-br from-emerald-600/20 via-cyan-600/20 to-indigo-600/20"
                style={{
                  backgroundImage: userProfile.bannerImageUrl
                    ? `url(${userProfile.bannerImageUrl})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <div className="px-4 pt-2">
                <div className="relative -top-12 flex justify-start -mb-8">
                  {userProfile.profileImageUrl ? (
                    <img
                      src={userProfile.profileImageUrl}
                      alt={userProfile.displayName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-slate-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-4 border-slate-700 bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl">
                      {userProfile.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 relative -mt-2">
              <div className="relative z-10 -mt-2">
                <div className="mb-3">
                  <h3 className="font-bold text-lg leading-tight text-white">
                    {userProfile.displayName}
                  </h3>
                  <p className="text-sm text-slate-400">
                    @{userProfile.username}
                  </p>
                </div>

                <div className="mb-4">
                  <BadgeList userId={userProfile.uid} size="sm" />
                </div>

                {userProfile.bio && (
                  <p className="text-sm leading-relaxed mb-4 text-slate-300">
                    {userProfile.bio}
                  </p>
                )}

                <p className="mb-4 text-xs text-slate-500">
                  Se unió en {formatDate(userProfile.createdAt)}
                </p>

                <div className="flex items-center space-x-3">
                  <Link
                    to={`/perfil/${userProfile.uid}`}
                    onClick={onClose}
                    className="flex-1 text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white border border-emerald-500/50"
                  >
                    Ver perfil completo
                  </Link>
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-lg transition-colors duration-200 border border-slate-600/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
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
        )}
      </div>
    </div>
  );
};

export default UserPreviewModal;