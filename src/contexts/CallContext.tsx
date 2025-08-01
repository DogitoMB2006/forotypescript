import { createContext, useContext, useState } from 'react';

interface CallContextType {
  startVoiceCall: (
    otherUser: {
      id: string;
      username: string;
      displayName: string;
      profileImage?: string;
    },
    chatId: string
  ) => void;
  startVideoCall: (
    otherUser: {
      id: string;
      username: string;
      displayName: string;
      profileImage?: string;
    },
    chatId: string
  ) => void;
  joinVoiceChannel: (
    otherUser: {
      id: string;
      username: string;
      displayName: string;
      profileImage?: string;
    },
    chatId: string
  ) => void;
  endCall: () => void;
  isInCall: boolean;
  isInChannel: boolean;
}

const CallContext = createContext<CallContextType | null>(null);

interface CallProviderProps {
  children: any;
  onStartCall: any;
  onJoinChannel: any;
}

export const CallProvider = ({ children, onStartCall, onJoinChannel }: CallProviderProps) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isInChannel, setIsInChannel] = useState(false);

  const startVoiceCall = (
    otherUser: {
      id: string;
      username: string;
      displayName: string;
      profileImage?: string;
    },
    chatId: string
  ) => {
    console.log('CallContext: Starting voice call');
    setIsInCall(true);
    onStartCall('voice', otherUser, chatId);
  };

  const startVideoCall = (
    otherUser: {
      id: string;
      username: string;
      displayName: string;
      profileImage?: string;
    },
    chatId: string
  ) => {
    console.log('CallContext: Starting video call');
    setIsInCall(true);
    onStartCall('video', otherUser, chatId);
  };

  const joinVoiceChannel = (
    otherUser: {
      id: string;
      username: string;
      displayName: string;
      profileImage?: string;
    },
    chatId: string
  ) => {
    console.log('CallContext: Joining voice channel');
    setIsInChannel(true);
    onJoinChannel(otherUser, chatId);
  };

  const endCall = () => {
    console.log('CallContext: Ending call, resetting states');
    setIsInCall(false);
    setIsInChannel(false);
  };

  const value: CallContextType = {
    startVoiceCall,
    startVideoCall,
    joinVoiceChannel,
    endCall,
    isInCall,
    isInChannel
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};