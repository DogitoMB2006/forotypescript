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
          <div className="relative max-w-[200px] sm:max-w-xs">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-700 animate-pulse rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
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
              <p className="mt-1 text-sm">{message.content}</p>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex items-center space-x-2 min-w-[180px] sm:min-w-[200px]">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.768l-4.036-3.228A1 1 0 014 12.768V7.232a1 1 0 01.347-.768l4.036-3.228z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-1">Mensaje de voz</p>
              <audio controls className="w-full" preload="metadata" style={{ height: '32px' }}>
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

  if (isEditing) {
    return (
      <div className={`flex items-end space-x-2 mb-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 ${isOwn ? 'ml-1 order-2' : ''}`}>
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
    <div className={`flex items-end group mb-1 ${isOwn ? 'justify-end' : 'space-x-2'}`}>
      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8">
        {showAvatar && !isOwn && (
          <Avatar
            src={message.senderProfileImage}
            alt={message.senderDisplayName}
            name={message.senderDisplayName}
            size="sm"
          />
        )}
      </div>

      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-sm lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-gray-400 mb-0.5 px-2">
            {message.senderDisplayName}
          </span>
        )}

        <div className="relative flex items-start space-x-1">
          <div
            className={`relative px-3 py-2 rounded-2xl shadow-sm ${
              isOwn
                ? 'bg-emerald-600 text-white rounded-br-md'
                : 'bg-gray-800 text-white rounded-bl-md'
            }`}
          >
            {renderMessageContent()}

            <div className={`flex items-center space-x-1 mt-1 ${
              message.type === 'text' ? 'justify-end' : 'justify-between'
            }`}>
              <span className={`text-xs ${
                isOwn ? 'text-emerald-100' : 'text-gray-400'
              }`}>
                {formatTime(message.createdAt)}
              </span>
              
              {isOwn && (
                <div className="flex items-center ml-1">
                  {message.isRead ? (
                    <CheckCheck className="w-3 h-3 text-emerald-200" />
                  ) : (
                    <Check className="w-3 h-3 text-emerald-300" />
                  )}
                </div>
              )}
            </div>

            {message.isEdited && (
              <span className={`text-xs italic mt-0.5 block ${
                isOwn ? 'text-emerald-200' : 'text-gray-500'
              }`}>
                editado
              </span>
            )}
          </div>

          <MessageContextMenu
            isOwn={isOwn}
            messageContent={message.content || ''}
            messageType={message.type}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCopy={handleCopyText}
          />
        </div>

        {showTimestamp && (
          <div className="flex items-center justify-center w-full my-3">
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