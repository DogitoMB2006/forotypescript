import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { checkForNewDevLog, updateUserDevLogStatus } from '../../services/devLogService';
import { getUserProfile } from '../../services/userService';
import UserPreviewModal from '../ui/UserPreviewModal';
import type { DevLog } from '../../services/devLogService';
import type { UserProfile } from '../../services/userService';

const DevLogModal: FC = () => {
  const { user } = useAuth();
  const [devLog, setDevLog] = useState<DevLog | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [showUserPreview, setShowUserPreview] = useState(false);
  const [userPreviewPosition, setUserPreviewPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!user) return;

    const checkForNewDevLogs = async () => {
      try {
        const newDevLog = await checkForNewDevLog(user.uid);
        if (newDevLog) {
          setDevLog(newDevLog);
          setIsOpen(true);
          
        
          const profile = await getUserProfile(newDevLog.authorId);
          setAuthorProfile(profile);
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
    setAuthorProfile(null);
    setShowUserPreview(false);
  };

  const handleAuthorClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setUserPreviewPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setShowUserPreview(true);
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
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-700/50">
    
          <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{devLog.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">Dev Log • {formatDate(devLog.createdAt)}</p>
                </div>
              </div>
              
         
              <div className="flex items-center space-x-3">
                {authorProfile && (
                  <button
                    onClick={handleAuthorClick}
                    className="flex items-center space-x-2 hover:bg-gray-700/50 rounded-lg p-2 transition-colors duration-200"
                  >
                    <img
                      src={authorProfile.profileImageUrl || '/default-avatar.png'}
                      alt={authorProfile.displayName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-300 hidden sm:block">
                      {authorProfile.displayName}
                    </span>
                  </button>
                )}
                
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

     
          <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
            <div className="p-4 sm:p-6 space-y-6">
           
              {devLog.images.length > 0 && (
                <div className="w-full">
                  <div className="relative group">
                    <div className="aspect-video w-full bg-gray-800 rounded-xl overflow-hidden shadow-xl">
                      <img
                        src={devLog.images[currentImageIndex]}
                        alt={`Dev Log Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain bg-gray-900"
                        loading="lazy"
                      />
                    </div>
                    
                    {devLog.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={nextImage}
                          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                    
                        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/60 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm">
                          {currentImageIndex + 1} / {devLog.images.length}
                        </div>
                  
                        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {devLog.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                                index === currentImageIndex 
                                  ? 'bg-white scale-110' 
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                
                  {devLog.images.length > 1 && (
                    <div className="flex space-x-2 mt-3 overflow-x-auto pb-2 sm:hidden">
                      {devLog.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            index === currentImageIndex
                              ? 'border-red-500 opacity-100'
                              : 'border-gray-600 opacity-60 hover:opacity-80'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

         
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base sm:text-lg">
                  {devLog.content}
                </div>
              </div>
            </div>
          </div>

     
          <div className="sticky bottom-0 bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700/50 p-4 sm:p-6">
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
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

   
      {showUserPreview && authorProfile && (
        <UserPreviewModal
          userId={devLog.authorId}
          username={authorProfile.displayName}
          isOpen={showUserPreview}
          onClose={() => setShowUserPreview(false)}
          anchorPosition={userPreviewPosition}
        />
      )}
    </>
  );
};

export default DevLogModal;