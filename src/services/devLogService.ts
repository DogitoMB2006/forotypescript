import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  //updateDoc, 
  //arrayUnion,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface DevLog {
  id: string;
  title: string;
  content: string;
  images: string[];
  authorId: string;
  createdAt: Date;
}

export interface UserDevLogStatus {
  userId: string;
  lastSeenDevLogId: string;
  lastSeenAt: Date;
}

export const createDevLog = async (devLogData: Omit<DevLog, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'devLogs'), {
      ...devLogData,
      createdAt: devLogData.createdAt || new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating dev log:', error);
    throw error;
  }
};

export const getLatestDevLog = async (): Promise<DevLog | null> => {
  try {
    const q = query(
      collection(db, 'devLogs'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    } as DevLog;
  } catch (error) {
    console.error('Error getting latest dev log:', error);
    throw error;
  }
};

export const getUserDevLogStatus = async (userId: string): Promise<UserDevLogStatus | null> => {
  try {
    const docRef = doc(db, 'userDevLogStatus', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        userId,
        ...docSnap.data(),
        lastSeenAt: docSnap.data().lastSeenAt?.toDate() || new Date()
      } as UserDevLogStatus;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user dev log status:', error);
    throw error;
  }
};

export const updateUserDevLogStatus = async (userId: string, devLogId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'userDevLogStatus', userId);
    await setDoc(docRef, {
      lastSeenDevLogId: devLogId,
      lastSeenAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user dev log status:', error);
    throw error;
  }
};

export const checkForNewDevLog = async (userId: string): Promise<DevLog | null> => {
  try {
    const latestDevLog = await getLatestDevLog();
    if (!latestDevLog) return null;
    
    const userStatus = await getUserDevLogStatus(userId);
    
    if (!userStatus || userStatus.lastSeenDevLogId !== latestDevLog.id) {
      return latestDevLog;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for new dev log:', error);
    throw error;
  }
};