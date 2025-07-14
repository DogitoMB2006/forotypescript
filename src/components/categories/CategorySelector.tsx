import type { FC } from 'react';
import { getAllCategories } from '../../services/categoryService';

interface CategorySelectorProps {
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  className?: string;
}

const CategorySelector: FC<CategorySelectorProps> = ({ 
  selectedCategory, 
  onCategorySelect, 
  className = '' 
}) => {
  const categories = getAllCategories();

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <span>Categoría</span>
      </h4>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onCategorySelect(null)}
          className={`flex flex-col items-center space-y-1 sm:space-y-2 p-2 sm:p-3 rounded-lg border transition-all duration-200 ${
            selectedCategory === null
              ? 'border-gray-500 bg-gray-800 text-white'
              : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:bg-gray-800'
          }`}
        >
          <span className="text-lg sm:text-xl">🏷️</span>
          <span className="text-xs sm:text-sm font-medium text-center">Sin categoría</span>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategorySelect(category.id)}
            className={`flex flex-col items-center space-y-1 sm:space-y-2 p-2 sm:p-3 rounded-lg border transition-all duration-200 ${
              selectedCategory === category.id
                ? `${category.borderColor} ${category.bgColor} ${category.color}`
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg sm:text-xl">{category.icon}</span>
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">
              {category.name}
            </span>
          </button>
        ))}
      </div>
      
      {selectedCategory && (
        <div className="mt-2">
          {(() => {
            const category = categories.find(c => c.id === selectedCategory);
            if (!category) return null;
            
            return (
              <div className={`p-2 sm:p-3 rounded-lg ${category.bgColor} ${category.borderColor} border`}>
                <p className={`text-xs sm:text-sm ${category.color} font-medium flex items-center space-x-2`}>
                  <span>{category.icon}</span>
                  <span>{category.description}</span>
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;