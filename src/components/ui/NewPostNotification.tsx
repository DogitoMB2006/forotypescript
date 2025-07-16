import type { FC } from 'react';

interface NewPostNotificationProps {
  show: boolean;
  onRefresh: () => void;
}

const NewPostNotification: FC<NewPostNotificationProps> = ({ show, onRefresh }) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 mx-4 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              ¡Hay nuevos posts!
            </p>
            <p className="text-gray-400 text-xs">
              Toca aquí para refrescar la página
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 border border-blue-500"
          >
            Refrescar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPostNotification;