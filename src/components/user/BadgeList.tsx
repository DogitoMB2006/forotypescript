import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { getUserBadges } from '../../services/badgeService';
import type { UserBadgeWithDetails } from '../../types/badge';
import Badge from './Badge';

interface BadgeListProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  className?: string;
}

const BadgeList: FC<BadgeListProps> = ({ userId, size = 'md', maxDisplay, className = '' }) => {
  const [badges, setBadges] = useState<UserBadgeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const userBadges = await getUserBadges(userId);
        setBadges(userBadges);
      } catch (error) {
        console.error('Error fetching user badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  if (loading) {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[...Array(2)].map((_, index) => (
          <div key={index} className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-700 rounded-full animate-pulse`}></div>
        ))}
      </div>
    );
  }

  if (badges.length === 0) return null;

  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remainingCount = maxDisplay && badges.length > maxDisplay ? badges.length - maxDisplay : 0;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {displayBadges.map((userBadge) => (
        <Badge
          key={userBadge.badgeId}
          badge={userBadge.badge}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-400 ml-1">+{remainingCount}</span>
      )}
    </div>
  );
};

export default BadgeList;