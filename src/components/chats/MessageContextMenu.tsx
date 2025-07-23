import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, Copy, MoreVertical } from 'lucide-react';

interface MessageContextMenuProps {
  isOwn: boolean;
  messageContent: string;
  messageType: 'text' | 'image' | 'audio';
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

const MessageContextMenu: FC<MessageContextMenuProps> = ({
  isOwn,
  messageContent,
  messageType,
  onEdit,
  onDelete,
  onCopy
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEdit = () => {
    onEdit();
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      onDelete();
      setIsOpen(false);
    }
  };

  const handleCopy = () => {
    onCopy();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-700 transition-all duration-200 text-gray-400 hover:text-white"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 ${
          isOwn ? 'right-0' : 'left-0'
        }`}>
          {/* Copiar (siempre disponible para texto) */}
          {messageType === 'text' && messageContent && (
            <button
              onClick={handleCopy}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar texto</span>
            </button>
          )}

          {/* Editar (solo para mensajes propios de texto) */}
          {isOwn && messageType === 'text' && (
            <button
              onClick={handleEdit}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Editar</span>
            </button>
          )}

          {/* Eliminar (solo para mensajes propios) */}
          {isOwn && (
            <button
              onClick={handleDelete}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageContextMenu;