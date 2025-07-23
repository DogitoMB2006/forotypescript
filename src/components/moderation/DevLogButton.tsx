import type { FC } from 'react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PostLogs from './PostLogs';

const DevLogButton: FC = () => {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);


  if (!user || user.email !== 'dogitomb2022@gmail.com') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-40"
        title="Crear Dev Log"
      >
        <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {showCreateModal && (
        <PostLogs onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
};

export default DevLogButton;