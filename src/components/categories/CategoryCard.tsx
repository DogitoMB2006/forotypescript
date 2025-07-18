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
        hover:scale-105 hover:shadow-2xl cursor-pointer backdrop-blur-sm
        ${category.borderColor} ${category.bgColor}
        hover:shadow-${category.color.split('-')[1]}-500/25
      `}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 group-hover:to-black/20 transition-all duration-300"></div>
        
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className={`
              w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
              bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border border-white/10
              group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
              shadow-lg group-hover:shadow-xl
            `}>
              <span className="text-2xl sm:text-3xl transform group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
            </div>
            
            <div className={`
              px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold
              bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-sm border border-white/20 ${category.color}
              group-hover:from-white/20 group-hover:to-white/10 transition-all duration-300
            `}>
              {postCount} posts
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className={`text-xl sm:text-2xl font-bold ${category.color} group-hover:scale-105 transition-transform duration-300 origin-left`}>
              {category.name}
            </h3>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
              {category.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-300 transition-all duration-300 mt-6 opacity-75 group-hover:opacity-100">
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-sm font-medium">Explorar categoría</span>
          </div>
        </div>
        
        <div className={`
          absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 
          transition-transform duration-500 origin-left
          bg-gradient-to-r ${category.color.replace('text-', 'from-')} to-transparent
        `}></div>
        
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700 opacity-0 group-hover:opacity-100"></div>
      </div>
    </Link>
  );
};

export default CategoryCard;