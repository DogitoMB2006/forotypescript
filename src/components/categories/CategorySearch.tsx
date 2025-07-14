import type { FC } from 'react';
import { useState } from 'react';

interface CategorySearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

const CategorySearch: FC<CategorySearchProps> = ({ 
  onSearch, 
  placeholder = "Buscar en categorías...",
  className = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className={`relative max-w-md mx-auto ${className}`}>
      <div className={`
        relative flex items-center transition-all duration-200
        ${isFocused ? 'scale-105' : 'scale-100'}
      `}>
        <div className="absolute left-3 z-10">
          <svg 
            className={`w-5 h-5 transition-colors duration-200 ${
              isFocused ? 'text-blue-400' : 'text-gray-400'
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-12 py-3 sm:py-4 
            bg-gray-900 border border-gray-700 rounded-xl
            text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
            text-sm sm:text-base
            ${isFocused ? 'bg-gray-800 shadow-lg' : 'hover:bg-gray-800'}
          `}
        />
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 p-1 text-gray-400 hover:text-white transition-colors duration-200 rounded-full hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
          <div className="p-3">
            <div className="text-xs text-gray-400 mb-2 font-medium">Consejos de búsqueda:</div>
            <div className="space-y-1 text-xs text-gray-500">
              <div>• Busca por título o contenido del post</div>
              <div>• Usa palabras clave específicas</div>
              <div>• La búsqueda no distingue mayúsculas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySearch;