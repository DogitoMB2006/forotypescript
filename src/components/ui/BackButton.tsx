import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BackButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'floating' | 'inline';
}

const BackButton: FC<BackButtonProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'floating'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const state = location.state as { fromHome?: boolean; scrollPosition?: number } | null;
    
    console.log('BackButton state:', state);
    
    if (state?.fromHome && typeof state.scrollPosition === 'number') {
      console.log('Navegando al home con scroll:', state.scrollPosition);
      const scrollPos = state.scrollPosition;
      navigate('/', { 
        replace: true,
        state: { preserveScroll: true, targetScrollPosition: scrollPos }
      });
    } else if (window.history.length > 1) {
      console.log('Navegando hacia atrás');
      navigate(-1);
    } else {
      console.log('Navegando al home sin scroll');
      navigate('/');
    }
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12', 
    lg: 'w-14 h-14'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={handleBack}
        className={`fixed top-6 left-6 ${sizeClasses[size]} bg-gray-900/90 backdrop-blur-sm hover:bg-gray-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center group z-50 border border-gray-600/50 hover:border-gray-500 ${className}`}
        title="Volver"
      >
        <svg 
          className={`${iconSizes[size]} group-hover:scale-110 transition-transform duration-200`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleBack}
      className={`flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600 group ${className}`}
      title="Volver"
    >
      <svg 
        className={`${iconSizes[size]} group-hover:scale-110 transition-transform duration-200`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span className="font-medium">Volver</span>
    </button>
  );
};

export default BackButton;