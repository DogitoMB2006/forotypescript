import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Badge, UserBadge, UserBadgeWithDetails } from '../types/badge';


const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'zaza',
    name: 'Zaza',
    description: 'Badge especial Zaza',
    iconUrl: 'https://cdn3.emoji.gg/emojis/1993-zazaplant.png',
    rarity: 'legendary',
    category: 'special'
  },
  {
    id: 'Staff-Forum',
    name: 'Forum Staff',
    description: 'Miembro del staff del foro',
    iconUrl: 'https://cdn3.emoji.gg/emojis/7871-discord-staff.png',
    rarity: 'epic',
    category: 'staff'
  },
  {
    id: 'moderator',
    name: 'Moderador',
    description: 'Moderador del foro',
    iconUrl: 'https://cdn3.emoji.gg/emojis/1503-moderator-badge.png',
    rarity: 'epic',
    category: 'staff'
  },
  {
    id: 'dp',
    name: 'DP',
    description: 'Badge especial de Deadpool',
    iconUrl: 'https://i.imgur.com/uWJYCpu.png',
    rarity: 'legendary',
    category: 'special'
  },
   {
    id: 'Dev',
    name: 'Developer',
    description: 'Developer badge!',
    iconUrl: 'https://img.icons8.com/fluent/512/discord-early-verified-bot-developer-badge.png',
    rarity: 'legendary',
    category: 'special'
  }
];

export const getAvailableBadges = (): Badge[] => {
  return AVAILABLE_BADGES;
};

export const assignBadgeToUser = async (userId: string, badgeId: string, assignedBy: string) => {
  try {
    const existingBadge = await getUserBadge(userId, badgeId);
    if (existingBadge) {
      throw new Error('El usuario ya tiene este badge');
    }

    await addDoc(collection(db, 'userBadges'), {
      userId,
      badgeId,
      assignedBy,
      assignedAt: new Date()
    });
  } catch (error) {
    console.error('Error assigning badge:', error);
    throw error;
  }
};

export const getUserBadge = async (userId: string, badgeId: string): Promise<UserBadge | null> => {
  try {
    const q = query(
      collection(db, 'userBadges'),
      where('userId', '==', userId),
      where('badgeId', '==', badgeId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return {
        badgeId: docData.badgeId,
        userId: docData.userId,
        assignedAt: docData.assignedAt,
        assignedBy: docData.assignedBy
      } as UserBadge;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user badge:', error);
    return null;
  }
};

export const getUserBadges = async (userId: string): Promise<UserBadgeWithDetails[]> => {
  try {
    const q = query(collection(db, 'userBadges'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const userBadges = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        badgeId: data.badgeId,
        userId: data.userId,
        assignedAt: data.assignedAt,
        assignedBy: data.assignedBy
      } as UserBadge;
    });

    return userBadges.map(userBadge => {
      const badge = AVAILABLE_BADGES.find(b => b.id === userBadge.badgeId);
      return {
        ...userBadge,
        badge: badge!
      };
    }).filter(item => item.badge);
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
};

export const removeBadgeFromUser = async (userId: string, badgeId: string) => {
  try {
    const q = query(
      collection(db, 'userBadges'),
      where('userId', '==', userId),
      where('badgeId', '==', badgeId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      await deleteDoc(querySnapshot.docs[0].ref);
    }
  } catch (error) {
    console.error('Error removing badge:', error);
    throw error;
  }
};

export const setDefaultBadge = async (userId: string, badgeId: string | null) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      defaultBadgeId: badgeId || null,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error setting default badge:', error);
    throw error;
  }
};