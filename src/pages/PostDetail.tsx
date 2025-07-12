import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById, deletePost } from '../services/postService';
import { useAuth } from '../hooks/useAuth';
import type { Post } from '../services/postService';
import DeletePost from '../components/posts/DeletePost';

const PostDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAuthor = user?.uid === post?.authorId;

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      try {
        const fetchedPost = await getPostById(id);
        if (fetchedPost) {
          setPost(fetchedPost);
        } else {
          setError('Post no encontrado');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Error al cargar el post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId, post?.imageUrls || []);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  const handleDeleteSuccess = () => {
    navigate('/');
    window.location.reload();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha desconocida';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const processContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 animate-pulse">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-300 mb-4">{error}</h2>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>

            {isAuthor && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-red-900/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Eliminar post</span>
              </button>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {post.authorDisplayName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{post.authorDisplayName}</h3>
                  <p className="text-gray-400">@{post.authorUsername}</p>
                  <p className="text-gray-500 text-sm">{formatDate(post.createdAt)}</p>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white mb-6">{post.title}</h1>
              
              <div className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap mb-6">
                {processContent(post.content)}
              </div>

              {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="mb-8">
                  {post.imageUrls.length === 1 ? (
                    <img
                      src={post.imageUrls[0]}
                      alt="Post image"
                      className="w-full max-h-96 object-cover rounded-lg border border-gray-700"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {post.imageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Post image ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg border border-gray-700"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-8 text-gray-500 border-t border-gray-800 pt-6">
                <button className="flex items-center space-x-2 hover:text-red-400 transition-colors duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likes} Me gusta</span>
                </button>
                
                <button className="flex items-center space-x-2 hover:text-blue-400 transition-colors duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{post.commentsCount} Comentarios</span>
                </button>
                
                <button className="flex items-center space-x-2 hover:text-green-400 transition-colors duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Compartir</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Comentarios</h3>
            <p className="text-gray-400">Los comentarios estarán disponibles próximamente...</p>
          </div>
        </div>
      </div>

      <DeletePost
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        postId={post.id}
        postTitle={post.title}
        onDelete={handleDelete}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default PostDetail;