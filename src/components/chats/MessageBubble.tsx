import type { FC } from 'react';
import { useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '../../types/chat';
import Avatar from '../ui/Avatar';
import MessageContextMenu from './MessageContextMenu';
import MessageEditInput from './MessageEditInput';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageBubble: FC<MessageBubbleProps> = ({ 
  message, 
  isOwn, 
  showAvatar, 
  showTimestamp,
  onEdit,
  onDelete
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async (newContent: string) => {
    try {
      await onEdit(message.id, newContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing message:', error);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await onDelete(message.id);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleCopyText = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative max-w-xs">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-700 animate-pulse rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={message.fileUrl}
              alt="Imagen"
              className={`rounded-lg max-w-full h-auto cursor-pointer transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.error('Error loading image:', message.fileUrl);
                setImageLoaded(true);
              }}
              onClick={() => window.open(message.fileUrl, '_blank')}
              loading="lazy"
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex items-center space-x-3 min-w-[200px]">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.768l-4.036-3.228A1 1 0 014 12.768V7.232a1 1 0 01.347-.768l4.036-3.228z" clipRule="evenodd" />
                <path d="M14.657 2.929a1 1 0 111.414 1.414A8.971 8.971 0 0118 10a8.971 8.971 0 01-1.929 5.657 1 1 0 11-1.414-1.414A6.971 6.971 0 0016 10a6.971 6.971 0 00-1.343-4.243z" />
                <path d="M12.828 5.757a1 1 0 111.415 1.415A4.978 4.978 0 0115 10a4.978 4.978 0 01-.757 2.828 1 1 0 11-1.415-1.415A2.978 2.978 0 0013 10a2.978 2.978 0 00-.172-1.828z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Mensaje de voz</p>
              <audio controls className="w-full mt-1" preload="metadata">
                <source src={message.fileUrl} type="audio/mpeg" />
                Tu navegador no soporta audio.
              </audio>
            </div>
          </div>
        );
      
      default:
        return (
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </p>
        );
    }
  };

  // Si está en modo edición, mostrar el input de edición
  if (isEditing) {
    return (
      <div className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8">
          {showAvatar && !isOwn && (
            <Avatar
              src={message.senderProfileImage}
              alt={message.senderDisplayName}
              name={message.senderDisplayName}
              size="sm"
            />
          )}
        </div>
        
        <MessageEditInput
          initialContent={message.content || ''}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          isOwn={isOwn}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-end space-x-2 group ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8">
        {showAvatar && !isOwn && (
          <Avatar
            src={message.senderProfileImage}
            alt={message.senderDisplayName}
            name={message.senderDisplayName}
            size="sm"
          />
        )}
      </div>

      {/* Message container */}
      <div className={`flex flex-col max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (only for group chats or if not own message) */}
        {!isOwn && showAvatar && (
          <span className="text-xs text-gray-400 mb-1 px-3">
            {message.senderDisplayName}
          </span>
        )}

        {/* Message bubble with context menu */}
        <div className="relative flex items-start space-x-2">
          <div
            className={`relative px-3 py-2 rounded-2xl shadow-sm ${
              isOwn
                ? 'bg-emerald-600 text-white rounded-br-md'
                : 'bg-gray-800 text-white rounded-bl-md'
            }`}
          >
            {renderMessageContent()}

            {/* Message status and time */}
            <div className={`flex items-center space-x-1 mt-1 ${
              message.type === 'text' ? 'justify-end' : 'justify-between'
            }`}>
              <span className={`text-xs ${
                isOwn ? 'text-emerald-100' : 'text-gray-400'
              }`}>
                {formatTime(message.createdAt)}
              </span>
              
              {isOwn && (
                <div className="flex items-center">
                  {message.isRead ? (
                    <CheckCheck className="w-3 h-3 text-emerald-200" />
                  ) : (
                    <Check className="w-3 h-3 text-emerald-300" />
                  )}
                </div>
              )}
            </div>

            {/* Edited indicator */}
            {message.isEdited && (
              <span className={`text-xs italic mt-1 block ${
                isOwn ? 'text-emerald-200' : 'text-gray-500'
              }`}>
                editado
              </span>
            )}
          </div>

          {/* Context Menu */}
          <MessageContextMenu
            isOwn={isOwn}
            messageContent={message.content || ''}
            messageType={message.type}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCopy={handleCopyText}
          />
        </div>

        {/* Timestamp for message groups */}
        {showTimestamp && (
          <div className="flex items-center justify-center w-full my-4">
            <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
              {formatDate(message.createdAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;