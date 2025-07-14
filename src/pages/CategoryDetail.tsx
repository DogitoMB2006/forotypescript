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

  const category = categoryId ? getCategoryById(categoryId) : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      if (!categoryId) return;

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
      } catch (error) {
        console.error('Error fetching category posts:', error);
        setError('Error al cargar los posts de esta categoría');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPosts();
  }, [categoryId]);

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

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-300 mb-4">Categoría no encontrada</h2>
            <button 
              onClick={() => navigate('/categorias')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
            >
              Volver a categorías
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-300 mb-4">{error}</h2>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-6 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <button 
            onClick={() => navigate('/categorias')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver a categorías</span>
          </button>

          <div className={`
            flex items-center space-x-4 p-6 rounded-xl border
            ${category.bgColor} ${category.borderColor}
          `}>
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-3xl">{category.icon}</span>
            </div>
            <div className="flex-1">
              <h1 className={`text-2xl sm:text-3xl font-bold ${category.color} mb-2`}>
                {category.name}
              </h1>
              <p className="text-gray-300 text-base sm:text-lg">
                {category.description}
              </p>
              <div className={`text-sm ${category.color} mt-2`}>
                {posts.length} post{posts.length !== 1 ? 's' : ''} en esta categoría
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
            <div className="text-gray-400">
              {filteredPosts.length} resultado{filteredPosts.length !== 1 ? 's' : ''} 
              {searchTerm && <span> para "{searchTerm}"</span>}
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {filteredPosts.length > 0 ? (
          <div className="space-y-6">
            {filteredPosts.map((post, index) => (
              <div key={post.id}>
                <PostCard post={post} onPostDeleted={handlePostDeleted} />
                {index < filteredPosts.length - 1 && (
                  <div className="flex items-center justify-center my-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent w-full max-w-md"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${category.bgColor} flex items-center justify-center`}>
              <span className="text-2xl">{category.icon}</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {searchTerm ? 'No se encontraron resultados' : 'No hay posts en esta categoría'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Intenta con otras palabras clave'
                : '¡Sé el primero en crear un post en esta categoría!'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/crear-post')}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-colors duration-200
                  ${category.color} ${category.bgColor} ${category.borderColor} border
                  hover:bg-opacity-80
                `}
              >
                Crear primer post
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetail;