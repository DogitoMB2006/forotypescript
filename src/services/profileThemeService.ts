import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { CustomProfileTheme } from '../types/profileTheme';

export const updateUserCustomTheme = async (userId: string, theme: CustomProfileTheme) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      customTheme: theme,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user custom theme:', error);
    throw error;
  }
};

export const getUserCustomTheme = async (userId: string): Promise<CustomProfileTheme> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.customTheme || { primaryColor: '#3B82F6', accentColor: '#60A5FA' };
    }
    
    return { primaryColor: '#3B82F6', accentColor: '#60A5FA' };
  } catch (error) {
    console.error('Error getting user custom theme:', error);
    return { primaryColor: '#3B82F6', accentColor: '#60A5FA' };
  }
};