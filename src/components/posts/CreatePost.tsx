import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createPost } from '../../services/postService';
import { getAllCategories } from '../../services/categoryService';
import { getUserProfile } from '../../services/userService';
import type { UserProfile } from '../../services/userService';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreatePost: FC<CreatePostProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const categories = getAllCategories();

  useEffect(() => {
    if (user && isOpen) {
      const fetchUserProfile = async () => {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      fetchUserProfile();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setCategoryId(null);
      setImages([]);
      setImagePreviews([]);
      setError('');
      setShowImageUpload(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleImageUpload = async (files: FileList) => {
    if (images.length + files.length > 5) {
      setError('Máximo 5 imágenes permitidas');
      return;
    }

    setError('');

    try {
      const newFiles = Array.from(files);
      
      for (const file of newFiles) {
        if (!file.type.startsWith('image/')) {
          throw new Error('Solo se permiten archivos de imagen');
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('El archivo debe ser menor a 5MB');
        }
      }

      setImages(prev => [...prev, ...newFiles]);

      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } catch (error: any) {
      setError(error.message || 'Error al procesar las imágenes');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleImageUpload(files);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Título y contenido son obligatorios');
      return;
    }
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
        authorDisplayName: userProfile.displayName,
        categoryId
      });

      setTitle('');
      setContent('');
      setCategoryId(null);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 relative flex flex-col">
          
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>

          <div className="relative bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-b border-slate-700/50 p-4 sm:p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                    Crear Post
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Comparte tus ideas con la comunidad</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-1 sm:p-2 hover:bg-slate-700/50 rounded-lg group"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              
              {userProfile && (
                <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <img
                    src={userProfile.profileImageUrl || '/default-avatar.png'}
                    alt={userProfile.displayName}
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-emerald-400/50"
                  />
                  <div>
                    <p className="font-medium text-slate-200 text-sm sm:text-base">{userProfile.displayName}</p>
                    <p className="text-xs sm:text-sm text-slate-400">@{userProfile.username}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  <span className="flex items-center space-x-2">
                    <span>Título</span>
                    <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="¿Cuál es el tema de tu post?"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  maxLength={100}
                  required
                />
                <div className="flex justify-end">
                  <span className="text-xs text-slate-500">{title.length}/100</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  <span className="flex items-center space-x-2">
                    <span>Contenido</span>
                    <span className="text-red-400">*</span>
                  </span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe aquí tu contenido..."
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 resize-none text-sm sm:text-base leading-relaxed"
                  required
                />
                <div className="flex justify-end">
                  <span className="text-xs text-slate-500">{content.length} caracteres</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Categoría</span>
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setCategoryId(null)}
                    className={`flex flex-col items-center space-y-1 sm:space-y-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      categoryId === null
                        ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-600/50 bg-slate-800/30 text-slate-400 hover:border-slate-500 hover:bg-slate-700/30'
                    }`}
                  >
                    <span className="text-lg sm:text-xl">🏷️</span>
                    <span className="text-xs sm:text-sm font-medium text-center leading-tight">Sin categoría</span>
                  </button>
                  
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      className={`flex flex-col items-center space-y-1 sm:space-y-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                        categoryId === category.id
                          ? `${category.borderColor} ${category.bgColor} ${category.color} shadow-lg`
                          : 'border-slate-600/50 bg-slate-800/30 text-slate-400 hover:border-slate-500 hover:bg-slate-700/30'
                      }`}
                    >
                      <span className="text-lg sm:text-xl">{category.icon}</span>
                      <span className="text-xs sm:text-sm font-medium text-center leading-tight">
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
                
                {categoryId && (() => {
                  const selectedCategory = categories.find(c => c.id === categoryId);
                  return selectedCategory ? (
                    <div className={`p-3 rounded-xl border ${selectedCategory.bgColor} ${selectedCategory.borderColor}`}>
                      <p className={`text-xs sm:text-sm ${selectedCategory.color} font-medium flex items-center space-x-2`}>
                        <span>{selectedCategory.icon}</span>
                        <span>{selectedCategory.description}</span>
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">Imágenes</label>
                  <span className="text-xs text-slate-500">{images.length}/5</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImageUpload(!showImageUpload)}
                      className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-all duration-200 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Agregar imagen</span>
                    </button>
                  </div>

                  {showImageUpload && (
                    <div 
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                        isDragOver 
                          ? 'border-emerald-400 bg-emerald-500/10 scale-105' 
                          : 'border-slate-600/50 hover:border-slate-500/70'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        className="hidden"
                        id="image-upload"
                        disabled={images.length >= 5}
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer block"
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isDragOver 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-slate-700/50 text-slate-400'
                          }`}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {isDragOver ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              )}
                            </svg>
                          </div>
                          <div className={`text-center transition-colors duration-200 ${
                            isDragOver ? 'text-emerald-300' : 'text-slate-400'
                          }`}>
                            <div className="text-sm font-medium mb-1">
                              {isDragOver ? (
                                <>🎯 ¡Suelta las imágenes aquí!</>
                              ) : (
                                <>📁 Click para subir o arrastra imágenes aquí</>
                              )}
                            </div>
                            <div className="text-xs opacity-70">
                              PNG, JPG hasta 5MB (máximo 5 imágenes)
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {imagePreviews.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-16 sm:h-20 object-cover rounded-lg border border-slate-600/50"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="relative bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-t border-slate-700/50 p-3 sm:p-6 flex-shrink-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium transition-all duration-200 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Publicar Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;