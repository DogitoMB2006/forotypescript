
import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface VoiceChannel {
  id: string;
  chatId: string;
  createdAt: any;
  isActive: boolean;
  memberCount?: number;
}

export interface VoiceChannelMember {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  profileImage?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: any;
}

export const findActiveChannelForChat = async (chatId: string): Promise<VoiceChannel | null> => {
  try {
    const channelsQuery = query(
      collection(db, 'voiceChannels'),
      where('chatId', '==', chatId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(channelsQuery);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as VoiceChannel;
    }

    return null;
  } catch (error) {
    console.error('Error finding active channel:', error);
    return null;
  }
};

export const createVoiceChannel = async (chatId: string): Promise<string> => {
  try {
    const channelDoc = await addDoc(collection(db, 'voiceChannels'), {
      chatId,
      createdAt: serverTimestamp(),
      isActive: true
    });

    return channelDoc.id;
  } catch (error) {
    console.error('Error creating voice channel:', error);
    throw error;
  }
};

export const joinVoiceChannel = async (
  channelId: string, 
  userId: string, 
  userInfo: {
    username: string;
    displayName: string;
    profileImage?: string;
  }
): Promise<string> => {
  try {
    const memberDoc = await addDoc(collection(db, 'voiceChannels', channelId, 'members'), {
      userId,
      username: userInfo.username,
      displayName: userInfo.displayName,
      profileImage: userInfo.profileImage || null,
      isMuted: false,
      isSpeaking: false,
      joinedAt: serverTimestamp()
    });

    return memberDoc.id;
  } catch (error) {
    console.error('Error joining voice channel:', error);
    throw error;
  }
};

export const leaveVoiceChannel = async (channelId: string, memberDocId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'voiceChannels', channelId, 'members', memberDocId));

    const membersSnapshot = await getDocs(collection(db, 'voiceChannels', channelId, 'members'));
    
    if (membersSnapshot.empty) {
      await updateDoc(doc(db, 'voiceChannels', channelId), {
        isActive: false
      });
    }
  } catch (error) {
    console.error('Error leaving voice channel:', error);
    throw error;
  }
};

export const updateMemberStatus = async (
  channelId: string, 
  memberDocId: string, 
  updates: Partial<Pick<VoiceChannelMember, 'isMuted' | 'isSpeaking'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'voiceChannels', channelId, 'members', memberDocId), updates);
  } catch (error) {
    console.error('Error updating member status:', error);
    throw error;
  }
};

export const listenToChannelMembers = (
  channelId: string,
  currentUserId: string,
  onMembersChange: (members: VoiceChannelMember[]) => void
) => {
  const membersQuery = query(
    collection(db, 'voiceChannels', channelId, 'members'),
    where('userId', '!=', currentUserId)
  );

  return onSnapshot(membersQuery, (snapshot) => {
    const members: VoiceChannelMember[] = [];
    
    snapshot.forEach((doc) => {
      members.push({
        id: doc.id,
        ...doc.data()
      } as VoiceChannelMember);
    });

    onMembersChange(members);
  });
};

export const addSignalingData = async (
  channelId: string,
  type: 'offer' | 'answer' | 'candidate',
  data: any,
  fromUserId: string,
  toUserId: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'voiceChannels', channelId, 'signaling'), {
      type,
      data,
      fromUserId,
      toUserId,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding signaling data:', error);
    throw error;
  }
};

export const listenToSignalingData = (
  channelId: string,
  userId: string,
  onSignalingData: (data: any) => void
) => {
  const signalingQuery = query(
    collection(db, 'voiceChannels', channelId, 'signaling'),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(signalingQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        onSignalingData({
          id: change.doc.id,
          ...change.doc.data()
        });
      }
    });
  });
};