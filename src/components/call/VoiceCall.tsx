import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, 
  Volume2, VolumeX 
} from 'lucide-react';
import { 
  doc, addDoc, collection, updateDoc, 
  onSnapshot, getDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { useCall } from '../../contexts/CallContext';
import Avatar from '../ui/Avatar';
import MicrophoneSelector from './MicrophoneSelector';

interface VoiceCallProps {
  isIncoming: boolean;
  callId: string;
  otherUser: {
    id: string;
    displayName: string;
    profileImage?: string;
  };
  chatId: string;
  onCallEnd: () => void;
}

interface CallData {
  callerId: string;
  receiverId: string;
  chatId: string;
  status: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidates?: RTCIceCandidateInit[];
  createdAt: any;
  lastHeartbeat?: any;
}

const VoiceCall: React.FC<VoiceCallProps> = ({
  isIncoming,
  callId: initialCallId,
  otherUser,
  chatId,
  onCallEnd
}) => {
  const { user } = useAuth();
  const { endCall: resetCallContext } = useCall(); // Renombré para evitar conflicto
  
  const [callId, setCallId] = useState<string>(initialCallId);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [currentMicId, setCurrentMicId] = useState('');
  const [currentSpeakerId, setCurrentSpeakerId] = useState('');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callDocRef = useRef<any>(null);
  const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // CONFIGURACIÓN MEJORADA PARA PRODUCCIÓN
  const servers = {
    iceServers: [
      // Servidores STUN públicos más confiables
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.stunprotocol.org:3478' },
      { urls: 'stun:stun.services.mozilla.com' },
      
      // Servidores TURN gratuitos más estables
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
    iceTransportPolicy: 'all' as RTCIceTransportPolicy
  };

  const initializeWebRTC = async () => {
    try {
      console.log('VoiceCall: Initializing WebRTC for production');
      
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }
      
      // Crear peer connection con configuración mejorada
      peerConnectionRef.current = new RTCPeerConnection(servers);
      console.log('VoiceCall: Peer connection created with enhanced config');
      
      // CONFIGURACIÓN DE AUDIO MEJORADA PARA PRODUCCIÓN
      console.log('VoiceCall: Requesting microphone with enhanced constraints');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Mejor calidad de audio
          sampleSize: 16,
          channelCount: 1, // Mono para mejor compatibilidad
          latency: 0.01, // Baja latencia
          // Añadir restricciones específicas para producción
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false
        } as any, 
        video: false 
      });
      
      console.log('VoiceCall: Got microphone stream with enhanced quality');
      localStreamRef.current = stream;

      // CONFIGURAR TRACKS CON MEJORES PARÁMETROS
      console.log('VoiceCall: Adding tracks with enhanced parameters');
      stream.getTracks().forEach(track => {
        if (peerConnectionRef.current && track.kind === 'audio') {
          // Configurar parámetros específicos del track de audio
          const sender = peerConnectionRef.current.addTrack(track, stream);
          console.log('VoiceCall: Added audio track with sender:', sender);
          
          // Intentar configurar parámetros de encoding para mejor calidad
          if (sender.getParameters) {
            const params = sender.getParameters();
            if (params.encodings && params.encodings.length > 0) {
              params.encodings[0].maxBitrate = 64000; // 64 kbps para audio
              params.encodings[0].priority = 'high';
              sender.setParameters(params).catch(e => 
                console.warn('Could not set encoding parameters:', e)
              );
            }
          }
        }
      });

      // Configurar audio local (silenciado para evitar feedback)
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
        localAudioRef.current.volume = 0; // Asegurar que esté silenciado
      }

      console.log('VoiceCall: Setting up enhanced event handlers');
      
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection es null después de crear');
      }

      // MANEJADOR DE TRACK REMOTO MEJORADO
      peerConnectionRef.current.ontrack = (event) => {
        console.log('VoiceCall: Received remote track:', event.track.kind, event.track.readyState);
        
        if (event.track.kind === 'audio') {
          const [remoteStream] = event.streams;
          console.log('VoiceCall: Setting up remote audio stream');
          
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.5;
            
            // FORZAR REPRODUCCIÓN PARA ASEGURAR QUE SE ESCUCHE
            const playPromise = remoteAudioRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('VoiceCall: Remote audio playback started successfully');
                })
                .catch(error => {
                  console.error('VoiceCall: Remote audio playback failed:', error);
                  // Intentar reproducir después de una interacción del usuario
                  document.addEventListener('click', () => {
                    if (remoteAudioRef.current) {
                      remoteAudioRef.current.play().catch(e => 
                        console.error('Retry playback failed:', e)
                      );
                    }
                  }, { once: true });
                });
            }
          }
          
          // Verificar estado del track
          event.track.onended = () => {
            console.log('VoiceCall: Remote track ended');
          };
          
          event.track.onmute = () => {
            console.log('VoiceCall: Remote track muted');
          };
          
          event.track.onunmute = () => {
            console.log('VoiceCall: Remote track unmuted');
          };
        }
      };

      // MANEJADOR DE ICE CANDIDATES MEJORADO
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && callId) {
          console.log('VoiceCall: ICE candidate generated:', event.candidate.type);
          addIceCandidate(callId, event.candidate);
        } else if (!event.candidate) {
          console.log('VoiceCall: ICE gathering completed');
        }
      };

      // MANEJADOR DE ESTADO DE CONEXIÓN MEJORADO
      peerConnectionRef.current.onconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const state = peerConnectionRef.current.connectionState;
          console.log('VoiceCall: Connection state changed:', state);
          
          if (state === 'connected') {
            console.log('VoiceCall: Peer connection established successfully');
            setCallStatus('connected');
            startCallTimer();
            startHeartbeat();
            
            // Verificar que el audio remoto esté funcionando
            setTimeout(() => {
              checkAudioFlow();
            }, 2000);
            
          } else if (state === 'disconnected') {
            console.log('VoiceCall: Connection disconnected, attempting reconnection');
            // Intentar reconectar después de un breve delay
            retryTimeoutRef.current = setTimeout(() => {
              if (peerConnectionRef.current?.connectionState === 'disconnected') {
                console.log('VoiceCall: Attempting to restart ICE');
                peerConnectionRef.current?.restartIce();
              }
            }, 3000);
            
          } else if (state === 'failed') {
            console.log('VoiceCall: Connection failed, ending call');
            endCall();
          }
        }
      };

      // MANEJADOR DE ICE CONNECTION STATE
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const iceState = peerConnectionRef.current.iceConnectionState;
          console.log('VoiceCall: ICE connection state:', iceState);
          
          if (iceState === 'failed') {
            console.log('VoiceCall: ICE connection failed, restarting ICE');
            peerConnectionRef.current.restartIce();
          }
        }
      };

      console.log('VoiceCall: WebRTC initialization completed successfully');

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      throw error;
    }
  };

  // FUNCIÓN PARA VERIFICAR FLUJO DE AUDIO
  const checkAudioFlow = () => {
    if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
      const stream = remoteAudioRef.current.srcObject as MediaStream;
      const audioTracks = stream.getAudioTracks();
      
      audioTracks.forEach(track => {
        console.log('VoiceCall: Remote audio track state:', {
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });
      
      // Asegurar que el elemento de audio esté configurado correctamente
      if (remoteAudioRef.current.paused) {
        remoteAudioRef.current.play().catch(e => 
          console.error('Audio autoplay blocked:', e)
        );
      }
    }
  };

  const addIceCandidate = async (callDocId: string, candidate: RTCIceCandidate) => {
    try {
      const currentCandidates = candidateQueueRef.current || [];
      const newCandidate = {
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid
      };
      
      await updateDoc(doc(db, 'calls', callDocId), {
        candidates: [...currentCandidates, newCandidate]
      });
      
      console.log('VoiceCall: ICE candidate added to Firestore');
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const processQueuedCandidates = async () => {
    if (!peerConnectionRef.current || candidateQueueRef.current.length === 0) return;
    
    console.log('VoiceCall: Processing queued ICE candidates:', candidateQueueRef.current.length);
    
    for (const candidateData of candidateQueueRef.current) {
      try {
        const candidate = new RTCIceCandidate(candidateData);
        await peerConnectionRef.current.addIceCandidate(candidate);
        console.log('VoiceCall: ICE candidate added successfully');
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
    
    candidateQueueRef.current = [];
  };

  const setupICECandidateListener = (callDocId: string) => {
    onSnapshot(doc(db, 'calls', callDocId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.candidates && peerConnectionRef.current) {
          const newCandidates = data.candidates.filter(
            (candidate: any) => !candidateQueueRef.current.find(
              (existing: any) => existing.candidate === candidate.candidate
            )
          );
          
          if (newCandidates.length > 0) {
            console.log('VoiceCall: New ICE candidates received:', newCandidates.length);
            candidateQueueRef.current = [...candidateQueueRef.current, ...newCandidates];
            
            if (peerConnectionRef.current.remoteDescription) {
              processQueuedCandidates();
            }
          }
        }
      }
    });
  };

  const handleOutgoingWebRTC = async (callDocId: string) => {
    if (!peerConnectionRef.current) return;

    try {
      console.log('VoiceCall: Setting up outgoing WebRTC connection');
      
      setupICECandidateListener(callDocId);
      
      // Crear offer con configuraciones específicas para audio
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
        // Removí voiceActivityDetection ya que no es una opción válida
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
      
      // Escuchar por la respuesta
      onSnapshot(doc(db, 'calls', callDocId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CallData;
          if (data.answer && peerConnectionRef.current && !peerConnectionRef.current.remoteDescription) {
            console.log('VoiceCall: Received answer, setting remote description');
            try {
              peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
                .then(() => {
                  console.log('VoiceCall: Remote description set successfully');
                  processQueuedCandidates();
                })
                .catch(error => {
                  console.error('Error setting remote description:', error);
                });
            } catch (error) {
              console.error('Error setting remote description:', error);
            }
          }
        }
      });

    } catch (error) {
      console.error('Error in outgoing WebRTC setup:', error);
      throw error;
    }
  };

  const handleIncomingWebRTC = async () => {
    if (!callId || !peerConnectionRef.current) return;

    try {
      console.log('VoiceCall: Setting up incoming WebRTC connection');
      
      setupICECandidateListener(callId);
      
      const callDoc = await getDoc(doc(db, 'calls', callId));
      if (!callDoc.exists()) return;
      
      const callData = callDoc.data();
      if (!callData.offer) return;

      console.log('VoiceCall: Setting remote description from offer');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(callData.offer));
      
      // Crear answer con configuraciones específicas
      const answer = await peerConnectionRef.current.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
        // Removí voiceActivityDetection ya que no es una opción válida
      });
      
      console.log('VoiceCall: Answer created');
      await peerConnectionRef.current.setLocalDescription(answer);
      
      await updateDoc(doc(db, 'calls', callId), {
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      });

      console.log('VoiceCall: Answer saved to Firestore');
      await processQueuedCandidates();

    } catch (error) {
      console.error('Error in incoming WebRTC setup:', error);
      throw error;
    }
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
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    console.log('VoiceCall: Speaker toggled:', newSpeakerState);
    
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = newSpeakerState ? 1.0 : 0.5;
      
      // Asegurar que el audio siga reproduciéndose
      if (remoteAudioRef.current.paused) {
        remoteAudioRef.current.play().catch(e => 
          console.error('Error resuming audio after speaker toggle:', e)
        );
      }
    }
  };

  const handleMicrophoneChange = async (deviceId: string) => {
    try {
      console.log('VoiceCall: Changing microphone to:', deviceId);
      setCurrentMicId(deviceId);
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          sampleSize: 16,
          channelCount: 1
        },
        video: false
      });
      
      localStreamRef.current = newStream;
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = newStream;
      }
      
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track?.kind === 'audio'
        );
        
        if (sender && newStream.getAudioTracks()[0]) {
          await sender.replaceTrack(newStream.getAudioTracks()[0]);
          console.log('VoiceCall: Microphone track replaced');
        }
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
      if (callId) {
        try {
          await updateDoc(doc(db, 'calls', callId), {
            lastHeartbeat: serverTimestamp()
          });
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const cleanup = () => {
    console.log('VoiceCall: Starting cleanup');
    
    stopCallTimer();
    stopHeartbeat();
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
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
    setIsSpeakerOn(true);
    candidateQueueRef.current = [];
    
    console.log('VoiceCall: Cleanup completed');
  };

  const initializeOutgoingCall = async () => {
    console.log('VoiceCall: initializeOutgoingCall called, user:', user?.uid);
    
    if (!user?.uid) {
      console.error('VoiceCall: No user authenticated');
      alert('Debes estar logueado para hacer llamadas');
      onCallEnd();
      return;
    }

    try {
      console.log('VoiceCall: Starting outgoing call');
      setCallStatus('connecting');
      
      await initializeWebRTC();
      
      const callDoc = await addDoc(collection(db, 'calls'), {
        callerId: user.uid,
        receiverId: otherUser.id,
        chatId: chatId,
        status: 'ringing',
        createdAt: serverTimestamp()
      });

      const newCallId = callDoc.id;
      setCallId(newCallId);
      callDocRef.current = callDoc;
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
      alert(`Error al iniciar llamada: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

  const acceptCall = async () => {
    if (!callId) return;

    try {
      console.log('VoiceCall: Accepting call');
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
    resetCallContext(); // Ahora uso el nombre correcto
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
    resetCallContext(); // Ahora uso el nombre correcto
    onCallEnd();
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

  useEffect(() => {
    console.log('VoiceCall: Component mounted', { isIncoming, callId: initialCallId, user: user?.uid });
    
    if (!user?.uid) {
      console.log('VoiceCall: Waiting for user authentication...');
      return;
    }
    
    if (isIncoming && initialCallId) {
      initializeIncomingCall(initialCallId);
    } else if (!isIncoming) {
      initializeOutgoingCall();
    }

    return () => {
      console.log('VoiceCall: Component unmounting');
      cleanup();
    };
  }, [user?.uid, isIncoming, initialCallId]);

  // Mostrar loading mientras esperamos autenticación
  if (!user?.uid) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Preparando llamada...</h2>
            <p className="text-gray-400">Verificando autenticación</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* ELEMENTOS DE AUDIO CON CONFIGURACIÓN MEJORADA */}
      <audio 
        ref={localAudioRef} 
        muted 
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      <audio 
        ref={remoteAudioRef} 
        autoPlay
        playsInline
        controls={false}
        style={{ display: 'none' }}
        onLoadedMetadata={() => {
          console.log('VoiceCall: Remote audio metadata loaded');
          if (remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(e => 
              console.error('Auto-play failed:', e)
            );
          }
        }}
        onCanPlay={() => {
          console.log('VoiceCall: Remote audio can play');
        }}
        onPlay={() => {
          console.log('VoiceCall: Remote audio started playing');
        }}
        onError={(e) => {
          console.error('VoiceCall: Remote audio error:', e);
        }}
      />
      
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

        {/* BOTONES PARA LLAMADA ENTRANTE */}
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

        {/* CONTROLES PARA LLAMADA SALIENTE MIENTRAS SUENA */}
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
            
            <button
              onClick={endCall}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        {/* CONTROLES COMPLETOS DURANTE LA LLAMADA */}
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

        {/* INDICADOR DE ESTADO DE CONEXIÓN PARA DEBUG */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500">
            Status: {callStatus} | 
            PC State: {peerConnectionRef.current?.connectionState || 'none'} |
            ICE State: {peerConnectionRef.current?.iceConnectionState || 'none'}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCall;