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
  const { endCall: resetCallContext } = useCall();
  
  const [callId, setCallId] = useState<string>(initialCallId || '');
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
  const listenerCleanupRef = useRef<(() => void)[]>([]);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.stunprotocol.org:3478' },
      { urls: 'stun:stun.services.mozilla.com' },
      {
        urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: ['turn:relay.metered.ca:80', 'turn:relay.metered.ca:443'],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
        username: 'webrtc',
        credential: 'webrtc'
      },
      {
        urls: 'turn:numb.viagenie.ca',
        username: 'webrtc@live.com',
        credential: 'muazkh'
      }
    ],
    iceCandidatePoolSize: 20,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
    iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    iceGatheringPolicy: 'all' as any
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const showConnectivityError = () => {
    if (document.getElementById('connectivity-error-prompt')) return;
    
    const errorPrompt = document.createElement('div');
    errorPrompt.id = 'connectivity-error-prompt';
    errorPrompt.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #dc2626;
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 16px;
      text-align: center;
      max-width: 400px;
      border: 2px solid #fca5a5;
    `;
    
    errorPrompt.innerHTML = `
      <div style="margin-bottom: 15px; font-size: 24px;">🌐</div>
      <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
        Problema de Conectividad
      </h3>
      <p style="margin: 0 0 15px 0; line-height: 1.5; opacity: 0.9;">
        No se pudo establecer conexión de audio entre diferentes redes. 
        Esto es común con servidores TURN gratuitos.
      </p>
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: #dc2626;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
      ">
        Entendido
      </button>
    `;
    
    document.body.appendChild(errorPrompt);
    
    setTimeout(() => {
      if (document.body.contains(errorPrompt)) {
        document.body.removeChild(errorPrompt);
      }
    }, 10000);
  };

  const showAudioActivationPrompt = () => {
    if (document.getElementById('audio-activation-prompt')) return;
    
    const prompt = document.createElement('div');
    prompt.id = 'audio-activation-prompt';
    prompt.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      animation: slideDown 0.3s ease-out;
    `;
    
    prompt.innerHTML = `🔊 Hacer clic para activar audio de la llamada`;
    
    prompt.onclick = async () => {
      try {
        if (remoteAudioRef.current) {
          await remoteAudioRef.current.play();
          console.log('VoiceCall: ✅ Audio activated by user interaction');
          document.body.removeChild(prompt);
        }
      } catch (error) {
        console.error('VoiceCall: Failed to activate audio:', error);
      }
    };
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(prompt);
    
    setTimeout(() => {
      if (document.body.contains(prompt)) {
        document.body.removeChild(prompt);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 15000);
  };

  const checkAndForceAudio = () => {
    console.log('VoiceCall: 🔍 Checking audio status...');
    
    if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
      const stream = remoteAudioRef.current.srcObject as MediaStream;
      const audioTracks = stream.getAudioTracks();
      
      console.log('VoiceCall: Audio tracks found:', audioTracks.length);
      
      audioTracks.forEach((track, index) => {
        console.log(`VoiceCall: Track ${index}:`, {
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          label: track.label
        });
      });
      
      const audioElement = remoteAudioRef.current;
      console.log('VoiceCall: Audio element state:', {
        paused: audioElement.paused,
        volume: audioElement.volume,
        muted: audioElement.muted,
        currentTime: audioElement.currentTime,
        duration: audioElement.duration,
        readyState: audioElement.readyState
      });
      
      if (audioElement.paused) {
        console.log('VoiceCall: 🔄 Audio is paused, attempting to play...');
        audioElement.play()
          .then(() => {
            console.log('VoiceCall: ✅ Audio resumed successfully');
          })
          .catch(error => {
            console.error('VoiceCall: ❌ Failed to resume audio:', error);
            showAudioActivationPrompt();
          });
      } else {
        console.log('VoiceCall: ✅ Audio is already playing');
      }
      
      if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
        console.log('VoiceCall: ✅ Audio track is live and ready');
      } else {
        console.log('VoiceCall: ⚠️ Audio track may not be ready');
      }
    } else {
      console.log('VoiceCall: ❌ No remote audio stream found');
    }
  };

  const initializeWebRTC = async () => {
    try {
      console.log('VoiceCall: Initializing WebRTC for production');
      
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }
      
      peerConnectionRef.current = new RTCPeerConnection(servers);
      console.log('VoiceCall: Peer connection created with enhanced config');
      
      console.log('VoiceCall: Requesting microphone with enhanced constraints');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          sampleSize: 16,
          channelCount: 1,
          latency: 0.01,
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

      console.log('VoiceCall: Adding tracks with enhanced parameters');
      stream.getTracks().forEach(track => {
        if (peerConnectionRef.current && track.kind === 'audio') {
          const sender = peerConnectionRef.current.addTrack(track, stream);
          console.log('VoiceCall: Added audio track with sender:', sender);
          
          if (sender.getParameters) {
            const params = sender.getParameters();
            if (params.encodings && params.encodings.length > 0) {
              params.encodings[0].maxBitrate = 64000;
              params.encodings[0].priority = 'high';
              sender.setParameters(params).catch(e => 
                console.warn('Could not set encoding parameters:', e)
              );
            }
          }
        }
      });

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
        localAudioRef.current.volume = 0;
      }

      console.log('VoiceCall: Setting up enhanced event handlers');
      
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection es null después de crear');
      }

      peerConnectionRef.current.ontrack = (event) => {
        console.log('VoiceCall: Received remote track:', event.track.kind, event.track.readyState);
        
        if (event.track.kind === 'audio') {
          const [remoteStream] = event.streams;
          console.log('VoiceCall: Setting up remote audio stream');
          
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.volume = 1.0;
            
            const attemptPlay = async () => {
              try {
                console.log('VoiceCall: Attempting to play remote audio...');
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.volume = 1.0;
                  await remoteAudioRef.current.play();
                  console.log('VoiceCall: ✅ Remote audio started playing successfully');
                }
              } catch (error) {
                console.error('VoiceCall: ❌ Auto-play failed:', error);
                showAudioActivationPrompt();
              }
            };
            
            attemptPlay();
            
            remoteAudioRef.current.onloadedmetadata = () => {
              console.log('VoiceCall: Remote audio metadata loaded');
              attemptPlay();
            };
            
            remoteAudioRef.current.oncanplay = () => {
              console.log('VoiceCall: Remote audio can play');
              attemptPlay();
            };
          }
          
          event.track.onended = () => {
            console.log('VoiceCall: Remote track ended');
          };
          
          event.track.onmute = () => {
            console.log('VoiceCall: Remote track muted');
          };
          
          event.track.onunmute = () => {
            console.log('VoiceCall: Remote track unmuted');
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play().catch(e => 
                console.error('Play on unmute failed:', e)
              );
            }
          };
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && callId) {
          console.log('VoiceCall: ICE candidate generated:', event.candidate.type);
          addIceCandidate(callId, event.candidate);
        } else if (!event.candidate) {
          console.log('VoiceCall: ICE gathering completed');
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const state = peerConnectionRef.current.connectionState;
          console.log('VoiceCall: Connection state changed:', state);
          
          if (state === 'connected') {
            console.log('VoiceCall: Peer connection established successfully');
            setCallStatus('connected');
            startCallTimer();
            startHeartbeat();
            
            setTimeout(() => {
              checkAndForceAudio();
            }, 1000);
            
          } else if (state === 'disconnected') {
            console.log('VoiceCall: Connection disconnected, attempting reconnection');
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

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const iceState = peerConnectionRef.current.iceConnectionState;
          const connectionState = peerConnectionRef.current.connectionState;
          console.log('VoiceCall: 🧊 ICE connection state:', iceState);
          console.log('VoiceCall: 🔗 Connection state:', connectionState);
          
          if (iceState === 'checking') {
            console.log('VoiceCall: 🔍 Trying to establish connection through NAT/Firewall...');
          } else if (iceState === 'connected') {
            console.log('VoiceCall: ✅ ICE connection established successfully!');
          } else if (iceState === 'completed') {
            console.log('VoiceCall: 🎉 ICE connection completed - optimal path found!');
          } else if (iceState === 'failed') {
            console.log('VoiceCall: ❌ ICE connection failed - NAT/Firewall traversal failed');
            console.log('VoiceCall: 💡 This usually means TURN servers are not working properly');
            
            showConnectivityError();
            
            console.log('VoiceCall: 🔄 Attempting ICE restart...');
            peerConnectionRef.current.restartIce();
          } else if (iceState === 'disconnected') {
            console.log('VoiceCall: ⚠️ ICE connection temporarily lost - attempting to reconnect...');
          }
        }
      };

      console.log('VoiceCall: WebRTC initialization completed successfully');

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      throw error;
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
    const existingListener = listenerCleanupRef.current.find((cleanup: any) => cleanup.toString().includes(callDocId));
    if (existingListener) {
      console.log('VoiceCall: ICE listener already exists for this call');
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'calls', callDocId), (snapshot) => {
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

    listenerCleanupRef.current.push(unsubscribe);
  };

  const handleOutgoingWebRTC = async (callDocId: string) => {
    if (!peerConnectionRef.current) return;

    try {
      console.log('VoiceCall: Setting up outgoing WebRTC connection');
      
      setupICECandidateListener(callDocId);
      
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
      
      const unsubscribe = onSnapshot(doc(db, 'calls', callDocId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CallData;
          
          if (data.answer && 
              peerConnectionRef.current && 
              peerConnectionRef.current.signalingState === 'have-local-offer' &&
              !peerConnectionRef.current.remoteDescription) {
            
            console.log('VoiceCall: Received answer, setting remote description (state:', peerConnectionRef.current.signalingState, ')');
            
            peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
              .then(() => {
                console.log('VoiceCall: ✅ Remote description set successfully');
                processQueuedCandidates();
                unsubscribe();
              })
              .catch(error => {
                console.error('VoiceCall: ❌ Error setting remote description:', error);
                console.log('VoiceCall: Current signaling state:', peerConnectionRef.current?.signalingState);
              });
          } else if (data.answer && peerConnectionRef.current?.remoteDescription) {
            console.log('VoiceCall: Answer already processed, ignoring duplicate');
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

      if (peerConnectionRef.current.signalingState !== 'stable') {
        console.log('VoiceCall: Connection not in stable state:', peerConnectionRef.current.signalingState);
        return;
      }

      console.log('VoiceCall: Setting remote description from offer (state:', peerConnectionRef.current.signalingState, ')');
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

  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(async () => {
      if (callId && callStatus === 'connected') {
        try {
          const callDoc = await getDoc(doc(db, 'calls', callId));
          if (callDoc.exists()) {
            await updateDoc(doc(db, 'calls', callId), {
              lastHeartbeat: serverTimestamp()
            });
          } else {
            console.log('VoiceCall: Call document no longer exists, stopping heartbeat');
            stopHeartbeat();
          }
        } catch (error) {
          console.warn('VoiceCall: Heartbeat failed (normal during call end):', error);
          if (callStatus === 'connected') {
            stopHeartbeat();
          }
        }
      }
    }, 30000);
  };

  const cleanup = () => {
    console.log('VoiceCall: Starting cleanup');
    
    stopCallTimer();
    stopHeartbeat();
    
    listenerCleanupRef.current.forEach((unsubscribe: any) => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error cleaning up listener:', error);
      }
    });
    listenerCleanupRef.current = [];
    
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

  const endCall = async () => {
    console.log('VoiceCall: Ending call...');
    
    stopHeartbeat();
    
    if (callId) {
      try {
        const callDoc = await getDoc(doc(db, 'calls', callId));
        if (callDoc.exists()) {
          await updateDoc(doc(db, 'calls', callId), {
            status: 'ended'
          });
          
          setTimeout(async () => {
            try {
              const callDocCheck = await getDoc(doc(db, 'calls', callId));
              if (callDocCheck.exists()) {
                await deleteDoc(doc(db, 'calls', callId));
                console.log('VoiceCall: Call document deleted');
              }
            } catch (error) {
              console.warn('VoiceCall: Could not delete call doc (may have been deleted already):', error);
            }
          }, 5000);
        }
      } catch (error) {
        console.warn('VoiceCall: Error ending call (document may not exist):', error);
      }
    }
    
    cleanup();
    resetCallContext();
    onCallEnd();
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
    resetCallContext();
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
          console.log('VoiceCall: 📡 Remote audio metadata loaded');
          if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.play().catch(e => 
              console.error('Auto-play on metadata failed:', e)
            );
          }
        }}
        onCanPlay={() => {
          console.log('VoiceCall: 🎵 Remote audio can play');
          if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.play().catch(e => 
              console.error('Auto-play on canplay failed:', e)
            );
          }
        }}
        onPlay={() => {
          console.log('VoiceCall: ▶️ Remote audio started playing');
          if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = 1.0;
          }
        }}
        onPause={() => {
          console.log('VoiceCall: ⏸️ Remote audio paused');
        }}
        onVolumeChange={() => {
          console.log('VoiceCall: 🔊 Volume changed to:', remoteAudioRef.current?.volume);
        }}
        onError={(e) => {
          console.error('VoiceCall: 🚨 Remote audio error:', e);
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
            
            <button
              onClick={endCall}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        {callStatus === 'connected' && (
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