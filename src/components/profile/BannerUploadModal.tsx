import type { FC } from 'react';
import { useState } from 'react';
import GifSelector from './GifSelector';

interface BannerUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  onGifSelect: (gifUrl: string) => void;
}

const BannerUploadModal: FC<BannerUploadModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  onGifSelect
}) => {
  const [showGifSelector, setShowGifSelector] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onClose();
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    onGifSelect(gifUrl);
    setShowGifSelector(false);
    onClose();
  };

  if (!isOpen) return null;

  if (showGifSelector) {
    return (
      <GifSelector
        isOpen={true}
        onClose={() => setShowGifSelector(false)}
        onSelectGif={handleGifSelect}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Cambiar Banner</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center space-x-4 p-4 border border-gray-700 rounded-lg hover:border-gray-600 cursor-pointer transition-colors duration-200 group">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">Subir Archivo</h3>
                  <p className="text-gray-400 text-sm">Sube una imagen desde tu dispositivo</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </label>

            <button
              onClick={() => setShowGifSelector(true)}
              className="w-full flex items-center space-x-4 p-4 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors duration-200 group"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10l.94 2.353a1 1 0 01-.94 1.647H6a1 1 0 01-.94-1.647L6 4zM6 8l2 9h8l2-9M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-medium">Elegir GIF</h3>
                <p className="text-gray-400 text-sm">Busca y selecciona un GIF animado</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerUploadModal;