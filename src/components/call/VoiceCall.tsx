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
      // STUN servers principales
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.stunprotocol.org:3478' },
      { urls: 'stun:stun.services.mozilla.com' },
      
      // TURN servers principales
      {
        urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      
      // TURN servers alternativos
      {
        urls: 'turn:relay1.expressturn.com:3478',
        username: 'ef3CYGPRL0GUPE4R4R',
        credential: 'bR79wKjBKx0LL6m9'
      },
      
      // Más TURN servers de respaldo
      {
        urls: ['turn:numb.viagenie.ca:3478'],
        username: 'webrtc@live.com',
        credential: 'muazkh'
      },
      
      // TURN servers adicionales con TCP/UDP
      {
        urls: [
          'turn:openrelay.metered.ca:80?transport=tcp',
          'turn:openrelay.metered.ca:443?transport=tcp'
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 20,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
    iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    iceGatheringState: 'gathering'
  };

  const initializeWebRTC = async () => {
    try {
      console.log('VoiceCall: Initializing WebRTC');
      
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }
      
      peerConnectionRef.current = new RTCPeerConnection(servers);
      console.log('VoiceCall: Peer connection created');
      
      console.log('VoiceCall: Requesting microphone permission');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      console.log('VoiceCall: Got microphone stream');
      localStreamRef.current = stream;

      console.log('🎤 VoiceCall: Adding tracks to peer connection');
      stream.getTracks().forEach(track => {
        if (peerConnectionRef.current) {
          console.log('🎤 Adding track:', {
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            id: track.id
          });
          peerConnectionRef.current.addTrack(track, stream);
        }
      });

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Siempre mutear el audio local para evitar feedback
        localAudioRef.current.volume = 0; // Asegurar que no se escuche el audio local
      }

      console.log('VoiceCall: Setting up event handlers');
      
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection es null después de crear');
      }

      peerConnectionRef.current.ontrack = (event) => {
        console.log('🎵 VoiceCall: ontrack event fired!');
        console.log('🎵 Event details:', {
          streams: event.streams.length,
          track: event.track,
          trackKind: event.track.kind,
          trackEnabled: event.track.enabled,
          trackReadyState: event.track.readyState
        });
        
        const [remoteStream] = event.streams;
        
        if (remoteStream) {
          console.log('🎵 Remote stream details:', {
            id: remoteStream.id,
            active: remoteStream.active,
            tracks: remoteStream.getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState
            }))
          });
          
          if (remoteAudioRef.current) {
            console.log('🎵 Setting remote stream to audio element');
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.muted = false;
            
            // Event listeners para debugging
            remoteAudioRef.current.onloadedmetadata = () => {
              console.log('🎵 Remote audio metadata loaded');
            };
            
            remoteAudioRef.current.oncanplay = () => {
              console.log('🎵 Remote audio can play');
            };
            
            remoteAudioRef.current.onplay = () => {
              console.log('🎵 Remote audio started playing');
            };
            
            remoteAudioRef.current.onerror = (e) => {
              console.error('🎵 Remote audio error:', e);
            };
            
            // Forzar reproducción
            setTimeout(() => {
              if (remoteAudioRef.current) {
                console.log('🎵 Attempting to play remote audio...');
                remoteAudioRef.current.play()
                  .then(() => {
                    console.log('🎵 ✅ Remote audio playing successfully!');
                    console.log('🎵 Audio element state:', {
                      paused: remoteAudioRef.current?.paused,
                      volume: remoteAudioRef.current?.volume,
                      muted: remoteAudioRef.current?.muted,
                      currentTime: remoteAudioRef.current?.currentTime
                    });
                  })
                  .catch(error => {
                    console.error('🎵 ❌ Remote audio play failed:', error);
                  });
              }
            }, 500);
            
          } else {
            console.error('🎵 ❌ No remote audio ref available!');
          }
        } else {
          console.error('🎵 ❌ No remote stream in event!');
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && callId) {
          console.log('VoiceCall: ICE candidate generated');
          addIceCandidate(callId, event.candidate);
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const state = peerConnectionRef.current.connectionState;
          const iceState = peerConnectionRef.current.iceConnectionState;
          console.log('VoiceCall: Connection state changed:', state, 'ICE state:', iceState);
          
          if (state === 'connected') {
            console.log('🔗 VoiceCall: Peer connection established');
            setCallStatus('connected');
            startCallTimer();
            startHeartbeat();
            
            // Debug completo del estado
            setTimeout(() => {
              console.log('🔍 CONNECTION DEBUG SUMMARY:');
              console.log('🔍 Local stream tracks:', localStreamRef.current?.getTracks().map(t => ({
                kind: t.kind,
                enabled: t.enabled,
                readyState: t.readyState
              })));
              
              console.log('🔍 Peer connection state:', {
                connectionState: peerConnectionRef.current?.connectionState,
                iceConnectionState: peerConnectionRef.current?.iceConnectionState,
                signalingState: peerConnectionRef.current?.signalingState
              });
              
              console.log('🔍 Remote audio element:', {
                srcObject: remoteAudioRef.current?.srcObject,
                volume: remoteAudioRef.current?.volume,
                muted: remoteAudioRef.current?.muted,
                paused: remoteAudioRef.current?.paused
              });
              
              // Intentar reproducir nuevamente
              if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
                console.log('🔍 Forcing remote audio play on connection...');
                remoteAudioRef.current.play().catch(e => 
                  console.log('🔍 Force play failed:', e)
                );
              }
            }, 2000);
          } else if (state === 'connecting') {
            console.log('VoiceCall: Still connecting...');
          } else if (state === 'disconnected') {
            console.log('VoiceCall: Connection temporarily lost, waiting for reconnection...');
            // Dar más tiempo para reconectar antes de fallar
            setTimeout(() => {
              if (peerConnectionRef.current?.connectionState === 'disconnected') {
                console.log('VoiceCall: Connection still disconnected after timeout');
                endCall();
              }
            }, 10000); // 10 segundos en lugar de 5
          } else if (state === 'failed') {
            console.log('VoiceCall: Connection failed permanently');
            alert('La conexión falló. Esto puede deberse a problemas de red o firewall.');
            endCall();
          }
        }
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const iceState = peerConnectionRef.current.iceConnectionState;
          console.log('VoiceCall: ICE connection state changed:', iceState);
          
          if (iceState === 'failed') {
            console.log('VoiceCall: ICE connection failed, restarting ICE...');
            peerConnectionRef.current.restartIce();
          } else if (iceState === 'disconnected') {
            console.log('VoiceCall: ICE disconnected, waiting for reconnection...');
          } else if (iceState === 'connected' || iceState === 'completed') {
            console.log('VoiceCall: ICE connection successful!');
          }
        }
      };

      peerConnectionRef.current.onicegatheringstatechange = () => {
        if (peerConnectionRef.current) {
          console.log('VoiceCall: ICE gathering state:', peerConnectionRef.current.iceGatheringState);
        }
      };

      console.log('VoiceCall: WebRTC initialization completed');

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      throw error;
    }
  };

  const addIceCandidate = async (callDocId: string, candidate: RTCIceCandidate) => {
    try {
      await updateDoc(doc(db, 'calls', callDocId), {
        candidates: [...(candidateQueueRef.current || []), {
          candidate: candidate.candidate,
          sdpMLineIndex: candidate.sdpMLineIndex,
          sdpMid: candidate.sdpMid
        }]
      });
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const setupICECandidateListener = (callDocId: string) => {
    onSnapshot(doc(db, 'calls', callDocId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.candidates && peerConnectionRef.current) {
          data.candidates.forEach(async (candidateData: any) => {
            try {
              const candidate = new RTCIceCandidate(candidateData);
              
              if (peerConnectionRef.current?.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(candidate);
                console.log('VoiceCall: ICE candidate added');
              } else {
                candidateQueueRef.current.push(candidate);
                console.log('VoiceCall: ICE candidate queued');
              }
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          });
        }
      }
    });
  };

  const processQueuedCandidates = async () => {
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
      
      // Esperar a que se complete la recolección de ICE candidates
      console.log('VoiceCall: Waiting for ICE gathering...');
      await new Promise((resolve) => {
        if (peerConnectionRef.current?.iceGatheringState === 'complete') {
          resolve(void 0);
          return;
        }
        
        const timeout = setTimeout(() => {
          console.log('VoiceCall: ICE gathering timeout, proceeding anyway');
          resolve(void 0);
        }, 5000);
        
        peerConnectionRef.current!.addEventListener('icegatheringstatechange', function onStateChange() {
          if (peerConnectionRef.current?.iceGatheringState === 'complete') {
            console.log('VoiceCall: ICE gathering completed');
            clearTimeout(timeout);
            peerConnectionRef.current?.removeEventListener('icegatheringstatechange', onStateChange);
            resolve(void 0);
          }
        });
      });
      
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
        iceRestart: false
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

      console.log('VoiceCall: Answer saved to Firestore');
      await processQueuedCandidates();

    } catch (error) {
      console.error('Error in incoming WebRTC setup:', error);
      throw error;
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
    // Limpiar heartbeat anterior si existe
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    
    heartbeatRef.current = setInterval(async () => {
      // Verificar que aún tenemos un callId y que el componente no se desmontó
      if (callId && callStatus !== 'ended') {
        try {
          await updateDoc(doc(db, 'calls', callId), {
            lastHeartbeat: serverTimestamp()
          });
          console.log('VoiceCall: Heartbeat sent successfully');
        } catch (error) {
          console.log('VoiceCall: Heartbeat failed (document may be deleted):', error);
          // Si el documento no existe, detener el heartbeat
          stopHeartbeat();
        }
      } else {
        console.log('VoiceCall: Stopping heartbeat - no callId or call ended');
        stopHeartbeat();
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
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
      
      console.log('VoiceCall: Step 1 - Initializing WebRTC');
      await initializeWebRTC();
      console.log('VoiceCall: Step 2 - WebRTC initialized successfully');
      
      console.log('VoiceCall: Step 3 - Creating call document');
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
      
      console.log('VoiceCall: Step 4 - Call document created:', newCallId);
      setCallStatus('ringing');
      
      console.log('VoiceCall: Step 5 - Setting up WebRTC connection');
      await handleOutgoingWebRTC(newCallId);
      console.log('VoiceCall: Step 6 - WebRTC connection setup complete');

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
      console.error('Error details:', error);
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

    console.log('VoiceCall: Declining call');
    
    // Detener heartbeat inmediatamente
    stopHeartbeat();
    stopCallTimer();

    try {
      // Verificar si el documento existe antes de actualizarlo
      const callDocSnapshot = await getDoc(doc(db, 'calls', callId));
      
      if (callDocSnapshot.exists()) {
        await updateDoc(doc(db, 'calls', callId), {
          status: 'declined',
          declinedAt: serverTimestamp()
        });
        console.log('VoiceCall: Call declined in database');
      } else {
        console.log('VoiceCall: Call document no longer exists when declining');
      }
    } catch (error) {
      console.log('VoiceCall: Error declining call (document may be deleted):', error);
    }
    
    cleanup();
    resetCallContext();
    onCallEnd();
  };

  const endCall = async () => {
    console.log('VoiceCall: Starting endCall process');
    
    // Detener heartbeat inmediatamente para evitar errores
    stopHeartbeat();
    stopCallTimer();
    
    if (callId) {
      try {
        // Verificar si el documento aún existe antes de actualizarlo
        const callDocSnapshot = await getDoc(doc(db, 'calls', callId));
        
        if (callDocSnapshot.exists()) {
          await updateDoc(doc(db, 'calls', callId), {
            status: 'ended',
            endedAt: serverTimestamp()
          });
          console.log('VoiceCall: Call status updated to ended');
          
          // Eliminar el documento después de un delay más corto
          setTimeout(async () => {
            try {
              const finalCheck = await getDoc(doc(db, 'calls', callId));
              if (finalCheck.exists()) {
                await deleteDoc(doc(db, 'calls', callId));
                console.log('VoiceCall: Call document deleted');
              }
            } catch (error) {
              console.log('VoiceCall: Document may have been already deleted:', error);
            }
          }, 2000); // Reducido de 5000 a 2000ms
        } else {
          console.log('VoiceCall: Call document no longer exists');
        }
      } catch (error) {
        console.log('VoiceCall: Error updating call status (document may be deleted):', error);
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
        // Corregir la lógica: enabled debe ser lo opuesto de isMuted
        audioTrack.enabled = isMuted; // Si está muteado, habilitar. Si no está muteado, deshabilitar.
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        console.log('VoiceCall: Mute toggled. New state - muted:', newMuteState, 'track enabled:', audioTrack.enabled);
      } else {
        console.error('VoiceCall: No audio track found for muting');
      }
    } else {
      console.error('VoiceCall: No local stream found for muting');
    }
  };

  const toggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    console.log('VoiceCall: Speaker toggled:', newSpeakerState);
    
    if (remoteAudioRef.current) {
      // Cambiar volumen basado en el estado del speaker
      remoteAudioRef.current.volume = newSpeakerState ? 1.0 : 0.7;
      console.log('VoiceCall: Remote audio volume set to:', remoteAudioRef.current.volume);
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
          autoGainControl: true
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

  const cleanup = () => {
    console.log('VoiceCall: Starting cleanup');
    
    // Detener timers primero para evitar race conditions
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
    
    // Resetear estados
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

  useEffect(() => {
    console.log('VoiceCall: Component mounted', { isIncoming, callId: initialCallId, user: user?.uid });
    
    // Esperar a que el usuario esté disponible
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
      {/* Audio local - siempre muteado para evitar feedback */}
      <audio 
        ref={localAudioRef} 
        muted 
        autoPlay 
        playsInline 
        onLoadedMetadata={() => console.log('🎤 Local audio metadata loaded')}
        onPlay={() => console.log('🎤 Local audio started')}
        onError={(e) => console.error('🎤 Local audio error:', e)}
      />
      
      {/* Audio remoto - para escuchar al otro usuario */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline
        controls={false}
        style={{ display: 'none' }}
        onLoadedMetadata={() => console.log('🎵 Remote audio metadata loaded')}
        onCanPlay={() => console.log('🎵 Remote audio can play')}
        onPlay={() => console.log('🎵 Remote audio started playing')}
        onPause={() => console.log('🎵 Remote audio paused')}
        onError={(e) => console.error('🎵 Remote audio error:', e)}
        onVolumeChange={() => console.log('🎵 Remote audio volume changed:', remoteAudioRef.current?.volume)}
      />
      
      {/* Botón de debug temporal */}
      {callStatus === 'connected' && (
        <button
          onClick={() => {
            console.log('🔍 MANUAL DEBUG CHECK:');
            console.log('🔍 Remote audio ref:', remoteAudioRef.current);
            console.log('🔍 Remote audio srcObject:', remoteAudioRef.current?.srcObject);
            console.log('🔍 Remote audio volume:', remoteAudioRef.current?.volume);
            console.log('🔍 Remote audio muted:', remoteAudioRef.current?.muted);
            console.log('🔍 Remote audio paused:', remoteAudioRef.current?.paused);
            
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play()
                .then(() => console.log('🔍 Manual play successful'))
                .catch(e => console.log('🔍 Manual play failed:', e));
            }
          }}
          className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded z-50"
        >
          Debug Audio
        </button>
      )}
      
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