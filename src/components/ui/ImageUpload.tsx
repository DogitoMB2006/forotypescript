import type { FC } from 'react';
import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  disabled?: boolean;
  maxImages?: number;
  currentImages?: string[];
}

const ImageUpload: FC<ImageUploadProps> = ({ 
  onImageUpload, 
  disabled = false, 
  maxImages = 5,
  currentImages = []
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    if (currentImages.length >= maxImages) {
      setError(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const file = files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo debe ser menor a 5MB');
        return;
      }

      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const imageRef = ref(storage, `images/${user.uid}/${fileName}`);

      // Subir archivo
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      onImageUpload(downloadURL);
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const canUploadMore = currentImages.length < maxImages;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || uploading || !canUploadMore}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || !canUploadMore}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-dashed transition-all duration-200
            ${canUploadMore 
              ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300' 
              : 'border-gray-700 text-gray-600 cursor-not-allowed'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin"></div>
              <span className="text-sm">Subiendo...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">
                {canUploadMore ? 'Seleccionar imagen' : `Máximo ${maxImages} imágenes`}
              </span>
            </>
          )}
        </button>
        
        {currentImages.length > 0 && (
          <span className="text-xs text-gray-500">
            {currentImages.length}/{maxImages} imágenes
          </span>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Formatos soportados: JPG, PNG, GIF, WebP</p>
        <p>• Tamaño máximo: 5MB por imagen</p>
        <p>• Máximo {maxImages} imágenes</p>
      </div>
    </div>
  );
};

export default ImageUpload;