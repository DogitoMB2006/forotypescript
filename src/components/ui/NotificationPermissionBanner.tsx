import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { notificationPermissionService } from '../../services/notificationPermissionService';

const NotificationPermissionBanner: FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showArrow, setShowArrow] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const isSupported = notificationPermissionService.isSupported();
      const permission = notificationPermissionService.getPermissionStatus();
      const isDismissed = notificationPermissionService.isPermissionDismissed();

      setIsVisible(
        isSupported && 
        permission === 'default' && 
        !isDismissed
      );
    };

    checkVisibility();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowArrow(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleAllow = async () => {
    setIsLoading(true);
    setShowArrow(false);
    try {
      const permission = await notificationPermissionService.requestPermission();
      if (permission === 'granted') {
        setIsVisible(false);
        await notificationPermissionService.showNotification({
          title: '¡Notificaciones activadas!',
          body: 'Ahora recibirás notificaciones de comentarios y respuestas.',
          icon: '/favicon.ico'
        });
      } else if (permission === 'denied') {
        setIsVisible(false);
        notificationPermissionService.setPermissionDismissed();
        setTimeout(() => {
          setShowArrow(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowArrow(false);
    notificationPermissionService.setPermissionDismissed();
  };

  if (!isVisible) return null;

  return (
    <>
      {showArrow && notificationPermissionService.getPermissionStatus() !== 'denied' && (
        <div className="hidden sm:block fixed top-2 left-2 z-[10001] pointer-events-none">
          <div className="flex items-center space-x-2 animate-bounce">
            <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              Habilita las notificaciones aquí ↗️
            </div>
            <svg className="w-6 h-6 text-yellow-400 transform rotate-45" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 right-0 z-[10000] bg-gradient-to-r from-blue-600 to-purple-600 border-b border-blue-500/30 shadow-lg animate-in slide-in-from-top duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v5m0 0h5m-5 0l5-5" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm sm:text-base truncate">
                  ¡Activa las notificaciones!
                </p>
                <p className="text-blue-100 text-xs sm:text-sm truncate">
                  {notificationPermissionService.getPermissionStatus() === 'denied' 
                    ? 'Ve al icono 🔒 de tu navegador y permite las notificaciones'
                    : 'Recibe alertas cuando alguien comente en tus posts'
                  }
                </p>
              </div>

              <div className="hidden sm:block">
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 ml-3 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white p-1 sm:p-2 rounded-lg transition-colors duration-200 hover:bg-white/10"
                title="Cerrar"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {notificationPermissionService.getPermissionStatus() !== 'denied' && (
                <button
                  onClick={handleAllow}
                  disabled={isLoading}
                  className="bg-white text-blue-600 hover:bg-blue-50 disabled:bg-white/90 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg relative overflow-hidden"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Activando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v5m0 0h5m-5 0l5-5" />
                      </svg>
                      <span>Activar</span>
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {showArrow && notificationPermissionService.getPermissionStatus() !== 'denied' && (
          <div className="hidden sm:block fixed top-2 left-2 z-[10001] pointer-events-none">
            <div className="flex items-center space-x-2 animate-bounce">
              <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Habilita las notificaciones aquí ↗️
              </div>
              <svg className="w-6 h-6 text-yellow-400 transform rotate-45" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPermissionBanner;