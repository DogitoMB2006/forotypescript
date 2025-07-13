import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserProfile } from '../../services/userService';
import type { UserProfile } from '../../services/userService';
import ProfileHeader from './ProfileHeader';
import ProfileBio from './ProfileBio';
import ProfilePosts from './ProfilePosts';
import EditProfile from './EditProfile';

interface ProfileProps {
  userId?: string;
}

const Profile: FC<ProfileProps> = ({ userId }) => {
  const { user, userProfile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const targetUserId = userId || user?.uid;
  const isOwnProfile = user?.uid === targetUserId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        if (isOwnProfile && currentUserProfile) {
          setProfile(currentUserProfile);
        } else {
          const fetchedProfile = await getUserProfile(targetUserId);
          setProfile(fetchedProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    if (initialLoad) {
      window.scrollTo(0, 0);
      setInitialLoad(false);
    }
  }, [targetUserId, isOwnProfile, currentUserProfile, initialLoad]);

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-700"></div>
          <div className="relative">
            <div className="absolute -bottom-12 left-6 w-24 h-24 bg-gray-700 rounded-full border-4 border-gray-900"></div>
          </div>
          <div className="pt-16 px-6 pb-6">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-300 mb-4">{error}</h2>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Perfil no encontrado</h2>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <EditProfile
        profile={profile}
        onProfileUpdated={handleProfileUpdated}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileHeader 
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEdit={() => setIsEditing(true)}
      />
      
      <ProfileBio 
        profile={profile}
        isOwnProfile={isOwnProfile}
      />
      
      <ProfilePosts 
        userId={profile.uid}
        username={profile.username}
      />
    </div>
  );
};

export default Profile;