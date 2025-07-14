
import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile } from '../../services/userService';
import { getUserCustomTheme } from '../../services/profileThemeService';
import type { UserProfile } from '../../services/userService';
import type { CustomProfileTheme } from '../../types/profileTheme';
import Avatar from './Avatar';
import BadgeList from '../user/BadgeList';

interface UserPreviewModalProps {
  userId: string;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  anchorPosition?: { x: number; y: number };
}

const UserPreviewModal: FC<UserPreviewModalProps> = ({ userId, isOpen, onClose, anchorPosition }) => {
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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-preview-modal')) {
        onClose();
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - initialScrollY.current);
      if (scrollDifference > 100) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('scroll', handleScroll);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalStyle = anchorPosition ? {
    position: 'fixed' as const,
    top: `${Math.max(10, Math.min(anchorPosition.y + 10, window.innerHeight - 350))}px`,
    left: `${Math.max(10, Math.min(anchorPosition.x, window.innerWidth - 330))}px`,
    zIndex: 1000
  } : {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Fecha inválida' : d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const primaryColor = userTheme?.primaryColor || '#3B82F6';
  const accentColor = userTheme?.accentColor || '#60A5FA';

  if (loading) {
    return (
      <div className="user-preview-modal" style={modalStyle} ref={modalRef}>
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-80 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="animate-pulse p-4">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="user-preview-modal" style={modalStyle} ref={modalRef}>
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-80 p-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <p className="text-gray-400 text-center">Usuario no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-preview-modal" style={modalStyle} ref={modalRef}>
      <div 
        className="rounded-xl shadow-2xl w-80 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200 border-2"
        style={{
          backgroundColor: primaryColor,
          backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          borderColor: primaryColor,
          boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px ${primaryColor}`
        }}
      >
        <div className="relative">
          <div 
            className="h-20"
            style={{
              background: userProfile.bannerImageUrl 
                ? `url(${userProfile.bannerImageUrl})`
                : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="px-4 pt-2">
            <div className="relative -top-8 flex justify-start -mb-4">
              {userProfile.profileImageUrl ? (
                <img
                  src={userProfile.profileImageUrl}
                  alt={userProfile.displayName}
                  className="w-16 h-16 rounded-full object-cover border-4"
                  style={{ borderColor: '#111827' }}
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-white font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                    borderColor: '#111827'
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
              <h3 className="font-bold text-lg leading-tight" style={{ color: accentColor }}>
                {userProfile.displayName}
              </h3>
              <p className="text-gray-200 text-sm">@{userProfile.username}</p>
            </div>

            <div className="mb-4">
              <BadgeList userId={userProfile.uid} size="sm" />
            </div>

            {userProfile.bio && (
              <p className="text-gray-100 text-sm leading-relaxed mb-4">{userProfile.bio}</p>
            )}

            <p className="mb-4 text-xs text-gray-300">
              Se unió en {formatDate(userProfile.createdAt)}
            </p>

            <div className="flex items-center space-x-3">
              <Link
                to={`/perfil/${userProfile.uid}`}
                onClick={onClose}
                className="flex-1 text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 text-white border"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                  borderColor: primaryColor
                }}
              >
                Ver perfil completo
              </Link>
              <button
                onClick={onClose}
                className="p-2.5 text-gray-400 hover:text-white rounded-lg transition-colors duration-200 border"
                title="Cerrar"
                style={{ borderColor: primaryColor + '40' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreviewModal;
