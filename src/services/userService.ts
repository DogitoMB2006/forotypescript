import { doc, updateDoc, getDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  try {
    const imageRef = ref(storage, `profiles/${userId}/profile-image`);
    const snapshot = await uploadBytes(imageRef, file);
    return getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

export const uploadBannerImage = async (userId: string, file: File): Promise<string> => {
  try {
    const imageRef = ref(storage, `profiles/${userId}/banner-image`);
    const snapshot = await uploadBytes(imageRef, file);
    return getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading banner image:', error);
    throw error;
  }
};

export const deleteProfileImage = async (userId: string) => {
  try {
    const imageRef = ref(storage, `profiles/${userId}/profile-image`);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting profile image:', error);
  }
};

export const deleteBannerImage = async (userId: string) => {
  try {
    const imageRef = ref(storage, `profiles/${userId}/banner-image`);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting banner image:', error);
  }
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};