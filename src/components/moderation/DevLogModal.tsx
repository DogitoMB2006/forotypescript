import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { checkForNewDevLog, updateUserDevLogStatus } from '../../services/devLogService';
import { getUserProfile } from '../../services/userService';
import UserModalPostcard from '../posts/UserModalPostcard';
import type { DevLog } from '../../services/devLogService';
import type { UserProfile } from '../../services/userService';

const DevLogModal: FC = () => {
  const { user } = useAuth();
  const [devLog, setDevLog] = useState<DevLog | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalPosition, setUserModalPosition] = useState({ x: 0, y: 0 });

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
    setShowUserModal(false);
  };

  const handleAuthorClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setUserModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setShowUserModal(true);
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
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl border border-slate-700/50 relative">
          
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>

          <div className="sticky top-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-b border-slate-700/50 p-4 sm:p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent leading-tight">
                    {devLog.title}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1 flex items-center space-x-2">
                    <span className="text-emerald-400">📝</span>
                    <span>Dev Log</span>
                    <span>•</span>
                    <span>{formatDate(devLog.createdAt)}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {authorProfile && (
                  <button
                    onClick={handleAuthorClick}
                    className="flex items-center space-x-2 hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200 group"
                  >
                    <div className="relative">
                      <img
                        src={authorProfile.profileImageUrl || '/default-avatar.png'}
                        alt={authorProfile.displayName}
                        className="w-8 h-8 rounded-full object-cover border-2 border-slate-600 group-hover:border-emerald-400 transition-colors duration-200"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border border-slate-800"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-300 hidden sm:block group-hover:text-white transition-colors duration-200">
                      {authorProfile.displayName}
                    </span>
                  </button>
                )}
                
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg group"
                >
                  <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-8">
              
              {devLog.images.length > 0 && (
                <div className="w-full">
                  <div className="relative group">
                    <div className="aspect-video w-full bg-slate-800/50 rounded-xl overflow-hidden shadow-xl border border-slate-700/50">
                      <img
                        src={devLog.images[currentImageIndex]}
                        alt={`Dev Log Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain bg-slate-900/50"
                        loading="lazy"
                      />
                    </div>
                    
                    {devLog.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 backdrop-blur-sm border border-white/20"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={nextImage}
                          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 backdrop-blur-sm border border-white/20"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                          <span className="text-white text-sm font-medium">
                            {currentImageIndex + 1} / {devLog.images.length}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {devLog.images.length > 1 && (
                    <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                      {devLog.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            index === currentImageIndex
                              ? 'border-emerald-500 opacity-100 shadow-lg shadow-emerald-500/25 scale-105'
                              : 'border-slate-600 opacity-60 hover:opacity-80 hover:border-slate-500'
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

              <div className="bg-slate-800/30 rounded-xl p-4 sm:p-6 border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-200">Descripción</h3>
                </div>
                
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm md:text-base break-words">
                  {devLog.content}
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-t border-slate-700/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 text-slate-400 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Presiona ESC para cerrar</span>
              </div>
              
              <button
                onClick={handleClose}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 group"
              >
                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Entendido</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showUserModal && authorProfile && devLog && (
        <UserModalPostcard
          userId={devLog.authorId}
          username={authorProfile.username || authorProfile.displayName}
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          anchorPosition={userModalPosition}
        />
      )}
    </>
  );
};

export default DevLogModal;