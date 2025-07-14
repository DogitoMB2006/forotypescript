import type { FC } from 'react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createPost } from '../../services/postService';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreatePost: FC<CreatePostProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      setError('Máximo 5 imágenes permitidas');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const processContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (!user || !userProfile) return;

    setIsSubmitting(true);
    setError('');

    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        images,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName
      });

      setTitle('');
      setContent('');
      setImages([]);
      setImagePreviews([]);
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
        navigate('/');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Error al crear el post. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            {userProfile?.profileImageUrl ? (
              <img
                src={userProfile.profileImageUrl}
                alt={userProfile.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {userProfile?.displayName?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">Crear Post</h3>
              <p className="text-sm text-gray-400">@{userProfile?.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors duration-200 hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-900/50 border border-red-500 rounded-md text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Título del post..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg sm:text-xl font-semibold bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none"
                  maxLength={150}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {title.length}/150
                </div>
              </div>

              <div>
                <textarea
                  placeholder="¿Qué está pasando?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-24 sm:h-32 bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none text-base sm:text-lg"
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {content.length}/500
                </div>
              </div>

              {content && (
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Vista previa:</h4>
                  <div className="text-gray-200 whitespace-pre-wrap text-sm sm:text-base">
                    {processContent(content)}
                  </div>
                </div>
              )}

              {imagePreviews.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Imágenes adjuntas:</h4>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-800 bg-gray-900/50 flex-shrink-0">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 order-2 sm:order-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 5}
                  className="flex items-center space-x-1 sm:space-x-2 text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-blue-900/20"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs sm:text-sm">Imagen ({images.length}/5)</span>
                </button>

                <button
                  type="button"
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-gray-300 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-gray-800"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10l.94 2.09A1 1 0 0118 7H6a1 1 0 01-.94-.91L6 4zm0 0l-.5 2.5M18 4l.5 2.5M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-xs sm:text-sm hidden sm:inline">Encuesta</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!title.trim() || !content.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 order-1 sm:order-2 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Publicando...</span>
                  </div>
                ) : (
                  'Publicar'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;