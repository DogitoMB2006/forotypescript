import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../../types/category';

interface CategoryCardProps {
  category: Category;
  postCount?: number;
}

const CategoryCard: FC<CategoryCardProps> = ({ category, postCount = 0 }) => {
  return (
    <Link to={`/categorias/${category.id}`}>
      <div className={`
        group relative overflow-hidden rounded-xl border transition-all duration-300 
        hover:scale-105 hover:shadow-2xl cursor-pointer
        ${category.borderColor} ${category.bgColor}
        hover:shadow-${category.color.split('-')[1]}-500/25
      `}>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
        
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`
              w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
              bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm
              group-hover:scale-110 transition-transform duration-300
            `}>
              <span className="text-2xl sm:text-3xl">{category.icon}</span>
            </div>
            
            <div className={`
              px-3 py-1 rounded-full text-xs sm:text-sm font-medium
              bg-white/10 backdrop-blur-sm ${category.color}
            `}>
              {postCount} posts
            </div>
          </div>
          
          <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${category.color}`}>
            {category.name}
          </h3>
          
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
            {category.description}
          </p>
          
          <div className="flex items-center space-x-2 text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-sm font-medium">Explorar categoría</span>
          </div>
        </div>
        
        <div className={`
          absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 
          transition-transform duration-300 origin-left
          bg-gradient-to-r ${category.color.replace('text-', 'from-')} to-transparent
        `}></div>
      </div>
    </Link>
  );
};

export default CategoryCard;