import type { FC } from 'react';

interface NewPostAlertProps {
  show: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
}

const NewPostAlert: FC<NewPostAlertProps> = ({ show, onRefresh, onDismiss }) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-slate-800/95 border border-slate-600/50 rounded-xl shadow-2xl p-4 mx-4 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              ¡Hay nuevos posts!
            </p>
            <p className="text-slate-400 text-xs">
              Se han publicado nuevos posts
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <button
              onClick={onRefresh}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Refrescar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPostAlert;