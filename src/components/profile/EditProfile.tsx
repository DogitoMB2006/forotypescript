import type { FC } from 'react';
import { useState, useRef } from 'react';
import { updateUserProfile, uploadProfileImage, uploadBannerImage, deleteProfileImage, deleteBannerImage, checkUsernameAvailability } from '../../services/userService';
import type { UserProfile } from '../../services/userService';

interface EditProfileProps {
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
  onCancel: () => void;
}

const EditProfile: FC<EditProfileProps> = ({ profile, onProfileUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    username: profile.username || '',
    bio: profile.bio || ''
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const profileImageRef = useRef<HTMLInputElement>(null);
  const bannerImageRef = useRef<HTMLInputElement>(null);

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
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    if (bannerImageRef.current) {
      bannerImageRef.current.value = '';
    }
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
      }

      await updateUserProfile(profile.uid, updates);

      const updatedProfile: UserProfile = {
        ...profile,
        ...updates
      };

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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => bannerImageRef.current?.click()}
              style={{
                backgroundImage: bannerImagePreview || profile.bannerImageUrl ? 
                  `url(${bannerImagePreview || profile.bannerImageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
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
            <input
              ref={bannerImageRef}
              type="file"
              accept="image/*"
              onChange={handleBannerImageChange}
              className="hidden"
            />
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
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {formData.displayName?.charAt(0).toUpperCase() || profile.displayName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                {(profileImagePreview || profile.profileImageUrl) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProfileImage();
                    }}
                    className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => profileImageRef.current?.click()}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  Cambiar imagen
                </button>
              </div>
            </div>
            <input
              ref={profileImageRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="hidden"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de Usuario
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={3}
                maxLength={20}
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm">
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
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={160}
              placeholder="Cuéntanos algo sobre ti..."
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.bio.length}/160
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (formData.username !== profile.username && !usernameAvailable)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
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
    </div>
  );
};

export default EditProfile;