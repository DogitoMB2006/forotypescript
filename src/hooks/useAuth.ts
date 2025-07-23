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
    console.log('useAuth: Setting up auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('useAuth: Auth state changed', { user: firebaseUser?.uid });
      
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Cargar perfil de usuario
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            console.log('useAuth: User profile loaded');
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            console.log('useAuth: No user profile found');
            setUserProfile(null);
          }

          // Cargar rol de usuario (simplificado)
          try {
            const role = await getUserHighestRole(firebaseUser.uid);
            setUserRole(role);
          } catch (roleError) {
            console.error('Error loading user role:', roleError);
            setUserRole(null);
          }

        } else {
          console.log('useAuth: No user, clearing state');
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        console.log('useAuth: Setting loading to false');
        setLoading(false);
      }
    });

    return () => {
      console.log('useAuth: Cleaning up auth listener');
      unsubscribe();
    };
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

  const hasPermission = (action: string, resource: string): boolean => {
    if (!user) return false;
    if (user.email === 'dogitomb2022@gmail.com') return true;
    if (!userRole) return false;
    
    return userRole.permissions.some(
      permission => permission.action === action && permission.resource === resource
    );
  };

  const [canModerateSync, setCanModerateSync] = useState(false);
  
  useEffect(() => {
    if (user && !loading) {
      canUserModerate(user.uid, user.email || '').then(setCanModerateSync).catch(() => setCanModerateSync(false));
    } else {
      setCanModerateSync(false);
    }
  }, [user, userRole, loading]);

  console.log('useAuth: Current state', { 
    hasUser: !!user, 
    hasProfile: !!userProfile, 
    loading, 
    isAuthenticated: !!user 
  });

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