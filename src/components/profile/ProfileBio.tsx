import type { FC } from 'react';
import type { UserProfile } from '../../services/userService';

interface ProfileBioProps {
  profile: UserProfile;
  isOwnProfile: boolean;
}

const ProfileBio: FC<ProfileBioProps> = ({ profile, isOwnProfile }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Acerca de</h2>
      
      {profile.bio ? (
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {profile.bio}
        </p>
      ) : (
        <div className="text-center py-8">
          {isOwnProfile ? (
            <p className="text-gray-500">
              Agrega una biografía para contarle a otros sobre ti
            </p>
          ) : (
            <p className="text-gray-500">
              {profile.displayName} aún no ha agregado una biografía
            </p>
          )}
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-gray-400 text-sm">Posts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-gray-400 text-sm">Seguidores</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-gray-400 text-sm">Siguiendo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBio;