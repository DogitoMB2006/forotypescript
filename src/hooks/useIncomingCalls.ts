
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { listenForIncomingCalls, type CallData, type CallerInfo } from '../services/callService';

interface IncomingCall {
  callData: CallData;
  callerInfo: CallerInfo;
}

export const useIncomingCalls = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = listenForIncomingCalls(
      user.uid,
      (callData, callerInfo) => {
        setIncomingCall({ callData, callerInfo });
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const clearIncomingCall = () => {
    setIncomingCall(null);
  };

  return {
    incomingCall,
    clearIncomingCall
  };
};