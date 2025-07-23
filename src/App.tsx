import { RouterProvider } from 'react-router-dom';
import { useRef } from 'react';
import router from './routes/routes';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { CallProvider } from './contexts/CallContext';
import CallManager from './components/call/CallManager';
import { useRoleChangeListener } from './hooks/useRoleChangeListener';
import { useChatNotifications } from './hooks/useChatNotifications';
import NotificationPermissionBanner from './components/ui/NotificationPermissionBanner';
import ToastContainer from './components/ui/ToastContainer';
import DevLogModal from './components/moderation/DevLogModal';
import DevLogButton from './components/moderation/DevLogButton';

function AppContent() {
  useRoleChangeListener();
  useChatNotifications();
  
  const callManagerRef = useRef<any>(null);

  const handleStartCall = (type: 'voice' | 'video', otherUser: any, chatId: string) => {
    if (!chatId) {
      console.error('ChatId is required for starting a call');
      return;
    }
    if (callManagerRef.current) {
      callManagerRef.current.startCall(type, otherUser, chatId);
    }
  };

  const handleJoinChannel = (otherUser: any, chatId: string) => {
    if (!chatId) {
      console.error('ChatId is required for joining a channel');
      return;
    }
    if (callManagerRef.current) {
      callManagerRef.current.joinChannel(otherUser, chatId);
    }
  };
  
  return (
    <CallProvider onStartCall={handleStartCall} onJoinChannel={handleJoinChannel}>
      <CallManager ref={callManagerRef}>
        <NotificationPermissionBanner />
        <RouterProvider router={router} />
        <ToastContainer />
        <DevLogModal />
        <DevLogButton />
      </CallManager>
    </CallProvider>
  );
}

function App() {
  return (
    <NotificationProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </NotificationProvider>
  );
}

export default App;