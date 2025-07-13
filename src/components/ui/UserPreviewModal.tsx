import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile } from '../../services/userService';
import type { UserProfile } from '../../services/userService';
import Avatar from './Avatar';

interface UserPreviewModalProps {
  userId: string;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  anchorPosition?: { x: number; y: number };
}

const UserPreviewModal: FC<UserPreviewModalProps> = ({ userId, isOpen, onClose, anchorPosition }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialScrollY = useRef<number>(0);

  useEffect(() => {
    if (isOpen && userId) {
      initialScrollY.current = window.scrollY;
      const fetchProfile = async () => {
        try {
          const profile = await getUserProfile(userId);
          setUserProfile(profile);
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
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="user-preview-modal" style={modalStyle} ref={modalRef}>
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-80 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="animate-pulse">
            <div className="h-20 bg-gray-700"></div>
            <div className="p-4">
              <div className="flex items-start space-x-3 -mt-8">
                <div className="w-16 h-16 bg-gray-700 rounded-full border-4 border-gray-900"></div>
                <div className="flex-1 mt-4">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
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
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-80 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
        <div className="relative">
          <div 
            className="h-20 bg-gradient-to-r from-blue-600 to-purple-600 relative"
            style={{
              backgroundImage: userProfile.bannerImageUrl ? `url(${userProfile.bannerImageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!userProfile.bannerImageUrl && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-80"></div>
            )}
          </div>
          
          <div className="absolute -bottom-8 left-4">
            <Avatar 
              src={userProfile.profileImageUrl}
              name={userProfile.displayName}
              size="xl"
              className="border-4 border-gray-900 shadow-xl ring-2 ring-gray-800"
            />
          </div>
        </div>
        
        <div className="pt-10 p-4">
          <div className="mb-3">
            <h3 className="font-bold text-white text-lg leading-tight">{userProfile.displayName}</h3>
            <p className="text-gray-400 text-sm">@{userProfile.username}</p>
          </div>
          
          {userProfile.bio && (
            <div className="mb-4">
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                {userProfile.bio}
              </p>
            </div>
          )}
          
          <div className="mb-4 text-xs text-gray-500">
            <span>Se unió en {formatDate(userProfile.createdAt)}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              to={`/perfil/${userProfile.uid}`}
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
            >
              Ver perfil completo
            </Link>
            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200"
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
  );
};

export default UserPreviewModal;