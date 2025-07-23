import { RouterProvider } from 'react-router-dom';
import router from './routes/routes';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { useRoleChangeListener } from './hooks/useRoleChangeListener';
import { useChatNotifications } from './hooks/useChatNotifications';
import NotificationPermissionBanner from './components/ui/NotificationPermissionBanner';
import ToastContainer from './components/ui/ToastContainer';
import DevLogModal from './components/moderation/DevLogModal';
import DevLogButton from './components/moderation/DevLogButton';

function AppContent() {
  useRoleChangeListener();
  useChatNotifications();
  
  return (
    <>
      <NotificationPermissionBanner />
      <RouterProvider router={router} />
      <ToastContainer />
      <DevLogModal />
      <DevLogButton />
    </>
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