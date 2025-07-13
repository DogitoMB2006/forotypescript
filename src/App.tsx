import { RouterProvider } from 'react-router-dom';
import router from './routes/routes';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationPermissionBanner from './components/ui/NotificationPermissionBanner';

function App() {
  return (
    <NotificationProvider>
      <NotificationPermissionBanner />
      <RouterProvider router={router} />
    </NotificationProvider>
  );
}

export default App;