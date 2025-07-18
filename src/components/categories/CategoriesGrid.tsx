import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
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
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const mounted = useRef(true);
  const categories = getAllCategories();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const fetchCategoryCounts = async () => {
      if (categories.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const counts: CategoryCount = {};

        const categoryPromises = categories.map(async (category) => {
          try {
            const q = query(
              collection(db, 'posts'),
              where('categoryId', '==', category.id)
            );
            const querySnapshot = await getDocs(q);
            if (mounted.current) {
              counts[category.id] = querySnapshot.size;
            }
          } catch (error) {
            console.error(`Error fetching count for category ${category.id}:`, error);
            if (mounted.current) {
              counts[category.id] = 0;
            }
          }
        });

        await Promise.all(categoryPromises);

        if (mounted.current) {
          try {
            const uncategorizedQuery = query(
              collection(db, 'posts'),
              where('categoryId', 'in', [null, '', undefined])
            );
            const uncategorizedSnapshot = await getDocs(uncategorizedQuery);
            counts['uncategorized'] = uncategorizedSnapshot.size;
          } catch (error) {
            console.error('Error fetching uncategorized posts:', error);
            counts['uncategorized'] = 0;
          }

          setCategoryCounts(counts);
          setRetryCount(0);
        }
      } catch (error) {
        console.error('Error fetching category counts:', error);
        if (mounted.current) {
          setError('Error al cargar las categorías');
          if (retryCount < 3) {
            timeoutId = setTimeout(() => {
              if (mounted.current) {
                setRetryCount(prev => prev + 1);
              }
            }, 1000 * (retryCount + 1));
          }
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    fetchCategoryCounts();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(0);
    setError('');
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="h-8 bg-slate-700/50 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-slate-700/30 rounded w-96 mx-auto animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 sm:p-8 animate-pulse backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700/50 rounded-full"></div>
                <div className="w-16 h-6 bg-slate-700/50 rounded-full"></div>
              </div>
              <div className="space-y-3">
                <div className="h-6 sm:h-8 bg-slate-700/50 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700/30 rounded"></div>
                  <div className="h-4 bg-slate-700/30 rounded w-5/6"></div>
                </div>
                <div className="h-4 bg-slate-700/30 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-8 backdrop-blur-sm max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-red-300 mb-4">{error}</h3>
          <p className="text-red-200/70 mb-6">No se pudieron cargar las categorías después de varios intentos.</p>
          <div className="space-x-4">
            <button
              onClick={handleRetry}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-orange-900/50 border border-orange-500/50 rounded-xl p-6 backdrop-blur-sm max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-orange-300 mb-3">{error}</h3>
          <p className="text-orange-200/70 mb-4">Reintentando... ({retryCount}/3)</p>
          <button
            onClick={handleRetry}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Reintentar ahora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-4">
          Explora por Categorías
        </h2>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Descubre contenido organizado por temas que te interesan
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            postCount={categoryCounts[category.id] || 0}
          />
        ))}
      </div>

      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 sm:p-8 backdrop-blur-sm hover:bg-slate-800/40 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-700/50 to-slate-600/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-slate-600/30">
              <span className="text-2xl sm:text-3xl">📝</span>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-300 mb-1">
                Sin Categoría
              </h3>
              <p className="text-slate-500 text-sm sm:text-base">
                Posts que no han sido categorizados
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent mb-1">
              {categoryCounts['uncategorized'] || 0}
            </div>
            <div className="text-slate-500 text-sm">posts</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center space-x-2 text-slate-400 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Contenido sin clasificar por categoría específica</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesGrid;