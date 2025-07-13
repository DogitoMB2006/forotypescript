import type { FC } from 'react';
import { useState } from 'react';
import type { Badge as BadgeType } from '../../types/badge';

interface BadgeProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const Badge: FC<BadgeProps> = ({ badge, size = 'md', showTooltip = true, className = '' }) => {
  const [showTooltipState, setShowTooltipState] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'common': return 'ring-gray-400';
      case 'rare': return 'ring-blue-400';
      case 'epic': return 'ring-purple-400';
      case 'legendary': return 'ring-yellow-400';
      default: return 'ring-gray-400';
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      <img
        src={badge.iconUrl}
        alt={badge.name}
        className={`${sizeClasses[size]} rounded-full ring-2 ${getRarityColor(badge.rarity)} object-cover`}
      />
      
      {showTooltip && showTooltipState && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          <div className="font-medium">{badge.name}</div>
          <div className="text-gray-400">{badge.description}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default Badge;