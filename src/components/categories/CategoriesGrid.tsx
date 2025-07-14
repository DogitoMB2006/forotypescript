import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getAllCategories } from '../../services/categoryService';
import CategoryCard from './CategoryCard';

interface CategoryCount {
  [categoryId: string]: number;
}

const CategoriesGrid: FC = () => {
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount>({});
  const [loading, setLoading] = useState(true);
  const categories = getAllCategories();

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const counts: CategoryCount = {};
        
        for (const category of categories) {
          const q = query(
            collection(db, 'posts'),
            where('categoryId', '==', category.id)
          );
          const querySnapshot = await getDocs(q);
          counts[category.id] = querySnapshot.size;
        }
        
        const uncategorizedQuery = query(
          collection(db, 'posts'),
          where('categoryId', 'in', [null, ''])
        );
        const uncategorizedSnapshot = await getDocs(uncategorizedQuery);
        counts['uncategorized'] = uncategorizedSnapshot.size;
        
        setCategoryCounts(counts);
      } catch (error) {
        console.error('Error fetching category counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryCounts();
  }, [categories]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-6 sm:p-8 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-full"></div>
              <div className="w-16 h-6 bg-gray-700 rounded-full"></div>
            </div>
            <div className="h-6 sm:h-8 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Explora por Categorías
        </h2>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
          Descubre contenido organizado por temas que te interesan
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            postCount={categoryCounts[category.id] || 0}
          />
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">📝</span>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-300 mb-1">
                Sin Categoría
              </h3>
              <p className="text-gray-500 text-sm sm:text-base">
                Posts que no han sido categorizados
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold text-gray-400 mb-1">
              {categoryCounts['uncategorized'] || 0}
            </div>
            <div className="text-gray-500 text-sm">posts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesGrid;