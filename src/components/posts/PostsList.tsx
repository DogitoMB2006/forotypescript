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
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                  <div className="h-3 bg-gray-700 rounded w-8"></div>
                  <div className="h-3 bg-gray-700 rounded w-12"></div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                </div>
                <div className="flex items-center space-x-4 mt-3 pt-2 border-t border-gray-800">
                  <div className="h-3 bg-gray-700 rounded w-8"></div>
                  <div className="h-3 bg-gray-700 rounded w-8"></div>
                  <div className="h-3 bg-gray-700 rounded w-8"></div>
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
      <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-center">
        <p className="text-red-300 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors duration-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No hay posts todavía</h3>
        <p className="text-gray-500 text-sm">¡Sé el primero en crear un post!</p>
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
              <div className="flex items-center space-x-2 w-full max-w-xs">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700/50 to-gray-700/50 flex-1"></div>
                <div className="w-1.5 h-1.5 bg-gray-700/50 rounded-full"></div>
                <div className="h-px bg-gradient-to-l from-transparent via-gray-700/50 to-gray-700/50 flex-1"></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostsList;