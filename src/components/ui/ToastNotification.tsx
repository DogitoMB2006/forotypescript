import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NotificationToast } from '../../types/notification';
import Avatar from './Avatar';

interface ToastNotificationProps {
  toast: NotificationToast;
  onClose: () => void;
}

const ToastNotification: FC<ToastNotificationProps> = ({ toast, onClose }) => {
  const navigate = useNavigate();

  if (!toast || !toast.id) {
    return null;
  }

  const handleClick = () => {
    try {
      if (toast.postId) {
        if (toast.commentId) {
          navigate(`/post/${toast.postId}#comment-${toast.commentId}`);
        } else {
          navigate(`/post/${toast.postId}`);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error navigating:', error);
      onClose();
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'comment':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'reply':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case 'like':
        return (
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case 'mention':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v5m0 0h5m-5 0l5-5" />
          </svg>
        );
    }
  };

  const getDisplayName = () => {
    if (toast.message && typeof toast.message === 'string') {
      const parts = toast.message.split(' ');
      return parts[0] || 'Usuario';
    }
    return 'Usuario';
  };

  return (
    <div 
      className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 sm:p-4 cursor-pointer hover:bg-gray-750 transition-all duration-200 transform hover:scale-105 min-w-0 max-w-sm"
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 relative">
          <Avatar 
            src={toast.avatar || undefined}
            name={getDisplayName()}
            size="md"
          />
          <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1">
            {getIcon()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {toast.title || 'Notificación'}
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-white ml-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2 break-words">
            {toast.message || 'Nueva notificación'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Hace un momento</p>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;