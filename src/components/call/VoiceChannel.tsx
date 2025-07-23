
import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

interface VoiceChannelProps {
  chatId: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    profileImage?: string;
  };
  onLeave: () => void;
}

interface ChannelMember {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  profileImage?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: any;
}

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

const VoiceChannel: FC<VoiceChannelProps> = ({ chatId, onLeave }) => {
  const { user, userProfile } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const memberDocRef = useRef<any>(null);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!user?.uid) return;

    joinChannel();

    return () => {
      leaveChannel();
    };
  }, [user?.uid, chatId]);

  useEffect(() => {
    if (!channelId) return;

    const membersQuery = query(
      collection(db, 'voiceChannels', channelId, 'members'),
      where('userId', '!=', user!.uid)
    );

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const currentMembers: ChannelMember[] = [];
      
      snapshot.forEach((doc) => {
        const memberData = doc.data() as Omit<ChannelMember, 'id'>;
        currentMembers.push({
          id: doc.id,
          ...memberData
        });
      });

      setMembers(currentMembers);

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const memberData = change.doc.data() as Omit<ChannelMember, 'id'>;
          if (memberData.userId !== user!.uid) {
            setupPeerConnection(memberData.userId);
          }
        } else if (change.type === 'removed') {
          const memberData = change.doc.data() as Omit<ChannelMember, 'id'>;
          removePeerConnection(memberData.userId);
        }
      });
    });

    return unsubscribe;
  }, [channelId, user?.uid]);

  const joinChannel = async () => {
    try {
      setConnectionStatus('connecting');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      localStreamRef.current = stream;

      const channelDoc = await addDoc(collection(db, 'voiceChannels'), {
        chatId,
        createdAt: serverTimestamp(),
        isActive: true
      });

      setChannelId(channelDoc.id);

      const memberDoc = await addDoc(collection(db, 'voiceChannels', channelDoc.id, 'members'), {
        userId: user!.uid,
        username: userProfile?.username || 'Usuario',
        displayName: userProfile?.displayName || 'Usuario',
        profileImage: userProfile?.profileImageUrl || null,
        isMuted: false,
        isSpeaking: false,
        joinedAt: serverTimestamp()
      });

      memberDocRef.current = memberDoc;
      setConnectionStatus('connected');

    } catch (error) {
      console.error('Error joining voice channel:', error);
      setConnectionStatus('disconnected');
      onLeave();
    }
  };

  const leaveChannel = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    peerConnectionsRef.current.forEach((peer) => {
      peer.connection.close();
    });
    peerConnectionsRef.current.clear();

    audioElementsRef.current.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
    });
    audioElementsRef.current.clear();

    if (memberDocRef.current) {
      try {
        await deleteDoc(memberDocRef.current);
      } catch (error) {
        console.error('Error removing member from channel:', error);
      }
    }

    if (channelId && members.length === 0) {
      try {
        await updateDoc(doc(db, 'voiceChannels', channelId), {
          isActive: false
        });
      } catch (error) {
        console.error('Error deactivating channel:', error);
      }
    }

    setConnectionStatus('disconnected');
  };

  const setupPeerConnection = async (userId: string) => {
    if (!localStreamRef.current || peerConnectionsRef.current.has(userId)) return;

    const peerConnection = new RTCPeerConnection(servers);
    
    localStreamRef.current.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStreamRef.current!);
    });

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        const audioElement = new Audio();
        audioElement.srcObject = remoteStream;
        audioElement.autoplay = true;
        audioElement.volume = isDeafened ? 0 : 0.8;
        audioElementsRef.current.set(userId, audioElement);
      }
    };

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate && channelId) {
        await addDoc(collection(db, 'voiceChannels', channelId, 'candidates'), {
          candidate: event.candidate.toJSON(),
          fromUserId: user!.uid,
          toUserId: userId,
          createdAt: serverTimestamp()
        });
      }
    };

    peerConnectionsRef.current.set(userId, {
      userId,
      connection: peerConnection
    });

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (channelId) {
        await addDoc(collection(db, 'voiceChannels', channelId, 'offers'), {
          offer: {
            type: offer.type,
            sdp: offer.sdp
          },
          fromUserId: user!.uid,
          toUserId: userId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const removePeerConnection = (userId: string) => {
    const peer = peerConnectionsRef.current.get(userId);
    if (peer) {
      peer.connection.close();
      peerConnectionsRef.current.delete(userId);
    }

    const audioElement = audioElementsRef.current.get(userId);
    if (audioElement) {
      audioElement.pause();
      audioElement.srcObject = null;
      audioElementsRef.current.delete(userId);
    }
  };

  const toggleMute = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);

        if (memberDocRef.current) {
          try {
            await updateDoc(memberDocRef.current, {
              isMuted: !isMuted
            });
          } catch (error) {
            console.error('Error updating mute status:', error);
          }
        }
      }
    }
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
    
    audioElementsRef.current.forEach((audio) => {
      audio.volume = !isDeafened ? 0 : 0.8;
    });

    if (!isDeafened && !isMuted) {
      toggleMute();
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Conectando al canal...';
      case 'connected':
        return `Canal de voz • ${members.length + 1} miembro${members.length === 0 ? '' : 's'}`;
      case 'disconnected':
        return 'Desconectado';
      default:
        return '';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 min-w-80 max-w-md z-40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <h3 className="text-white font-medium">Canal de Voz</h3>
        </div>
        <button
          onClick={onLeave}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        {getConnectionStatusText()}
      </p>

      <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
        <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/50">
          <Avatar
            src={userProfile?.profileImageUrl}
            alt={userProfile?.displayName || 'Tú'}
            name={userProfile?.displayName || 'Tú'}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {userProfile?.displayName || 'Tú'} (tú)
            </p>
          </div>
          <div className="flex items-center space-x-1">
            {isMuted && <MicOff className="w-4 h-4 text-red-400" />}
            {isDeafened && <VolumeX className="w-4 h-4 text-red-400" />}
          </div>
        </div>

        {members.map((member) => (
          <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/30">
            <Avatar
              src={member.profileImage}
              alt={member.displayName}
              name={member.displayName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {member.displayName}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {member.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
              {member.isSpeaking && (
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-3">
        <button
          onClick={toggleMute}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isMuted 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
        >
          {isMuted ? (
            <MicOff className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>

        <button
          onClick={toggleDeafen}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDeafened 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isDeafened ? 'Activar audio' : 'Silenciar audio'}
        >
          {isDeafened ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>

        <button
          onClick={onLeave}
          className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
          title="Salir del canal"
        >
          <PhoneOff className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default VoiceChannel;