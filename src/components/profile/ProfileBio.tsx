import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { getUserCustomTheme } from '../../services/profileThemeService';
import type { UserProfile } from '../../services/userService';
import type { CustomProfileTheme } from '../../types/profileTheme';

interface ProfileBioProps {
  profile: UserProfile;
  isOwnProfile: boolean;
}

const ProfileBio: FC<ProfileBioProps> = ({ profile, isOwnProfile }) => {
  const [userTheme, setUserTheme] = useState<CustomProfileTheme | null>(null);

  useEffect(() => {
    const fetchUserTheme = async () => {
      try {
        const theme = await getUserCustomTheme(profile.uid);
        setUserTheme(theme);
      } catch (error) {
        console.error('Error fetching user theme:', error);
      }
    };

    fetchUserTheme();
  }, [profile.uid]);

  const isLightColor = (hex: string): boolean => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 128;
  };

  const primaryColor = userTheme?.primaryColor || '#3B82F6';
  const accentColor = userTheme?.accentColor || '#60A5FA';
  const textColor = isLightColor(accentColor) ? '#000000' : '#FFFFFF';
  const secondaryTextColor = isLightColor(primaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';

  const getStatsItemStyle = (isHovered: boolean) => ({
    background: isHovered ? `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)` : 'transparent',
    borderColor: isHovered ? primaryColor : 'transparent',
    color: isHovered ? textColor : '#FFFFFF'
  });

  return (
    <div 
      className="border border-gray-800 rounded-lg p-6 shadow-lg transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
        borderColor: primaryColor
      }}
    >
      <h2 
        className="text-xl font-bold mb-6 transition-colors duration-300"
        style={{ color: textColor }}
      >
        Acerca de
      </h2>
      
      {profile.bio ? (
        <p 
          className="leading-relaxed whitespace-pre-wrap mb-6 transition-colors duration-300"
          style={{ color: secondaryTextColor }}
        >
          {profile.bio}
        </p>
      ) : (
        <div className="text-center py-8 mb-6">
          {isOwnProfile ? (
            <div>
              <svg 
                className="w-12 h-12 mx-auto mb-3 transition-colors duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: textColor, opacity: 0.7 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p 
                className="font-medium transition-colors duration-300"
                style={{ color: secondaryTextColor }}
              >
                Agrega una biografía para contarle a otros sobre ti
              </p>
            </div>
          ) : (
            <div>
              <svg 
                className="w-12 h-12 mx-auto mb-3 transition-colors duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: textColor, opacity: 0.7 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p 
                className="font-medium transition-colors duration-300"
                style={{ color: secondaryTextColor }}
              >
                {profile.displayName} aún no ha agregado una biografía
              </p>
            </div>
          )}
        </div>
      )}
      
      <div 
        className="pt-6 border-t transition-colors duration-300"
        style={{ borderColor: `${textColor}30` }}
      >
        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { label: 'Posts', value: 0 },
            { label: 'Seguidores', value: 0 },
            { label: 'Siguiendo', value: 0 }
          ].map((stat, index) => (
            <StatsItem
              key={index}
              label={stat.label}
              value={stat.value}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface StatsItemProps {
  label: string;
  value: number;
  textColor: string;
  secondaryTextColor: string;
}

const StatsItem: FC<StatsItemProps> = ({ label, value, textColor, secondaryTextColor }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="rounded-lg p-4 transition-all duration-300 cursor-pointer border transform hover:scale-105"
      style={{
        background: isHovered ? `rgba(255, 255, 255, 0.1)` : 'rgba(255, 255, 255, 0.05)',
        borderColor: isHovered ? `${textColor}50` : 'transparent',
        backdropFilter: 'blur(10px)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p 
        className="text-2xl font-bold transition-colors duration-300"
        style={{ color: textColor }}
      >
        {value}
      </p>
      <p 
        className="text-sm font-medium transition-colors duration-300"
        style={{ color: secondaryTextColor, opacity: 0.8 }}
      >
        {label}
      </p>
    </div>
  );
};

export default ProfileBio;