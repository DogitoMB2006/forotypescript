import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCategoryById } from '../services/categoryService';
import type { Post } from '../services/postService';
import PostCard from '../components/posts/PostCard';
import CategorySearch from '../components/categories/CategorySearch';

const CategoryDetail: FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);

  const category = categoryId ? getCategoryById(categoryId) : null;

  useEffect(() => {
    if (initialLoad) {
      window.scrollTo(0, 0);
      setInitialLoad(false);
    }
  }, [initialLoad]);

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      if (!categoryId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const q = query(
          collection(db, 'posts'),
          where('categoryId', '==', categoryId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const categoryPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Post));

        setPosts(categoryPosts);
        setFilteredPosts(categoryPosts);
        setRetryCount(0);
      } catch (error) {
        console.error('Error fetching category posts:', error);
        setError('Error al cargar los posts de esta categoría');
        
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPosts();
  }, [categoryId, retryCount]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.authorDisplayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredPosts(filtered);
  }, [searchTerm, posts]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    setFilteredPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError('');
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-950 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-emerald-900/5 to-cyan-900/10 pointer-events-none"></div>
        <div className="relative container mx-auto px-4 max-w-4xl">
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-8 text-center backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-red-300 mb-4">Categoría no encontrada</h2>
            <button 
              onClick={() => navigate('/categorias')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Volver a categorías
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <div className="min-h-screen bg-slate-950 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-emerald-900/5 to-cyan-900/10 pointer-events-none"></div>
        <div className="relative container mx-auto px-4 max-w-4xl">
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-8 text-center backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-red-300 mb-4">{error}</h2>
            <div className="space-x-4">
              <button 
                onClick={handleRetry}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Reintentar
              </button>
              <button 
                onClick={() => navigate('/categorias')}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Volver a categorías
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 sm:py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-emerald-900/5 to-cyan-900/10 pointer-events-none"></div>
      
      <div className="relative container mx-auto px-3 sm:px-4 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <button 
            onClick={() => navigate('/categorias')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors duration-200 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver a categorías</span>
          </button>

          <div className={`
            flex items-center space-x-4 p-6 rounded-xl border backdrop-blur-sm
            ${category.bgColor} ${category.borderColor}
          `}>
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="text-3xl">{category.icon}</span>
            </div>
            <div className="flex-1">
              <h1 className={`text-2xl sm:text-3xl font-bold ${category.color} mb-2`}>
                {category.name}
              </h1>
              <p className="text-slate-300 text-base sm:text-lg mb-2">
                {category.description}
              </p>
              <div className={`text-sm ${category.color}`}>
                {loading ? 'Cargando...' : `${posts.length} post${posts.length !== 1 ? 's' : ''} en esta categoría`}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <CategorySearch
            onSearch={handleSearch}
            placeholder={`Buscar en ${category.name}...`}
          />
        </div>

        {searchTerm && (
          <div className="mb-6 flex items-center justify-between">
            <div className="text-slate-400">
              {filteredPosts.length} resultado{filteredPosts.length !== 1 ? 's' : ''} 
              {searchTerm && <span> para "{searchTerm}"</span>}
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors duration-200"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 animate-pulse backdrop-blur-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-red-300 mb-4">{error}</h3>
              <p className="text-red-200/70 mb-6">Intentando reconectar... ({retryCount}/3)</p>
              <button
                onClick={handleRetry}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Reintentar ahora
              </button>
            </div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-6">
            {filteredPosts.map((post, index) => (
              <div key={post.id}>
                <PostCard post={post} onPostDeleted={handlePostDeleted} />
                {index < filteredPosts.length - 1 && (
                  <div className="flex items-center justify-center mt-6">
                    <div className="flex items-center space-x-3 w-full max-w-xs">
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-slate-600/50 flex-1"></div>
                      <div className="w-2 h-2 bg-gradient-to-br from-emerald-400/50 to-cyan-400/50 rounded-full"></div>
                      <div className="h-px bg-gradient-to-l from-transparent via-slate-600/50 to-slate-600/50 flex-1"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-slate-600/30">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 rounded-full animate-ping"></div>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-300 mb-3">
              {searchTerm ? 'No se encontraron posts' : 'Aún no hay posts en esta categoría'}
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda o explora sin filtros'
                : '¡Sé el primero en crear un post en esta categoría!'
              }
            </p>
            
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Mostrar todos los posts</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetail;