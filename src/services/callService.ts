
import { collection, doc, onSnapshot, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface CallData {
  id: string;
  callerId: string;
  receiverId: string;
  chatId: string;
  status: 'ringing' | 'accepted' | 'declined' | 'ended';
  type: 'voice' | 'video';
  offer?: any;
  answer?: any;
  candidates: any[];
  createdAt: any;
}

export interface CallerInfo {
  uid: string;
  displayName: string;
  username: string;
  profileImageUrl?: string;
}

export const listenForIncomingCalls = (
  userId: string,
  onIncomingCall: (callData: CallData, callerInfo: CallerInfo) => void
) => {
  const callsQuery = query(
    collection(db, 'calls'),
    where('receiverId', '==', userId),
    where('status', '==', 'ringing'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  return onSnapshot(callsQuery, async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added') {
        const callData = { id: change.doc.id, ...change.doc.data() } as CallData;
        
        try {
          const callerDoc = await getDoc(doc(db, 'users', callData.callerId));
          if (callerDoc.exists()) {
            const callerInfo = callerDoc.data() as CallerInfo;
            onIncomingCall(callData, callerInfo);
          }
        } catch (error) {
          console.error('Error fetching caller info:', error);
        }
      }
    }
  });
};

export const getCallData = async (callId: string): Promise<CallData | null> => {
  try {
    const callDoc = await getDoc(doc(db, 'calls', callId));
    if (callDoc.exists()) {
      return { id: callDoc.id, ...callDoc.data() } as CallData;
    }
    return null;
  } catch (error) {
    console.error('Error getting call data:', error);
    return null;
  }
};