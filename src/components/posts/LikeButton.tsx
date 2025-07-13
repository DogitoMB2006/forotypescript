import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { togglePostLike } from '../../services/likeService';

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  initialLikedBy: string[];
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const LikeButton: FC<LikeButtonProps> = ({ 
  postId, 
  initialLikes, 
  initialLikedBy, 
  size = 'md',
  showCount = true,
  className = '' 
}) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [likedBy, setLikedBy] = useState<string[]>(initialLikedBy);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      setIsLiked(likedBy.includes(user.uid));
    }
  }, [user?.uid, likedBy]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?.uid || isLoading) return;

    setIsLoading(true);

    try {
      const result = await togglePostLike(postId, user.uid);
      
      if (result.liked) {
        setLikes(prev => prev + 1);
        setLikedBy(prev => [...prev, user.uid]);
        setIsLiked(true);
      } else {
        setLikes(prev => Math.max(0, prev - 1));
        setLikedBy(prev => prev.filter(id => id !== user.uid));
        setIsLiked(false);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={`flex items-center space-x-1 text-gray-500 ${className}`}>
        <svg className={`${sizeClasses[size]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {showCount && <span className={textSizeClasses[size]}>{likes}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center space-x-1 transition-all duration-200 disabled:cursor-not-allowed py-1 px-2 rounded-lg ${
        isLiked 
          ? 'text-red-500 hover:text-red-600 hover:bg-red-900/20' 
          : 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
      } ${className}`}
      title={isLiked ? 'Quitar like' : 'Me gusta'}
    >
      {isLiked ? (
        <svg 
          className={`${sizeClasses[size]} transform ${isLoading ? 'scale-110' : 'hover:scale-110'} transition-transform duration-200`} 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ) : (
        <svg 
          className={`${sizeClasses[size]} transform ${isLoading ? 'scale-110' : 'hover:scale-110'} transition-transform duration-200`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
      
      {showCount && (
        <span className={`${textSizeClasses[size]} font-medium ${isLoading ? 'opacity-70' : ''}`}>
          {isLoading ? '...' : likes}
          {showCount && size !== 'sm' && (
            <span className="hidden sm:inline ml-1">
              {likes === 1 ? 'Me gusta' : 'Me gusta'}
            </span>
          )}
        </span>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`border-2 border-current border-t-transparent rounded-full animate-spin ${
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
          }`}></div>
        </div>
      )}
    </button>
  );
};

export default LikeButton;