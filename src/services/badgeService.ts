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
    description: 'Desarollador oficial del foro',
    iconUrl: 'https://cdn3.emoji.gg/emojis/5591-discord-developer-badge-shimmer.gif',
    rarity: 'legendary',
    category: 'special'
  }
];

export const getAvailableBadges = (): Badge[] => {
  return AVAILABLE_BADGES;
};

export const assignBadgeToUser = async (userId: string, badgeId: string, assignedBy: string) => {
  try {
    console.log('Asignando badge:', { userId, badgeId, assignedBy });
    const existingBadge = await getUserBadge(userId, badgeId);
    if (existingBadge) {
      console.log('El usuario ya tiene este badge');
      throw new Error('El usuario ya tiene este badge');
    }

    console.log('Creando nuevo badge...');
    await addDoc(collection(db, 'userBadges'), {
      userId,
      badgeId,
      assignedBy,
      assignedAt: new Date()
    });
    console.log('Badge asignado exitosamente');
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
    console.log('getUserBadges llamada para userId:', userId);
    const q = query(collection(db, 'userBadges'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    console.log('Documentos encontrados en getUserBadges:', querySnapshot.size);
    
    const userBadges = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Documento badge:', doc.id, data);
      return {
        badgeId: data.badgeId,
        userId: data.userId,
        assignedAt: data.assignedAt,
        assignedBy: data.assignedBy
      } as UserBadge;
    });

    const result = userBadges.map(userBadge => {
      const badge = AVAILABLE_BADGES.find(b => b.id === userBadge.badgeId);
      console.log(`Buscando badge ${userBadge.badgeId} en AVAILABLE_BADGES:`, badge ? 'ENCONTRADO' : 'NO ENCONTRADO');
      if (!badge) {
        console.log('Badge no encontrado en AVAILABLE_BADGES:', userBadge.badgeId);
        console.log('AVAILABLE_BADGES:', AVAILABLE_BADGES.map(b => b.id));
      }
      return {
        ...userBadge,
        badge: badge!
      };
    }).filter(item => {
      const hasValidBadge = !!item.badge;
      console.log(`Filtro para item con badgeId ${item.badgeId}: ${hasValidBadge ? 'INCLUIDO' : 'EXCLUIDO'}`);
      return hasValidBadge;
    });
    
    console.log('getUserBadges resultado final:', result);
    return result;
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
};

export const removeBadgeFromUser = async (userId: string, badgeId: string) => {
  try {
    console.log('Removiendo badge:', { userId, badgeId });
    const q = query(
      collection(db, 'userBadges'),
      where('userId', '==', userId),
      where('badgeId', '==', badgeId)
    );
    const querySnapshot = await getDocs(q);
    
    console.log('Documentos encontrados para eliminar:', querySnapshot.size);
    
    if (!querySnapshot.empty) {
      console.log('Eliminando documento:', querySnapshot.docs[0].id);
      await deleteDoc(querySnapshot.docs[0].ref);
      console.log('Badge eliminado exitosamente');
    } else {
      console.log('No se encontró el badge para eliminar');
    }
  } catch (error) {
    console.error('Error removing badge:', error);
    throw error;
  }
};

export const forceRemoveAllBadges = async (userId: string, userEmail: string) => {
  console.log('forceRemoveAllBadges llamada con:', { userId, userEmail });
  
  if (userEmail !== 'dogitomb2022@gmail.com') {
    throw new Error('No tienes permisos para usar esta función');
  }

  try {
    console.log('Buscando badges del usuario...');
    const q = query(collection(db, 'userBadges'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    console.log('Badges encontrados:', querySnapshot.size);
    
    if (querySnapshot.empty) {
      console.log('No hay badges para eliminar');
      return;
    }
    
    const deletePromises = querySnapshot.docs.map(doc => {
      console.log('Eliminando badge:', doc.id, doc.data());
      return deleteDoc(doc.ref);
    });
    
    await Promise.all(deletePromises);
    console.log('Todos los badges eliminados exitosamente');
  } catch (error) {
    console.error('Error removing all badges:', error);
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

export const assignSelfBadge = async (userId: string, badgeId: string, userEmail: string) => {
  if (userEmail !== 'dogitomb2022@gmail.com') {
    throw new Error('No tienes permisos para usar esta función');
  }

  try {
    const existingBadge = await getUserBadge(userId, badgeId);
    if (existingBadge) {
      throw new Error('Ya tienes este badge');
    }

    await addDoc(collection(db, 'userBadges'), {
      userId,
      badgeId,
      assignedBy: 'self',
      assignedAt: new Date()
    });
  } catch (error) {
    console.error('Error assigning self badge:', error);
    throw error;
  }
};

export const removeSelfBadge = async (userId: string, badgeId: string, userEmail: string) => {
  if (userEmail !== 'dogitomb2022@gmail.com') {
    throw new Error('No tienes permisos para usar esta función');
  }

  try {
    await removeBadgeFromUser(userId, badgeId);
  } catch (error) {
    console.error('Error removing self badge:', error);
    throw error;
  }
};