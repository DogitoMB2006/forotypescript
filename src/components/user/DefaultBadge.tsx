import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { getAvailableBadges } from '../../services/badgeService';
import type { Badge as BadgeType } from '../../types/badge';
import Badge from './Badge';

interface DefaultBadgeProps {
  badgeId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DefaultBadge: FC<DefaultBadgeProps> = ({ badgeId, size = 'sm', className = '' }) => {
  const [badge, setBadge] = useState<BadgeType | null>(null);

  useEffect(() => {
    if (badgeId) {
      const availableBadges = getAvailableBadges();
      const foundBadge = availableBadges.find(b => b.id === badgeId);
      setBadge(foundBadge || null);
    } else {
      setBadge(null);
    }
  }, [badgeId]);

  if (!badge || !badgeId) return null;

  return (
    <div className={className}>
      <Badge badge={badge} size={size} />
    </div>
  );
};

export default DefaultBadge;