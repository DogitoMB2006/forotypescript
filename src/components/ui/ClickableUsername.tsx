import type { FC } from 'react';
import { useState } from 'react';
import UserPreviewModal from './UserPreviewModal';

interface ClickableUsernameProps {
  userId: string;
  username: string;
  displayName: string;
  className?: string;
  children: React.ReactNode;
}

const ClickableUsername: FC<ClickableUsernameProps> = ({ 
  userId, 
  username, 
  displayName, 
  className = '', 
  children 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorPosition({
      x: rect.left,
      y: rect.bottom
    });
    setShowPreview(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`hover:underline transition-colors duration-200 ${className}`}
      >
        {children}
      </button>
      
      <UserPreviewModal
        userId={userId}
        username={username}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        anchorPosition={anchorPosition}
      />
    </>
  );
};

export default ClickableUsername;