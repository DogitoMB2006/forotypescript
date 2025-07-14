import type { FC } from 'react';
import { getCategoryById } from '../../services/categoryService';

interface CategoryBadgeProps {
  categoryId: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const CategoryBadge: FC<CategoryBadgeProps> = ({ 
  categoryId, 
  size = 'sm', 
  className = '',
  showIcon = true 
}) => {
  if (!categoryId) return null;
  
  const category = getCategoryById(categoryId);
  if (!category) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <div className={`
      inline-flex items-center space-x-1 rounded-full border font-medium transition-colors duration-200
      ${sizeClasses[size]}
      ${category.color}
      ${category.bgColor}
      ${category.borderColor}
      ${className}
    `}>
      {showIcon && <span className="text-xs">{category.icon}</span>}
      <span>{category.name}</span>
    </div>
  );
};

export default CategoryBadge;