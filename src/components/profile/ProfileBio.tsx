import type { FC } from 'react';
import type { UserProfile } from '../../services/userService';

interface ProfileBioProps {
  profile: UserProfile;
  isOwnProfile: boolean;
}

const ProfileBio: FC<ProfileBioProps> = ({ profile, isOwnProfile }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">Acerca de</h2>
      
      {profile.bio ? (
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">
          {profile.bio}
        </p>
      ) : (
        <div className="text-center py-8 mb-6">
          {isOwnProfile ? (
            <div>
              <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-gray-500 font-medium">
                Agrega una biografía para contarle a otros sobre ti
              </p>
            </div>
          ) : (
            <div>
              <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-gray-500 font-medium">
                {profile.displayName} aún no ha agregado una biografía
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="pt-6 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="group hover:bg-gray-800/50 rounded-lg p-4 transition-colors duration-200 cursor-pointer">
            <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200">0</p>
            <p className="text-gray-400 text-sm font-medium">Posts</p>
          </div>
          <div className="group hover:bg-gray-800/50 rounded-lg p-4 transition-colors duration-200 cursor-pointer">
            <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200">0</p>
            <p className="text-gray-400 text-sm font-medium">Seguidores</p>
          </div>
          <div className="group hover:bg-gray-800/50 rounded-lg p-4 transition-colors duration-200 cursor-pointer">
            <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200">0</p>
            <p className="text-gray-400 text-sm font-medium">Siguiendo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBio;