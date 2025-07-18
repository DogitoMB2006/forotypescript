import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
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
  const [initialLoad, setInitialLoad] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (initialLoad) {
      window.scrollTo(0, 0);
      setInitialLoad(false);
    }
    return () => {
      mounted.current = false;
    };
  }, [initialLoad]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const searchPosts = async () => {
      if (!searchTerm.trim()) {
        if (mounted.current) {
          setSearchResults([]);
          setIsSearching(false);
        }
        return;
      }

      if (mounted.current) {
        setLoading(true);
        setIsSearching(true);
      }

      try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (!mounted.current) return;

        const allPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Post));

        const filteredPosts = allPosts.filter(post => 
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.authorDisplayName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (mounted.current) {
          setSearchResults(filteredPosts);
        }
      } catch (error) {
        console.error('Error searching posts:', error);
        if (mounted.current) {
          setSearchResults([]);
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    timeoutId = setTimeout(searchPosts, 300);
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handlePostDeleted = (postId: string) => {
    setSearchResults(prev => prev.filter(post => post.id !== postId));
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-emerald-900/5 to-cyan-900/10 pointer-events-none"></div>
      
      <div className="relative container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-6xl">
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative inline-block mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Categorías
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
          </div>
          
          <p className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto mb-8 leading-relaxed">
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
            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
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
            ) : searchResults.length > 0 ? (
              <div className="space-y-6">
                <div className="text-sm text-slate-400 mb-6 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}</span>
                </div>
                
                {searchResults.map((post, index) => (
                  <div key={post.id}>
                    <PostCard post={post} onPostDeleted={handlePostDeleted} />
                    {index < searchResults.length - 1 && (
                      <div className="flex items-center justify-center my-6">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 rounded-full animate-ping"></div>
                </div>
                
                <h3 className="text-xl font-semibold text-slate-300 mb-3">No se encontraron resultados</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Intenta con otras palabras clave o explora las categorías disponibles
                </p>
                
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Volver a categorías</span>
                </button>
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