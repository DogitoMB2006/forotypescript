import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { getPosts } from '../../services/postService';
import type { Post } from '../../services/postService';
import PostCard from './PostCard';

const PostsList: FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Error al cargar los posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-4 sm:p-5 animate-pulse">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 bg-slate-600 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 bg-slate-600 rounded w-24"></div>
                  <div className="h-3 bg-slate-600 rounded w-8"></div>
                  <div className="h-3 bg-slate-600 rounded w-12"></div>
                </div>
                <div className="h-5 bg-slate-600 rounded w-3/4 mb-2"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-slate-600 rounded"></div>
                  <div className="h-4 bg-slate-600 rounded w-5/6"></div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-600/30">
                  <div className="h-4 bg-slate-600 rounded w-12"></div>
                  <div className="h-4 bg-slate-600 rounded w-12"></div>
                  <div className="h-4 bg-slate-600 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/90 to-red-800/90 backdrop-blur-sm border border-red-500/50 rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-300">Error al cargar</h3>
        </div>
        <p className="text-red-300 text-sm mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 sm:p-8 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 rounded-full animate-ping"></div>
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">No hay posts todavía</h3>
        <p className="text-slate-400 mb-6">¡Sé el primero en crear un post y comenzar la conversación!</p>
        <div className="inline-flex items-center space-x-2 text-emerald-400 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Usa el botón flotante para crear tu primer post</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {posts.map((post, index) => (
        <div key={post.id}>
          <PostCard post={post} />
          {index < posts.length - 1 && (
            <div className="flex items-center justify-center mt-4 sm:mt-6">
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
  );
};

export default PostsList;