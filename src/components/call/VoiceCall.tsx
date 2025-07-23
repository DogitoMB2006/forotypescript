// src/components/call/VoiceCall.tsx
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

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Servidores STUN adicionales para mejor conectividad en producción
      { urls: 'stun:stun.stunprotocol.org:3478' },
      { urls: 'stun:stun.services.mozilla.com' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
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
    } else {
      stopCallTimer();
      stopHeartbeat();
    }

    return () => {
      stopCallTimer();
      stopHeartbeat();
    };
  }, [callStatus]);

  const startHeartbeat = () => {
    if (!callId) return;
    
    heartbeatRef.current = setInterval(async () => {
      try {
        if (peerConnectionRef.current) {
          const stats = await peerConnectionRef.current.getStats();
          console.log('VoiceCall: Heartbeat - Connection active, stats:', stats.size);
          
          // Debug: Check audio stats
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
              console.log('VoiceCall: Inbound audio - packets received:', report.packetsReceived);
            }
            if (report.type === 'outbound-rtp' && report.mediaType === 'audio') {
              console.log('VoiceCall: Outbound audio - packets sent:', report.packetsSent);
            }
          });
          
          await updateDoc(doc(db, 'calls', callId), {
            [`heartbeat.${user!.uid}`]: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
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
      } else {
        console.log('VoiceCall: Setting microphone for future use');
      }
    } catch (error) {
      console.error('Error changing microphone:', error);
      alert('No se pudo cambiar el micrófono. Verifica que el dispositivo esté disponible.');
    }
  };

  const handleSpeakerChange = async (deviceId: string) => {
    try {
      console.log('VoiceCall: Changing speaker to:', deviceId);
      setCurrentSpeakerId(deviceId);
      
      if (remoteAudioRef.current && 'setSinkId' in remoteAudioRef.current) {
        await (remoteAudioRef.current as any).setSinkId(deviceId);
        console.log('VoiceCall: Speaker changed successfully');
      } else {
        console.log('VoiceCall: setSinkId not supported on this browser');
      }
    } catch (error) {
      console.error('Error changing speaker:', error);
      alert('No se pudo cambiar el altavoz. Verifica que el dispositivo esté disponible.');
    }
  };

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
      
      // Inicializar WebRTC ANTES de crear el documento de llamada
      await initializeWebRTC();
      
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

      // Ahora crear la offer
      await handleOutgoingWebRTC(callDoc.id);

      onSnapshot(doc(db, 'calls', callDoc.id), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CallData;
          console.log('VoiceCall: Outgoing call status update:', data.status);
          
          if (data.status === 'accepted') {
            console.log('VoiceCall: Call accepted by receiver!');
            setCallStatus('connected');
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
      
      // Verificar si estamos en HTTPS (requerido para producción)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.warn('VoiceCall: WebRTC requires HTTPS in production');
      }
      
      peerConnectionRef.current = new RTCPeerConnection(servers);
      
      // Configuración de audio optimizada para producción
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          // Configuraciones adicionales para mejor calidad
          channelCount: 1,
          latency: 0.01,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true
        }, 
        video: false 
      };

      console.log('VoiceCall: Requesting user media with constraints:', audioConstraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      localStreamRef.current = stream;

      console.log('VoiceCall: Local stream obtained with', stream.getAudioTracks().length, 'audio tracks');

      stream.getTracks().forEach((track, index) => {
        console.log(`VoiceCall: Adding track ${index}:`, track.kind, track.enabled, track.readyState);
        peerConnectionRef.current!.addTrack(track, stream);
      });

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
      }

      peerConnectionRef.current.ontrack = (event) => {
        console.log('VoiceCall: Received remote audio stream', event.streams.length, 'streams');
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.volume = 1.0;
          
          if (currentSpeakerId && 'setSinkId' in remoteAudioRef.current) {
            try {
              (remoteAudioRef.current as any).setSinkId(currentSpeakerId);
            } catch (error) {
              console.error('Error setting audio output device:', error);
            }
          }
          
          // Asegurar que el audio se reproduzca en móviles/producción
          const playPromise = remoteAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('VoiceCall: Remote audio playing successfully!');
            }).catch(error => {
              console.error('VoiceCall: Error playing remote audio:', error);
              // Intentar reproducir después de interacción del usuario
              const playOnClick = () => {
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.play();
                  document.removeEventListener('click', playOnClick);
                }
              };
              document.addEventListener('click', playOnClick);
            });
          }
          console.log('VoiceCall: Remote audio connected successfully!');
        }
      };

      peerConnectionRef.current.onicecandidate = async (event) => {
        if (event.candidate && callId) {
          console.log('VoiceCall: Sending ICE candidate', event.candidate.type);
          try {
            await addDoc(collection(db, 'calls', callId, 'candidates'), {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
              type: event.candidate.type,
              foundation: event.candidate.foundation,
              component: event.candidate.component,
              priority: event.candidate.priority,
              protocol: event.candidate.protocol,
              from: user!.uid,
              timestamp: serverTimestamp()
            });
          } catch (error) {
            console.error('Error sending ICE candidate:', error);
          }
        } else if (!event.candidate) {
          console.log('VoiceCall: ICE gathering completed');
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current?.connectionState;
        const iceState = peerConnectionRef.current?.iceConnectionState;
        const gatheringState = peerConnectionRef.current?.iceGatheringState;
        console.log('VoiceCall: Connection state:', state, 'ICE state:', iceState, 'Gathering:', gatheringState);
        
        if (state === 'connected') {
          console.log('VoiceCall: WebRTC connected successfully!');
        } else if (state === 'failed') {
          console.log('VoiceCall: Connection failed, attempting ICE restart');
          if (peerConnectionRef.current) {
            peerConnectionRef.current.restartIce();
          }
        } else if (state === 'disconnected') {
          console.log('VoiceCall: Connection disconnected');
        }
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        const iceState = peerConnectionRef.current?.iceConnectionState;
        console.log('VoiceCall: ICE connection state changed to:', iceState);
        
        if (iceState === 'failed') {
          console.log('VoiceCall: ICE connection failed, restarting...');
          if (peerConnectionRef.current) {
            peerConnectionRef.current.restartIce();
          }
        }
      };

      peerConnectionRef.current.onicegatheringstatechange = () => {
        console.log('VoiceCall: ICE gathering state:', peerConnectionRef.current?.iceGatheringState);
      };

      console.log('VoiceCall: WebRTC initialized successfully');
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      
      // Manejo específico de errores comunes en producción
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          console.error('VoiceCall: Microphone permission denied');
          alert('Se requiere acceso al micrófono para realizar llamadas. Por favor, permite el acceso y recarga la página.');
        } else if (error.name === 'NotFoundError') {
          console.error('VoiceCall: No microphone found');
          alert('No se encontró un micrófono. Por favor, conecta un micrófono e inténtalo de nuevo.');
        } else if (error.name === 'NotReadableError') {
          console.error('VoiceCall: Microphone is being used by another application');
          alert('El micrófono está siendo usado por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando el micrófono.');
        } else if (error.name === 'OverconstrainedError') {
          console.error('VoiceCall: Audio constraints not supported');
          // Intentar con configuración más básica
          try {
            console.log('VoiceCall: Trying with basic audio constraints');
            const basicStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = basicStream;
            
            basicStream.getTracks().forEach((track) => {
              peerConnectionRef.current!.addTrack(track, basicStream);
            });
            
            if (localAudioRef.current) {
              localAudioRef.current.srcObject = basicStream;
              localAudioRef.current.muted = true;
            }
            
            console.log('VoiceCall: Basic audio configuration successful');
          } catch (basicError) {
            console.error('VoiceCall: Even basic audio configuration failed:', basicError);
            alert('Tu dispositivo no soporta las llamadas de voz.');
          }
        }
      }
      
      throw error;
    }
  };

  const setupICECandidateListener = (targetCallId: string) => {
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
                console.log('VoiceCall: Waiting for remote description before adding candidate');
                setTimeout(async () => {
                  if (peerConnectionRef.current?.remoteDescription) {
                    await peerConnectionRef.current.addIceCandidate(candidate);
                    console.log('VoiceCall: ICE candidate added after delay');
                  }
                }, 1000);
              }
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          }
        }
      });
    });
  };

  const handleOutgoingWebRTC = async (callDocId: string) => {
    if (!peerConnectionRef.current) return;

    console.log('VoiceCall: Setting up outgoing WebRTC connection');
    
    try {
      setupICECandidateListener(callDocId);
      
      // Esperar un momento para que se configure todo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      console.log('VoiceCall: Offer created:', offer.type);
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('VoiceCall: Local description set');

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
      // Esperar un momento para asegurar que todo esté configurado
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const callDoc = await getDoc(doc(db, 'calls', callId));
      if (callDoc.exists()) {
        const data = callDoc.data();
        if (data.offer) {
          console.log('VoiceCall: Setting remote description with offer');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          console.log('VoiceCall: Remote description set, creating answer');
          
          const answer = await peerConnectionRef.current.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: false
          });
          
          console.log('VoiceCall: Answer created:', answer.type);
          await peerConnectionRef.current.setLocalDescription(answer);
          console.log('VoiceCall: Local description set');

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
      
      // Inicializar WebRTC antes de aceptar
      await initializeWebRTC();
      setupICECandidateListener(callId);
      await handleIncomingWebRTC();
      
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
      console.log('VoiceCall: Testing remote audio element');
      console.log('VoiceCall: Remote audio src:', remoteAudioRef.current.srcObject);
      console.log('VoiceCall: Remote audio volume:', remoteAudioRef.current.volume);
      console.log('VoiceCall: Remote audio muted:', remoteAudioRef.current.muted);
      console.log('VoiceCall: Remote audio paused:', remoteAudioRef.current.paused);
      
      if (remoteAudioRef.current.srcObject) {
        const stream = remoteAudioRef.current.srcObject as MediaStream;
        console.log('VoiceCall: Remote stream tracks:', stream.getTracks().length);
        stream.getAudioTracks().forEach((track, index) => {
          console.log(`VoiceCall: Remote audio track ${index}:`, track.enabled, track.readyState);
        });
      }
      
      if (!isSpeakerOn) {
        remoteAudioRef.current.volume = 1;
      } else {
        remoteAudioRef.current.volume = 0.7;
      }
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
        console.log('VoiceCall: Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      console.log('VoiceCall: Closing peer connection');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Limpiar elementos de audio
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
    
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }
    
    // Reset estados
    setCallStatus('ended');
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeakerOn(false);
    
    console.log('VoiceCall: Cleanup completed');
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
                
                {(callStatus === 'connected' || callStatus === 'connecting') && (
                  <MicrophoneSelector
                    onMicrophoneChange={handleMicrophoneChange}
                    onSpeakerChange={handleSpeakerChange}
                    currentMicId={currentMicId}
                    currentSpeakerId={currentSpeakerId}
                    isDisabled={callStatus !== 'connected' && callStatus !== 'connecting'}
                  />
                )}
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

      <audio 
        ref={localAudioRef} 
        autoPlay 
        muted 
        playsInline
      />
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline
        controls={false}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default VoiceCall;