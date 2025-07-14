import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Post } from '../services/postService';
import CategoriesGrid from '../components/categories/CategoriesGrid';
import CategorySearch from '../components/categories/CategorySearch';
import PostCard from '../components/posts/PostCard';

const Categories: FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const searchPosts = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setLoading(true);
      setIsSearching(true);

      try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const allPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Post));

        const filteredPosts = allPosts.filter(post => 
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.authorDisplayName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setSearchResults(filteredPosts);
      } catch (error) {
        console.error('Error searching posts:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchPosts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handlePostDeleted = (postId: string) => {
    setSearchResults(prev => prev.filter(post => post.id !== postId));
  };

  return (
    <div className="min-h-screen bg-gray-950 py-6 sm:py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Categorías
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-3xl mx-auto mb-8">
            Explora contenido organizado por temas o busca algo específico
          </p>
          
          <CategorySearch 
            onSearch={handleSearch}
            placeholder="Buscar posts, usuarios o contenido..."
            className="mb-8"
          />
        </div>

        {isSearching ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Resultados de búsqueda
                {searchTerm && (
                  <span className="text-gray-400 font-normal"> para "{searchTerm}"</span>
                )}
              </h2>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setIsSearching(false);
                }}
                className="text-gray-400 hover:text-white text-sm sm:text-base transition-colors duration-200"
              >
                Limpiar búsqueda
              </button>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
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
            ) : searchResults.length > 0 ? (
              <div className="space-y-6">
                <div className="text-sm text-gray-500 mb-4">
                  {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map((post, index) => (
                  <div key={post.id}>
                    <PostCard post={post} onPostDeleted={handlePostDeleted} />
                    {index < searchResults.length - 1 && (
                      <div className="flex items-center justify-center my-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent w-full max-w-md"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No se encontraron resultados</h3>
                <p className="text-gray-500">
                  Intenta con otras palabras clave o explora las categorías disponibles
                </p>
              </div>
            )}
          </div>
        ) : (
          <CategoriesGrid />
        )}
      </div>
    </div>
  );
};

export default Categories;