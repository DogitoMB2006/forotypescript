import type { FC } from 'react';
import { useState, useRef, useCallback } from 'react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedFile: File) => void;
  imageUrl: string;
  aspectRatio?: number;
  title: string;
}

const ImageCropModal: FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  onCrop,
  imageUrl,
  aspectRatio = 1,
  title
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCrop = async () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const img = imageRef.current;

    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    const displayWidth = img.offsetWidth * scale;
    const displayHeight = img.offsetHeight * scale;

    const scaleX = imgWidth / displayWidth;
    const scaleY = imgHeight / displayHeight;

    const sourceX = Math.max(0, -position.x * scaleX);
    const sourceY = Math.max(0, -position.y * scaleY);
    const sourceWidth = Math.min(imgWidth, containerRect.width * scaleX);
    const sourceHeight = Math.min(imgHeight, containerRect.height * scaleY);

    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        onCrop(croppedFile);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  const resetCrop = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{title}</h2>
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

        <div className="p-6">
          <div 
            ref={containerRef}
            className={`relative mx-auto border-2 border-dashed border-gray-600 overflow-hidden cursor-move select-none ${
              aspectRatio === 16/9 ? 'w-96 h-54' : aspectRatio === 1 ? 'w-64 h-64' : 'w-80 h-80'
            }`}
            style={{ aspectRatio }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="absolute object-cover pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                minWidth: '100%',
                minHeight: '100%'
              }}
              draggable={false}
            />
            
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"></div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Zoom: {Math.round(scale * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div className="text-sm text-gray-400">
              <p>• Arrastra la imagen para posicionarla</p>
              <p>• Usa el control deslizante para hacer zoom</p>
              <p>• El área resaltada será la imagen final</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={resetCrop}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Resetear
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrop}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;