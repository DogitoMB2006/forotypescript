import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { checkForNewDevLog, updateUserDevLogStatus } from '../../services/devLogService';
import type { DevLog } from '../../services/devLogService';

const DevLogModal: FC = () => {
  const { user } = useAuth();
  const [devLog, setDevLog] = useState<DevLog | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkForNewDevLogs = async () => {
      try {
        const newDevLog = await checkForNewDevLog(user.uid);
        if (newDevLog) {
          setDevLog(newDevLog);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error checking for new dev logs:', error);
      }
    };

    checkForNewDevLogs();
  }, [user]);

  const handleClose = async () => {
    if (devLog && user) {
      await updateUserDevLogStatus(user.uid, devLog.id);
    }
    setIsOpen(false);
    setDevLog(null);
    setCurrentImageIndex(0);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const nextImage = () => {
    if (devLog && devLog.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % devLog.images.length);
    }
  };

  const prevImage = () => {
    if (devLog && devLog.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + devLog.images.length) % devLog.images.length);
    }
  };

  if (!isOpen || !devLog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-red-500/30">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{devLog.title}</h2>
                <p className="text-sm text-gray-400">Dev Log • {formatDate(devLog.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {devLog.images.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <img
                  src={devLog.images[currentImageIndex]}
                  alt={`Dev Log Image ${currentImageIndex + 1}`}
                  className="w-full h-64 object-cover rounded-lg"
                />
                
                {devLog.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {devLog.images.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {devLog.content}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Entendido</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevLogModal;