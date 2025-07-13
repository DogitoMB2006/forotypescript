import { collection, addDoc, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { assignBadgeToUser, removeBadgeFromUser } from './badgeService';
import type { Role, UserRole, UserRoleWithDetails, ROLES } from '../types/roles';
import { ROLES as AVAILABLE_ROLES } from '../types/roles';

const roleCache = new Map<string, { role: Role | null; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

const invalidateUserRoleCache = (userId: string) => {
  roleCache.delete(userId);
};

export const getAvailableRoles = (): Role[] => {
  return AVAILABLE_ROLES;
};

export const assignRoleToUser = async (userId: string, roleId: string, assignedBy: string) => {
  try {
    const existingRole = await getUserRole(userId, roleId);
    if (existingRole) {
      throw new Error('El usuario ya tiene este rol');
    }

    const currentRoles = await getUserRoles(userId);
    for (const userRole of currentRoles) {
      if (userRole.roleId !== 'admin') {
        await removeRoleFromUser(userId, userRole.roleId);
      }
    }

    await addDoc(collection(db, 'userRoles'), {
      userId,
      roleId,
      assignedBy,
      assignedAt: new Date()
    });

    const role = AVAILABLE_ROLES.find(r => r.id === roleId);
    if (role?.badgeId) {
      try {
        await assignBadgeToUser(userId, role.badgeId, assignedBy);
      } catch (error) {
        console.error('Error assigning badge for role:', error);
      }
    }

    invalidateUserRoleCache(userId);
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
};

export const removeRoleFromUser = async (userId: string, roleId: string) => {
  try {
    const q = query(
      collection(db, 'userRoles'),
      where('userId', '==', userId),
      where('roleId', '==', roleId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      await deleteDoc(querySnapshot.docs[0].ref);
    }

    const role = AVAILABLE_ROLES.find(r => r.id === roleId);
    if (role?.badgeId) {
      try {
        await removeBadgeFromUser(userId, role.badgeId);
      } catch (error) {
        console.error('Error removing badge for role:', error);
      }
    }

    invalidateUserRoleCache(userId);
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
};

export const getUserRole = async (userId: string, roleId: string): Promise<UserRole | null> => {
  try {
    const q = query(
      collection(db, 'userRoles'),
      where('userId', '==', userId),
      where('roleId', '==', roleId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return {
        userId: docData.userId,
        roleId: docData.roleId,
        assignedBy: docData.assignedBy,
        assignedAt: docData.assignedAt
      } as UserRole;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const getUserRoles = async (userId: string): Promise<UserRoleWithDetails[]> => {
  try {
    const q = query(collection(db, 'userRoles'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const userRoles = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: data.userId,
        roleId: data.roleId,
        assignedBy: data.assignedBy,
        assignedAt: data.assignedAt
      } as UserRole;
    });

    return userRoles.map(userRole => {
      const role = AVAILABLE_ROLES.find(r => r.id === userRole.roleId);
      return {
        ...userRole,
        role: role!
      };
    }).filter(item => item.role);
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
};

export const getUserHighestRole = async (userId: string): Promise<Role | null> => {
  try {
    const cached = roleCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.role;
    }

    const userRoles = await getUserRoles(userId);
    let highestRole: Role | null = null;

    if (userRoles.length === 0) {
      highestRole = AVAILABLE_ROLES.find(r => r.id === 'member') || null;
    } else {
      const sortedRoles = userRoles.sort((a, b) => a.role.priority - b.role.priority);
      highestRole = sortedRoles[0].role;
    }

    roleCache.set(userId, { role: highestRole, timestamp: Date.now() });
    return highestRole;
  } catch (error) {
    console.error('Error getting user highest role:', error);
    return AVAILABLE_ROLES.find(r => r.id === 'member') || null;
  }
};

export const userHasPermission = async (userId: string, action: string, resource: string): Promise<boolean> => {
  try {
    const highestRole = await getUserHighestRole(userId);
    if (!highestRole) return false;

    return highestRole.permissions.some(
      permission => permission.action === action && permission.resource === resource
    );
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
};

export const isUserAdmin = (userEmail: string): boolean => {
  return userEmail === 'dogitomb2022@gmail.com';
};

export const canUserModerate = async (userId: string, userEmail: string): Promise<boolean> => {
  if (isUserAdmin(userEmail)) return true;
  
  try {
    const hasModeratePermission = await userHasPermission(userId, 'moderate', 'content');
    return hasModeratePermission;
  } catch (error) {
    console.error('Error checking moderation permissions:', error);
    return false;
  }
};