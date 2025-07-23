import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [canModerate, setCanModerate] = useState(false);

  useEffect(() => {
    console.log('useAuth: Setting up auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('useAuth: Auth state changed', { user: firebaseUser?.uid });
      
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
        
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            console.log('useAuth: User profile loaded');
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            console.log('useAuth: No user profile found');
            setUserProfile(null);
          }

     
          try {
            const role = await getUserHighestRole(firebaseUser.uid);
            setUserRole(role);
            
           
            const adminStatus = isUserAdmin(firebaseUser.email || '');
            const moderateStatus = await canUserModerate(firebaseUser.uid, firebaseUser.email || '');
            setIsAdmin(adminStatus);
            setCanModerate(moderateStatus);
          } catch (roleError) {
            console.error('Error loading user role:', roleError);
            setUserRole(null);
            setIsAdmin(false);
            setCanModerate(false);
          }

        } else {
          console.log('useAuth: No user, clearing state');
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
          setIsAdmin(false);
          setCanModerate(false);
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
      setIsAdmin(false);
      setCanModerate(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isAuthenticated = !!user;

  const hasPermission = (action: string, resource: string): boolean => {
    if (!userRole) return false;
    
    return userRole.permissions.some(
      permission => permission.action === action && permission.resource === resource
    );
  };

  return {
    user,
    userProfile,
    userRole,
    loading,
    logout,
    isAuthenticated,
    isAdmin,
    canModerate,
    hasPermission
  };
};