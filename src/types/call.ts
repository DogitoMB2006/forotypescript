// src/types/call.ts
export interface CallData {
  id: string;
  callerId: string;
  receiverId: string;
  chatId: string;
  status: 'ringing' | 'accepted' | 'declined' | 'ended';
  type: 'voice' | 'video';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidates: RTCIceCandidateInit[];
  createdAt: any;
}

export interface CallerInfo {
  uid: string;
  displayName: string;
  username: string;
  profileImageUrl?: string;
}

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

export interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export interface SignalingData {
  id: string;
  type: 'offer' | 'answer' | 'candidate';
  data: any;
  fromUserId: string;
  toUserId: string;
  createdAt: any;
}