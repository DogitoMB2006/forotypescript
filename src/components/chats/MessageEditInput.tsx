import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface MessageEditInputProps {
  initialContent: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  isOwn: boolean;
}

const MessageEditInput: FC<MessageEditInputProps> = ({
  initialContent,
  onSave,
  onCancel,
  isOwn
}) => {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
      
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSave = async () => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent || trimmedContent === initialContent) {
      onCancel();
      return;
    }

    try {
      setSaving(true);
      await onSave(trimmedContent);
    } catch (error) {
      console.error('Error saving edit:', error);
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className={`relative max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg w-full`}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className={`w-full px-3 py-2 rounded-2xl text-sm leading-relaxed resize-none border-2 transition-colors ${
            isOwn
              ? 'bg-emerald-600 text-white border-emerald-500 focus:border-emerald-400'
              : 'bg-gray-800 text-white border-gray-700 focus:border-gray-600'
          } focus:outline-none disabled:opacity-50`}
          placeholder="Escribe tu mensaje..."
          rows={1}
        />
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleSave}
          disabled={saving || !content.trim() || content.trim() === initialContent}
          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-full transition-colors disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={saving}
          className="p-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors disabled:cursor-not-allowed"
        >
          <X className="w-3 h-3" />
        </button>

        <span className="text-xs text-gray-400">
          Enter para guardar • Esc para cancelar
        </span>
      </div>
    </div>
  );
};

export default MessageEditInput;