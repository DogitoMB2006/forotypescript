import { RouterProvider } from 'react-router-dom';
import router from './routes/routes';
import { NotificationProvider } from './contexts/NotificationContext';
import { useRoleChangeListener } from './hooks/useRoleChangeListener';
import NotificationPermissionBanner from './components/ui/NotificationPermissionBanner';

function AppContent() {
  useRoleChangeListener();
  
  return (
    <>
      <NotificationPermissionBanner />
      <RouterProvider router={router} />
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