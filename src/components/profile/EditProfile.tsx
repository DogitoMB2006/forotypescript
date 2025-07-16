import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { updateUserProfile, uploadProfileImage, uploadBannerImage, checkUsernameAvailability } from '../../services/userService';
import { getUserBadges, setDefaultBadge } from '../../services/badgeService';
import { getUserCustomTheme, updateUserCustomTheme } from '../../services/profileThemeService';
import type { UserProfile } from '../../services/userService';
import type { UserBadgeWithDetails } from '../../types/badge';
import type { CustomProfileTheme } from '../../types/profileTheme';
import BadgeList from '../user/BadgeList';
import ImageCropModal from '../ui/ImageCropModal';
import BannerUploadModal from './BannerUploadModal';
import ThemeCustomizer from './ThemeCustomizer';

interface EditProfileProps {
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
  onCancel: () => void;
}

const EditProfile: FC<EditProfileProps> = ({ profile, onProfileUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio || '',
    defaultBadgeId: (profile as any).defaultBadgeId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [customTheme, setCustomTheme] = useState<CustomProfileTheme>({
    primaryColor: '#3B82F6',
    accentColor: '#60A5FA'
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [bannerGifUrl, setBannerGifUrl] = useState<string | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const [showProfileCrop, setShowProfileCrop] = useState(false);
  const [showBannerCrop, setShowBannerCrop] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);

  const profileImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserTheme = async () => {
      try {
        const theme = await getUserCustomTheme(profile.uid);
        setCustomTheme(theme);
      } catch (error) {
        console.error('Error fetching user theme:', error);
      }
    };

    fetchUserTheme();
  }, [profile.uid]);

  const handleUsernameChange = async (newUsername: string) => {
    setFormData(prev => ({ ...prev, username: newUsername }));
    
    if (newUsername === profile.username) {
      setUsernameAvailable(true);
      return;
    }

    if (newUsername.length >= 3) {
      setCheckingUsername(true);
      try {
        const available = await checkUsernameAvailability(newUsername);
        setUsernameAvailable(available);
      } catch (error) {
        console.error('Error checking username:', error);
      }
      setCheckingUsername(false);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setTempImageUrl(imageUrl);
        setShowProfileCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setTempImageUrl(imageUrl);
      setShowBannerCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerGifSelect = (gifUrl: string) => {
    setBannerGifUrl(gifUrl);
    setBannerImagePreview(gifUrl);
    setBannerImage(null);
  };

  const handleProfileCrop = (croppedFile: File) => {
    setProfileImage(croppedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleBannerCrop = (croppedFile: File) => {
    setBannerImage(croppedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
    setBannerGifUrl(null);
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    if (profileImageRef.current) {
      profileImageRef.current.value = '';
    }
  };

  const removeBannerImage = () => {
    setBannerImage(null);
    setBannerImagePreview(null);
    setBannerGifUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName.trim() || !formData.username.trim()) {
      setError('El nombre y el nombre de usuario son requeridos');
      return;
    }

    if (formData.username !== profile.username && !usernameAvailable) {
      setError('El nombre de usuario no está disponible');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updates: Partial<UserProfile> = {
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim()
      };

      if (profileImage) {
        const profileImageUrl = await uploadProfileImage(profile.uid, profileImage);
        updates.profileImageUrl = profileImageUrl;
      }

      if (bannerImage) {
        const bannerImageUrl = await uploadBannerImage(profile.uid, bannerImage);
        updates.bannerImageUrl = bannerImageUrl;
      } else if (bannerGifUrl) {
        updates.bannerImageUrl = bannerGifUrl;
      }

      await updateUserProfile(profile.uid, updates);

      if (formData.defaultBadgeId !== (profile as any).defaultBadgeId) {
        await setDefaultBadge(profile.uid, formData.defaultBadgeId || null);
      }

      await updateUserCustomTheme(profile.uid, customTheme);

      const updatedProfile: UserProfile = {
        ...profile,
        ...updates
      } as UserProfile & { defaultBadgeId?: string };

      onProfileUpdated(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Error al actualizar el perfil. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatus = () => {
    if (formData.username === profile.username) return null;
    if (formData.username.length < 3) return null;
    if (checkingUsername) return <span className="text-yellow-400">Verificando...</span>;
    if (usernameAvailable === true) return <span className="text-green-400">✓ Disponible</span>;
    if (usernameAvailable === false) return <span className="text-red-400">✗ No disponible</span>;
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded-md text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Imagen de Banner
            </label>
            <div 
              className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setShowBannerModal(true)}
              style={{
                backgroundImage: bannerImagePreview || profile.bannerImageUrl ? 
                  `url(${bannerImagePreview || profile.bannerImageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              {(bannerImagePreview || profile.bannerImageUrl) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBannerImage();
                  }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Imagen de Perfil
            </label>
            <div className="flex items-center space-x-4">
              <div 
                className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group"
                onClick={() => profileImageRef.current?.click()}
              >
                {profileImagePreview || profile.profileImageUrl ? (
                  <img
                    src={profileImagePreview || profile.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <input
                ref={profileImageRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => profileImageRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Cambiar foto
                </button>
                {(profileImagePreview || profile.profileImageUrl) && (
                  <button
                    type="button"
                    onClick={removeProfileImage}
                    className="ml-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de usuario
            </label>
            <input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tu nombre de usuario"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de usuario único
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="nombreusuario"
                required
                minLength={3}
              />
              <div className="absolute right-3 top-2.5 text-sm">
                {getUsernameStatus()}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
              Biografía
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Cuéntanos sobre ti..."
              rows={3}
              maxLength={160}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.bio.length}/160
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Insignias obtenidas
            </label>
            <div className="bg-gray-800 rounded-lg p-4">
              <BadgeList userId={profile.uid} size="sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Personalización del perfil
            </label>
            <ThemeCustomizer
              theme={customTheme}
              onChange={setCustomTheme}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (formData.username !== profile.username && !usernameAvailable)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </div>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>

      <BannerUploadModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        onFileSelect={handleBannerFileSelect}
        onGifSelect={handleBannerGifSelect}
      />

      <ImageCropModal
        isOpen={showProfileCrop}
        onClose={() => setShowProfileCrop(false)}
        onCrop={handleProfileCrop}
        imageUrl={tempImageUrl}
        aspectRatio={1}
        title="Ajustar imagen de perfil"
      />

      <ImageCropModal
        isOpen={showBannerCrop}
        onClose={() => setShowBannerCrop(false)}
        onCrop={handleBannerCrop}
        imageUrl={tempImageUrl}
        aspectRatio={16/9}
        title="Ajustar imagen de banner"
      />
    </div>
  );
};

export default EditProfile;