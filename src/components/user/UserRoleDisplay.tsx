import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { getUserHighestRole } from '../../services/roleService';
import type { Role } from '../../types/roles';

interface UserRoleDisplayProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const UserRoleDisplay: FC<UserRoleDisplayProps> = ({ 
  userId, 
  size = 'sm', 
  className = '', 
  showTooltip = true 
}) => {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltipState, setShowTooltipState] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const userRole = await getUserHighestRole(userId);
        setRole(userRole);
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-1.5 py-0.5';
      case 'md': return 'text-sm px-2 py-1';
      case 'lg': return 'text-base px-3 py-1.5';
      default: return 'text-xs px-1.5 py-0.5';
    }
  };

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'admin': 
        return 'text-red-400 bg-red-900/30 border-red-500/50';
      case 'moderator': 
        return 'text-blue-400 bg-blue-900/30 border-blue-500/50';
      case 'member': 
        return 'text-gray-400 bg-gray-800/50 border-gray-600/50';
      default: 
        return 'text-gray-400 bg-gray-800/50 border-gray-600/50';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-700 rounded-full ${getSizeClasses()} ${className}`}>
        <span className="opacity-0">Loading</span>
      </div>
    );
  }

  if (!role || role.id === 'member') {
    return null; // No mostrar el rol de miembro por defecto
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => showTooltip && setShowTooltipState(false)}
    >
      <div className={`
        rounded-full border font-medium transition-colors duration-200
        ${getSizeClasses()} 
        ${getRoleColor(role.id)}
      `}>
        {role.displayName}
      </div>
      
      {showTooltip && showTooltipState && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-50 border border-gray-700">
          <div className="font-medium">{role.displayName}</div>
          <div className="text-gray-400">{role.description}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default UserRoleDisplay;