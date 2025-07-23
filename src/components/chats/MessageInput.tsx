import type { FC } from 'react';
import { useState, useRef } from 'react';
import { Send, Mic, X, Paperclip } from 'lucide-react';
import { uploadChatFile, validateChatFile } from '../../services/chatFileService';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'audio', fileUrl?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  chatId: string;
}

const MessageInput: FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Escribe un mensaje...",
  chatId 
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || disabled || uploading) return;

    try {
      setUploading(true);
      setUploadError(null);

      if (selectedFile) {
        console.log('MessageInput: Uploading file:', selectedFile.name);
        
        // Generar un ID temporal para el mensaje (se reemplazará por el real)
        const tempMessageId = `temp_${Date.now()}`;
        
        // Subir archivo a Firebase Storage
        const fileUrl = await uploadChatFile(selectedFile, chatId, tempMessageId);
        console.log('MessageInput: File uploaded, URL:', fileUrl);
        
        const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'audio';
        
        await onSendMessage(message.trim(), fileType, fileUrl);
        
        // Limpiar archivo
        setSelectedFile(null);
        setFilePreview(null);
      } else {
        await onSendMessage(message.trim());
      }

      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setUploadError('Error al enviar el archivo. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('MessageInput: File selected:', file);
    setUploadError(null);

    // Validar archivo
    const validation = validateChatFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Archivo no válido');
      return;
    }

    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4">
      {/* Error message */}
      {uploadError && (
        <div className="mb-3 p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">{uploadError}</p>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {filePreview ? (
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Mic className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-white text-sm font-medium truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-gray-400 text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-3">
        {/* File attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || uploading}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 resize-none max-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || disabled || uploading}
          className="flex-shrink-0 p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white rounded-full transition-colors disabled:cursor-not-allowed touch-manipulation"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;