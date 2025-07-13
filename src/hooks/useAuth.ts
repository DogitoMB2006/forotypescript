import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getUserHighestRole, canUserModerate, isUserAdmin } from '../services/roleService';
import type { Role } from '../types/roles';

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  defaultBadgeId?: string;
}

interface AuthData {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: Role | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canModerate: boolean;
  hasPermission: (action: string, resource: string) => boolean;
}

export const useAuth = (): AuthData => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }

          const role = await getUserHighestRole(user.uid);
          setUserRole(role);

          const rolesQuery = query(
            collection(db, 'userRoles'),
            where('userId', '==', user.uid)
          );

          const unsubscribeRoles = onSnapshot(rolesQuery, async () => {
            try {
              const updatedRole = await getUserHighestRole(user.uid);
              setUserRole(updatedRole);
            } catch (error) {
              console.error('Error updating user role:', error);
            }
          });

          return () => unsubscribeRoles();
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isAdmin = user ? isUserAdmin(user.email || '') : false;

  const canModerate = user ? 
    (async () => {
      try {
        return await canUserModerate(user.uid, user.email || '');
      } catch (error) {
        console.error('Error checking moderation permissions:', error);
        return false;
      }
    })() : 
    Promise.resolve(false);

  const hasPermission = (action: string, resource: string): boolean => {
    if (!userRole) return false;
    if (isAdmin) return true;
    
    return userRole.permissions.some(
      permission => permission.action === action && permission.resource === resource
    );
  };

  const [canModerateSync, setCanModerateSync] = useState(false);
  
  useEffect(() => {
    if (user) {
      canUserModerate(user.uid, user.email || '').then(setCanModerateSync);
    } else {
      setCanModerateSync(false);
    }
  }, [user, userRole]);

  return {
    user,
    userProfile,
    userRole,
    loading,
    logout,
    isAuthenticated: !!user,
    isAdmin,
    canModerate: canModerateSync,
    hasPermission
  };
};