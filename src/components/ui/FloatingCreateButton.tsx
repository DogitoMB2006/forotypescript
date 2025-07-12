import type { FC } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface FloatingCreateButtonProps {
  onClick: () => void;
}

const FloatingCreateButton: FC<FloatingCreateButtonProps> = ({ onClick }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transform hover:scale-110 transition-all duration-300 z-40 group"
    >
      <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
};

export default FloatingCreateButton;