// src/components/call/VoiceCall.tsx
import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

interface VoiceCallProps {
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    profileImage?: string;
  };
  chatId: string;
  onCallEnd: () => void;
  isIncoming?: boolean;
  callId?: string;
}

interface CallData {
  id: string;
  callerId: string;
  receiverId: string;
  chatId: string;
  status: 'ringing' | 'accepted' | 'declined' | 'ended';
  offer?: any;
  answer?: any;
  candidates: any[];
  createdAt: any;
}

const VoiceCall = ({ 
  otherUser, 
  chatId, 
  onCallEnd, 
  isIncoming = false,
  callId: initialCallId 
}: VoiceCallProps) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState<string | null>(initialCallId || null);
  
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callDocRef = useRef<any>(null);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!user?.uid) return;

    console.log('VoiceCall: Initializing', { isIncoming, initialCallId, otherUser: otherUser.displayName });

    if (isIncoming && initialCallId) {
      setCallStatus('ringing');
      setCallId(initialCallId);
      initializeIncomingCall(initialCallId);
    } else {
      initializeOutgoingCall();
    }

    return () => {
      console.log('VoiceCall: Cleanup');
      cleanup();
    };
  }, [user?.uid, isIncoming, initialCallId]);

  useEffect(() => {
    if (callStatus === 'connected') {
      startCallTimer();
      initializeAudio();
    } else {
      stopCallTimer();
    }

    return () => stopCallTimer();
  }, [callStatus]);

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeOutgoingCall = async () => {
    try {
      console.log('VoiceCall: Starting outgoing call to', otherUser.displayName);
      setCallStatus('connecting');
      
      const callDoc = await addDoc(collection(db, 'calls'), {
        callerId: user!.uid,
        receiverId: otherUser.id,
        chatId,
        status: 'ringing',
        type: 'voice',
        candidates: [],
        createdAt: serverTimestamp()
      });

      console.log('VoiceCall: Call document created:', callDoc.id);
      setCallId(callDoc.id);
      callDocRef.current = callDoc;
      setCallStatus('ringing');

      onSnapshot(doc(db, 'calls', callDoc.id), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CallData;
          console.log('VoiceCall: Outgoing call status update:', data.status);
          
          if (data.status === 'accepted') {
            console.log('VoiceCall: Call accepted by receiver!');
            setCallStatus('connected');
          } else if (data.status === 'declined' || data.status === 'ended') {
            console.log('VoiceCall: Call declined or ended');
            endCall();
          }
        }
      });

    } catch (error) {
      console.error('Error initializing outgoing call:', error);
      onCallEnd();
    }
  };

  const initializeIncomingCall = async (incomingCallId: string) => {
    try {
      console.log('VoiceCall: Initializing incoming call', incomingCallId);
      setCallId(incomingCallId);
      callDocRef.current = doc(db, 'calls', incomingCallId);

      onSnapshot(doc(db, 'calls', incomingCallId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CallData;
          console.log('VoiceCall: Incoming call status update:', data.status);
          
          if (data.status === 'ended') {
            console.log('VoiceCall: Call ended by caller');
            endCall();
          } else if (data.status === 'accepted') {
            console.log('VoiceCall: Call already accepted, staying connected');
            setCallStatus('connected');
          }
        }
      });

    } catch (error) {
      console.error('Error initializing incoming call:', error);
      onCallEnd();
    }
  };

  const initializeAudio = async () => {
    if (!callId) return;
    
    try {
      console.log('VoiceCall: Initializing WebRTC audio for call:', callId);
      
      peerConnectionRef.current = new RTCPeerConnection(servers);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      stream.getTracks().forEach(track => {
        peerConnectionRef.current!.addTrack(track, stream);
      });

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
      }

      peerConnectionRef.current.ontrack = (event) => {
        console.log('VoiceCall: Received remote audio stream');
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      if (isIncoming) {
        await handleIncomingWebRTC();
      } else {
        await handleOutgoingWebRTC();
      }

      console.log('VoiceCall: WebRTC initialized successfully');
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
    }
  };

  const handleOutgoingWebRTC = async () => {
    if (!peerConnectionRef.current || !callId) return;

    console.log('VoiceCall: Setting up outgoing WebRTC connection');
    
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    await updateDoc(doc(db, 'calls', callId), {
      offer: {
        type: offer.type,
        sdp: offer.sdp
      }
    });

    onSnapshot(doc(db, 'calls', callId), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.answer && peerConnectionRef.current) {
          console.log('VoiceCall: Received answer, setting remote description');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      }
    });
  };

  const handleIncomingWebRTC = async () => {
    if (!peerConnectionRef.current || !callId) return;

    console.log('VoiceCall: Setting up incoming WebRTC connection');

    const callDoc = await getDoc(doc(db, 'calls', callId));
    if (callDoc.exists()) {
      const data = callDoc.data();
      if (data.offer) {
        console.log('VoiceCall: Setting remote description with offer');
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        await updateDoc(doc(db, 'calls', callId), {
          answer: {
            type: answer.type,
            sdp: answer.sdp
          }
        });

        console.log('VoiceCall: Answer sent to caller');
      }
    }
  };

  const acceptCall = async () => {
    if (!callId || !user?.uid) return;

    try {
      console.log('VoiceCall: User accepting call', callId);
      setCallStatus('connecting');
      
      await updateDoc(doc(db, 'calls', callId), {
        status: 'accepted'
      });
      
      console.log('VoiceCall: Call status updated to accepted');
      setCallStatus('connected');
      
    } catch (error) {
      console.error('Error accepting call:', error);
      declineCall();
    }
  };

  const declineCall = async () => {
    if (!callId) return;

    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'declined'
      });
    } catch (error) {
      console.error('Error declining call:', error);
    }
    
    onCallEnd();
  };

  const endCall = async () => {
    if (callId) {
      try {
        await updateDoc(doc(db, 'calls', callId), {
          status: 'ended'
        });
        
        setTimeout(async () => {
          try {
            await deleteDoc(doc(db, 'calls', callId));
          } catch (error) {
            console.error('Error deleting call doc:', error);
          }
        }, 5000);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    
    cleanup();
    onCallEnd();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
        console.log('VoiceCall: Mute toggled:', !isMuted);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    console.log('VoiceCall: Speaker toggled:', !isSpeakerOn);
    
    if (remoteAudioRef.current) {
      if (!isSpeakerOn) {
        remoteAudioRef.current.volume = 1;
      } else {
        remoteAudioRef.current.volume = 0.7;
      }
    }
  };

  const cleanup = () => {
    stopCallTimer();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    localStreamRef.current = null;
    peerConnectionRef.current = null;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return isIncoming ? 'Conectando...' : 'Conectando...';
      case 'ringing':
        return isIncoming ? 'Llamada entrante' : 'Llamando...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Llamada terminada';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-8 text-center">
          <div className="relative mb-6">
            <Avatar
              src={otherUser.profileImage}
              alt={otherUser.displayName}
              name={otherUser.displayName}
              size="xl"
              className="mx-auto"
            />
            {(callStatus === 'ringing' || callStatus === 'connecting') && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-pulse"></div>
            )}
            {callStatus === 'connected' && (
              <div className="absolute inset-0 rounded-full border-4 border-green-500"></div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {otherUser.displayName}
          </h2>
          
          <p className="text-gray-400 mb-8">
            {getStatusText()}
          </p>

          {callStatus === 'ringing' && isIncoming && (
            <div className="flex justify-center space-x-6 mb-6">
              <button
                onClick={declineCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={acceptCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
              >
                <Phone className="w-8 h-8 text-white" />
              </button>
            </div>
          )}

          {(callStatus === 'connected' || callStatus === 'connecting' || (callStatus === 'ringing' && !isIncoming)) && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>

              <button
                onClick={toggleSpeaker}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isSpeakerOn 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isSpeakerOn ? (
                  <Volume2 className="w-6 h-6 text-white" />
                ) : (
                  <VolumeX className="w-6 h-6 text-white" />
                )}
              </button>

              <button
                onClick={endCall}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
};

export default VoiceCall;