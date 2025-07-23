import type { FC } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import ChatList from '../components/chats/ChatList';

const ChatsPage: FC = () => {
  const { isAuthenticated, loading } = useAuth();

  console.log('ChatsPage: Auth state:', { isAuthenticated, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ChatsPage: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ChatsPage: Authenticated, rendering chat list');

  return (
    <div className="min-h-screen bg-gray-950 pt-16">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: Full width chat list */}
        <div className="block lg:hidden">
          <div className="h-[calc(100vh-4rem)]">
            <ChatList />
          </div>
        </div>

        {/* Desktop: Split layout */}
        <div className="hidden lg:grid lg:grid-cols-3 h-[calc(100vh-4rem)]">
          <div className="lg:col-span-1 border-r border-gray-800">
            <ChatList />
          </div>
          
          <div className="lg:col-span-2 flex items-center justify-center bg-gray-900/50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Selecciona un chat
              </h2>
              <p className="text-gray-400 max-w-md">
                Elige una conversación de la lista para comenzar a chatear, o busca nuevos usuarios para empezar una conversación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;