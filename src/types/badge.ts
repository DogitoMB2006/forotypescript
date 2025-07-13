export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
}

export interface UserBadge {
  badgeId: string;
  userId: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface UserBadgeWithDetails extends UserBadge {
  badge: Badge;
}