import { RouterProvider } from 'react-router-dom';
import router from './routes/routes';
import { NotificationProvider } from './contexts/NotificationContext';
import { useRoleChangeListener } from './hooks/useRoleChangeListener';
import NotificationPermissionBanner from './components/ui/NotificationPermissionBanner';
import DevLogModal from './components/moderation/DevLogModal';
import DevLogButton from './components/moderation/DevLogButton';

function AppContent() {
  useRoleChangeListener();
  
  return (
    <>
      <NotificationPermissionBanner />
      <RouterProvider router={router} />
      <DevLogModal />
      <DevLogButton />
    </>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;