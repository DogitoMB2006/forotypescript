import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { useCall } from '../../contexts/CallContext';
import Avatar from '../ui/Avatar';
import MicrophoneSelector from './MicrophoneSelector';

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
  const { endCall: resetCallContext } = useCall();
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState<string | null>(initialCallId || null);
  const [currentMicId, setCurrentMicId] = useState<string>('');
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string>('');
  
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const callDocRef = useRef<any>(null);
  const candidateQueueRef = useRef<RTCIceCandidate[]>([]);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.stunprotocol.org:3478' },
      { urls: 'stun:stun.services.mozilla.com' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
    iceTransportPolicy: 'all' as RTCIceTransportPolicy
  };

  useEffect(() => {
    console.log('VoiceCall: Component mounted', { isIncoming, callId: initialCallId });
    
    if (isIncoming && initialCallId) {
      initializeIncomingCall(initialCallId);
    } else if (!isIncoming) {
      initializeOutgoingCall();
    }

    return () => {
      console.log('VoiceCall: Component unmounting');
      cleanup();
    };
  }, []);

  const initializeOutgoingCall = async () => {
    try {
      console.log('VoiceCall: Starting outgoing call');
      setCallStatus('connecting');
      
      await initializeWebRTC();
      
      const callDoc = await addDoc(collection(db, 'calls'), {
        callerId: user!.uid,
        receiverId: otherUser.id,
        chatId: chatId,
        status: 'ringing',
        createdAt: serverTimestamp()
      });

      const newCallId = callDoc.id;
      setCallId(newCallId);
      callDocRef.current = callDoc;
      
      console.log('VoiceCall: Call document created:', newCallId);
      setCallStatus('ringing');
      
      await handleOutgoingWebRTC(newCallId);

      onSnapshot(doc(db, 'calls', newCallId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CallData;
          console.log('VoiceCall: Call status update:', data.status);
          
          if (data.status === 'accepted') {
            console.log('VoiceCall: Call accepted!');
            setCallStatus('connected');
            startCallTimer();
            startHeartbeat();
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
      setCallStatus('ringing');
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
            startCallTimer();
            startHeartbeat();
          }
        }
      });

    } catch (error) {
      console.error('Error initializing incoming call:', error);
      onCallEnd();
    }
  };

  const initializeWebRTC = async () => {
    try {
      console.log('VoiceCall: Initializing WebRTC');
      
      peerConnectionRef.current = new RTCPeerConnection(servers);
      
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
          latency: 0.02,
          deviceId: currentMicId || 'default'
        }, 
        video: false 
      };

      console.log('VoiceCall: Requesting user media');
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      localStreamRef.current = stream;

      console.log('VoiceCall: Adding local stream tracks to peer connection');
      stream.getTracks().forEach(track => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(track, stream);
          console.log('VoiceCall: Added track:', track.kind);
        }
      });

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
      }

      peerConnectionRef.current.ontrack = (event) => {
        console.log('VoiceCall: Received remote track:', event.track.kind);
        const [remoteStream] = event.streams;
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.volume = isSpeakerOn ? 1 : 0.8;
          
          remoteAudioRef.current.play().then(() => {
            console.log('VoiceCall: Remote audio started playing');
          }).catch(error => {
            console.error('VoiceCall: Error playing remote audio:', error);
            setTimeout(() => {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.play();
              }
            }, 1000);
          });
        }
      };

      peerConnectionRef.current.onicecandidate = async (event) => {
        if (event.candidate && callId) {
          console.log('VoiceCall: Sending ICE candidate:', event.candidate.type);
          try {
            await addDoc(collection(db, 'calls', callId, 'candidates'), {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
              from: user!.uid,
              timestamp: serverTimestamp()
            });
          } catch (error) {
            console.error('Error sending ICE candidate:', error);
          }
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current?.connectionState;
        const iceState = peerConnectionRef.current?.iceConnectionState;
        console.log('VoiceCall: Connection state:', state, 'ICE state:', iceState);
        
        if (state === 'connected') {
          console.log('VoiceCall: WebRTC connected successfully!');
          setCallStatus('connected');
        } else if (state === 'failed' || iceState === 'failed') {
          console.log('VoiceCall: Connection failed, attempting restart');
          setTimeout(() => {
            if (peerConnectionRef.current?.connectionState === 'failed') {
              peerConnectionRef.current.restartIce();
            }
          }, 1000);
        } else if (state === 'disconnected') {
          console.log('VoiceCall: Connection disconnected, waiting...');
          setTimeout(() => {
            if (peerConnectionRef.current?.connectionState === 'disconnected') {
              console.log('VoiceCall: Still disconnected, restarting ICE');
              peerConnectionRef.current.restartIce();
            }
          }, 3000);
        }
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        const iceState = peerConnectionRef.current?.iceConnectionState;
        console.log('VoiceCall: ICE connection state changed to:', iceState);
        
        if (iceState === 'connected' || iceState === 'completed') {
          console.log('VoiceCall: ICE connection established');
          setCallStatus('connected');
        } else if (iceState === 'failed') {
          console.log('VoiceCall: ICE connection failed, restarting...');
          setTimeout(() => {
            if (peerConnectionRef.current) {
              peerConnectionRef.current.restartIce();
            }
          }, 1000);
        }
      };

      console.log('VoiceCall: WebRTC initialized successfully');
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Se requiere acceso al micrófono para realizar llamadas.');
        } else if (error.name === 'NotFoundError') {
          alert('No se encontró un micrófono.');
        } else if (error.name === 'NotReadableError') {
          alert('El micrófono está siendo usado por otra aplicación.');
        }
      }
      
      throw error;
    }
  };

  const setupICECandidateListener = (targetCallId: string) => {
    console.log('VoiceCall: Setting up ICE candidate listener for call:', targetCallId);
    
    const candidatesRef = collection(db, 'calls', targetCallId, 'candidates');
    onSnapshot(candidatesRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.from !== user!.uid && peerConnectionRef.current) {
            console.log('VoiceCall: Received ICE candidate from remote peer');
            try {
              const candidate = new RTCIceCandidate({
                candidate: data.candidate,
                sdpMLineIndex: data.sdpMLineIndex,
                sdpMid: data.sdpMid
              });
              
              if (peerConnectionRef.current.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(candidate);
                console.log('VoiceCall: ICE candidate added successfully');
              } else {
                console.log('VoiceCall: Queueing candidate until remote description is set');
                candidateQueueRef.current.push(candidate);
              }
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          }
        }
      });
    });
  };

  const processQueuedCandidates = async () => {
    console.log('VoiceCall: Processing queued ICE candidates:', candidateQueueRef.current.length);
    
    for (const candidate of candidateQueueRef.current) {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(candidate);
          console.log('VoiceCall: Queued candidate added successfully');
        }
      } catch (error) {
        console.error('Error adding queued candidate:', error);
      }
    }
    
    candidateQueueRef.current = [];
  };

  const handleOutgoingWebRTC = async (callDocId: string) => {
    if (!peerConnectionRef.current) return;

    console.log('VoiceCall: Setting up outgoing WebRTC connection');
    
    try {
      setupICECandidateListener(callDocId);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      console.log('VoiceCall: Offer created');
      await peerConnectionRef.current.setLocalDescription(offer);
      
      await updateDoc(doc(db, 'calls', callDocId), {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      });

      console.log('VoiceCall: Offer saved to Firestore');

      onSnapshot(doc(db, 'calls', callDocId), async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.answer && peerConnectionRef.current && !peerConnectionRef.current.remoteDescription) {
            console.log('VoiceCall: Received answer, setting remote description');
            try {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
              console.log('VoiceCall: Remote description set successfully');
              await processQueuedCandidates();
            } catch (error) {
              console.error('Error setting remote description:', error);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error in handleOutgoingWebRTC:', error);
    }
  };

  const handleIncomingWebRTC = async () => {
    if (!peerConnectionRef.current || !callId) return;

    console.log('VoiceCall: Setting up incoming WebRTC connection');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const callDoc = await getDoc(doc(db, 'calls', callId));
      if (callDoc.exists()) {
        const data = callDoc.data();
        if (data.offer) {
          console.log('VoiceCall: Setting remote description with offer');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          console.log('VoiceCall: Remote description set, creating answer');
          
          await processQueuedCandidates();
          
          const answer = await peerConnectionRef.current.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: false
          });
          
          console.log('VoiceCall: Answer created');
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
    } catch (error) {
      console.error('Error in handleIncomingWebRTC:', error);
    }
  };

  const acceptCall = async () => {
    if (!callId || !user?.uid) return;

    try {
      console.log('VoiceCall: User accepting call', callId);
      setCallStatus('connecting');
      
      await initializeWebRTC();
      setupICECandidateListener(callId);
      await handleIncomingWebRTC();
      
      await updateDoc(doc(db, 'calls', callId), {
        status: 'accepted'
      });
      
      console.log('VoiceCall: Call status updated to accepted');
      setCallStatus('connected');
      startCallTimer();
      
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
    
    cleanup();
    resetCallContext();
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
    resetCallContext();
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
      remoteAudioRef.current.volume = !isSpeakerOn ? 1 : 0.7;
    }
  };

  const startCallTimer = () => {
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

  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(async () => {
      if (callId && peerConnectionRef.current?.connectionState === 'connected') {
        try {
          await updateDoc(doc(db, 'calls', callId), {
            lastHeartbeat: serverTimestamp()
          });
        } catch (error) {
          console.error('Heartbeat error:', error);
        }
      }
    }, 5000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const handleMicrophoneChange = async (deviceId: string) => {
    try {
      console.log('VoiceCall: Changing microphone to:', deviceId);
      setCurrentMicId(deviceId);
      
      if (localStreamRef.current && peerConnectionRef.current) {
        const oldTrack = localStreamRef.current.getAudioTracks()[0];
        
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { 
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        
        const newTrack = newStream.getAudioTracks()[0];
        
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'audio'
        );
        
        if (sender && newTrack) {
          await sender.replaceTrack(newTrack);
          console.log('VoiceCall: Audio track replaced successfully');
        }
        
        if (oldTrack) {
          oldTrack.stop();
        }
        
        localStreamRef.current = newStream;
        
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = newStream;
        }
        
        console.log('VoiceCall: Microphone changed successfully');
      }
    } catch (error) {
      console.error('Error changing microphone:', error);
      alert('No se pudo cambiar el micrófono.');
    }
  };

  const handleSpeakerChange = async (deviceId: string) => {
    try {
      console.log('VoiceCall: Changing speaker to:', deviceId);
      setCurrentSpeakerId(deviceId);
      
      if (remoteAudioRef.current && 'setSinkId' in remoteAudioRef.current) {
        await (remoteAudioRef.current as any).setSinkId(deviceId);
        console.log('VoiceCall: Speaker changed successfully');
      }
    } catch (error) {
      console.error('Error changing speaker:', error);
      alert('No se pudo cambiar el altavoz.');
    }
  };

  const cleanup = () => {
    console.log('VoiceCall: Starting cleanup');
    
    stopCallTimer();
    stopHeartbeat();
    
    if (localStreamRef.current) {
      console.log('VoiceCall: Stopping local stream tracks');
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      console.log('VoiceCall: Closing peer connection');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
    
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }
    
    setCallStatus('ended');
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeakerOn(false);
    candidateQueueRef.current = [];
    
    console.log('VoiceCall: Cleanup completed');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Conectando...';
      case 'ringing':
        return isIncoming ? 'Llamada entrante' : 'Llamando...';
      case 'connected':
        return formatTime(callDuration);
      case 'ended':
        return 'Llamada terminada';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <audio ref={localAudioRef} muted autoPlay />
      <audio ref={remoteAudioRef} autoPlay />
      
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-8">
          <div className="mb-4">
            <Avatar
              src={otherUser.profileImage}
              name={otherUser.displayName}
              size="xl"
              className="mx-auto mb-4 w-24 h-24"
            />
            <h2 className="text-2xl font-bold text-white mb-2">
              {otherUser.displayName}
            </h2>
            <p className="text-gray-400">
              {getStatusText()}
            </p>
          </div>
        </div>

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

        {(callStatus === 'connecting' || callStatus === 'ringing') && !isIncoming && (
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              
              <MicrophoneSelector
                onMicrophoneChange={handleMicrophoneChange}
                onSpeakerChange={handleSpeakerChange}
                currentMicId={currentMicId}
                currentSpeakerId={currentSpeakerId}
                isDisabled={false}
              />
            </div>
          </div>
        )}

        {(callStatus === 'connected' || callStatus === 'connecting' || (callStatus === 'ringing' && !isIncoming)) && (
          <div className="flex justify-center items-center space-x-4">
            <div className="flex items-center space-x-1">
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
              
              <MicrophoneSelector
                onMicrophoneChange={handleMicrophoneChange}
                onSpeakerChange={handleSpeakerChange}
                currentMicId={currentMicId}
                currentSpeakerId={currentSpeakerId}
                isDisabled={false}
              />
            </div>

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
  );
};

export default VoiceCall;