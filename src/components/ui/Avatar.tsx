import type { FC } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: FC<AvatarProps> = ({ src, alt, name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl'
  };

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-full flex items-center justify-center ${className}`}>
      <span className="text-white font-medium">
        {getInitials(name)}
      </span>
    </div>
  );
};

export default Avatar;