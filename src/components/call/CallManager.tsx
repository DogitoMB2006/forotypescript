import { useState, forwardRef, useImperativeHandle } from 'react';
import { useIncomingCalls } from '../../hooks/useIncomingCalls';
import VoiceCallComponent from './VoiceCall';
import VoiceChannelComponent from './VoiceChannel';
import IncomingCallNotification from './IncomingCallNotification';

interface CallManagerProps {
  children: React.ReactNode;
}

// Exportar la interfaz correctamente
export interface CallManagerRef {
  startCall: (type: 'voice' | 'video', otherUser: any, chatId: string) => void;
  joinChannel: (otherUser: any, chatId: string) => void;
  resetState: () => void;
}

const CallManager = forwardRef<CallManagerRef, CallManagerProps>(({ children }, ref) => {
  const { incomingCall, clearIncomingCall } = useIncomingCalls();
  const [activeCall, setActiveCall] = useState<{
    type: 'voice' | 'video';
    otherUser: {
      id: string;
      username: string;
      displayName: string;
      profileImage?: string;
    };
    chatId: string;
    isIncoming: boolean;
    callId?: string;
  } | null>(null);

  const [activeChannel, setActiveChannel] = useState<{
    chatId: string;
    otherUser: {
      id: string;
      username: string;
      displayName: string;
      profileImage?: string;
    };
  } | null>(null);

  useImperativeHandle(ref, () => ({
    startCall: (type: 'voice' | 'video', otherUser: any, chatId: string) => {
      console.log('CallManager: Starting call', { type, otherUser, chatId });
      setActiveCall({
        type,
        otherUser,
        chatId,
        isIncoming: false
      });
    },
    joinChannel: (otherUser: any, chatId: string) => {
      console.log('CallManager: Joining channel', { otherUser, chatId });
      setActiveChannel({
        otherUser,
        chatId
      });
    },
    resetState: () => {
      console.log('CallManager: Resetting state');
      setActiveCall(null);
      setActiveChannel(null);
    }
  }));

  const handleAcceptCall = () => {
    if (!incomingCall) return;

    console.log('CallManager: Accepting incoming call', incomingCall.callData.id);
    console.log('CallManager: Setting activeCall state');
    
    const newActiveCall = {
      type: incomingCall.callData.type as 'voice' | 'video',
      otherUser: {
        id: incomingCall.callerInfo.uid,
        username: incomingCall.callerInfo.username,
        displayName: incomingCall.callerInfo.displayName,
        profileImage: incomingCall.callerInfo.profileImageUrl
      },
      chatId: incomingCall.callData.chatId,
      isIncoming: true,
      callId: incomingCall.callData.id
    };
    
    console.log('CallManager: New active call:', newActiveCall);
    setActiveCall(newActiveCall);
    
    console.log('CallManager: Clearing incoming call notification');
    clearIncomingCall();
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    
    console.log('CallManager: Declining incoming call');
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      
      await updateDoc(doc(db, 'calls', incomingCall.callData.id), {
        status: 'declined'
      });
    } catch (error) {
      console.error('Error declining call:', error);
    }
    
    clearIncomingCall();
  };

  const handleCallEnd = () => {
    console.log('CallManager: Call ended, cleaning up');
    setActiveCall(null);
  };

  const handleChannelLeave = () => {
    console.log('CallManager: Channel left, cleaning up');
    setActiveChannel(null);
  };

  console.log('CallManager: Render state', { 
    hasIncomingCall: !!incomingCall, 
    hasActiveCall: !!activeCall, 
    hasActiveChannel: !!activeChannel,
    activeCallType: activeCall?.type,
    activeCallIsIncoming: activeCall?.isIncoming,
    activeCallId: activeCall?.callId
  });

  return (
    <>
      {children}
      
      {incomingCall && !activeCall && (
        <IncomingCallNotification
          callData={incomingCall.callData}
          callerInfo={incomingCall.callerInfo}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {activeCall && (
        <VoiceCallComponent
          otherUser={activeCall.otherUser}
          chatId={activeCall.chatId}
          onCallEnd={handleCallEnd}
          isIncoming={activeCall.isIncoming}
          callId={activeCall.callId || ''}
        />
      )}

      {activeChannel && (
        <VoiceChannelComponent
          chatId={activeChannel.chatId}
          otherUser={activeChannel.otherUser}
          onLeave={handleChannelLeave}
        />
      )}
    </>
  );
});

CallManager.displayName = 'CallManager';

export default CallManager;