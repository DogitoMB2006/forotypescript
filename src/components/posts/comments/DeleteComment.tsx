import type { FC } from 'react';
import { useState } from 'react';

interface DeleteCommentProps {
  onDelete: () => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  isModerationAction?: boolean;
}

const DeleteComment: FC<DeleteCommentProps> = ({ onDelete, isOpen, onClose, isModerationAction = false }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    return isModerationAction ? 'Eliminar Comentario (Moderación)' : 'Eliminar Comentario';
  };

  const getModalIcon = () => {
    if (isModerationAction) {
      return (
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center relative">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
      );
    }

    return (
      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
    );
  };

  const getModalDescription = () => {
    if (isModerationAction) {
      return 'Esta acción eliminará el comentario por motivos de moderación y no se puede deshacer';
    }
    return 'Esta acción no se puede deshacer';
  };

  const getConfirmationText = () => {
    if (isModerationAction) {
      return '¿Estás seguro de que quieres eliminar este comentario? Esta es una acción de moderación y el autor será notificado.';
    }
    return '¿Estás seguro de que quieres eliminar este comentario?';
  };

  const getDeleteButtonText = () => {
    if (isDeleting) {
      return (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Eliminando...</span>
        </div>
      );
    }
    return isModerationAction ? 'Eliminar (Moderación)' : 'Eliminar';
  };

  const getDeleteButtonClass = () => {
    const baseClass = "flex-1 py-2 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed text-white";
    if (isModerationAction) {
      return `${baseClass} bg-red-700 hover:bg-red-800 disabled:bg-red-900`;
    }
    return `${baseClass} bg-red-600 hover:bg-red-700 disabled:bg-red-800`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100 animate-in">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            {getModalIcon()}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{getModalTitle()}</h3>
              <p className="text-sm text-gray-400">{getModalDescription()}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isModerationAction && (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-400 text-sm font-medium">Acción de Moderación</span>
              </div>
              <p className="text-yellow-200 text-xs">
                Este comentario será eliminado por un moderador. El autor puede contactar al equipo de moderación si tiene alguna pregunta.
              </p>
            </div>
          )}

          <p className="text-gray-300 mb-6">
            {getConfirmationText()}
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={getDeleteButtonClass()}
            >
              {getDeleteButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteComment;