import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, MessageSquare, Heart, AtSign } from 'lucide-react';
import type { NotificationToast } from '../../types/notification';
import Avatar from './Avatar';

interface ToastNotificationProps {
  toast: NotificationToast;
  onClose: () => void;
}

const ToastNotification: FC<ToastNotificationProps> = ({ toast, onClose }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Redireccionar según el tipo de notificación
    if (toast.type === 'message' && toast.chatId) {
      navigate(`/chats/${toast.chatId}`);
    } else if (toast.postId) {
      if (toast.commentId) {
        navigate(`/post/${toast.postId}#comment-${toast.commentId}`);
      } else {
        navigate(`/post/${toast.postId}`);
      }
    }
    onClose();
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-green-400" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-400" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-400" />;
      default:
        return <MessageCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'message':
        return 'border-l-emerald-500';
      case 'comment':
        return 'border-l-blue-500';
      case 'reply':
        return 'border-l-green-500';
      case 'like':
        return 'border-l-red-500';
      case 'mention':
        return 'border-l-purple-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTime = () => {
    const now = new Date();
    const diff = now.getTime() - toast.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return toast.timestamp.toLocaleDateString();
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative bg-gray-900 border border-gray-700 ${getBorderColor()} border-l-4
        rounded-lg shadow-2xl p-4 cursor-pointer
        transform transition-all duration-300 hover:scale-105 hover:shadow-xl
        backdrop-blur-sm max-w-sm w-full
        animate-in slide-in-from-right-2 duration-300
      `}
    >
      {/* Botón de cerrar */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-800 transition-colors"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-white" />
      </button>

      <div className="flex items-start space-x-3 pr-6">
        {/* Avatar o icono */}
        <div className="flex-shrink-0 pt-1">
          {toast.avatar ? (
            <Avatar
              src={toast.avatar}
              alt={toast.title}
              name={toast.title}
              size="sm"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
              {getIcon()}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {toast.title}
            </h4>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatTime()}
            </span>
          </div>
          
          <p className="text-sm text-gray-300 break-words line-clamp-2">
            {toast.message}
          </p>

          {/* Indicador del tipo de notificación */}
          <div className="flex items-center mt-2">
            <div className="flex items-center space-x-1">
              {getIcon()}
              <span className="text-xs text-gray-400 capitalize">
                {toast.type === 'message' ? 'Mensaje' : 
                 toast.type === 'comment' ? 'Comentario' :
                 toast.type === 'reply' ? 'Respuesta' :
                 toast.type === 'like' ? 'Me gusta' :
                 toast.type === 'mention' ? 'Mención' : 'Notificación'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso para auto-cerrado */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-lg overflow-hidden">
        <div 
          className={`h-full ${
            toast.type === 'message' ? 'bg-emerald-500' :
            toast.type === 'comment' ? 'bg-blue-500' :
            toast.type === 'reply' ? 'bg-green-500' :
            toast.type === 'like' ? 'bg-red-500' :
            toast.type === 'mention' ? 'bg-purple-500' : 'bg-gray-500'
          } animate-shrink origin-left`}
          style={{ 
            animation: 'shrink 5s linear forwards'
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink 5s linear forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ToastNotification;