import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPostById, deletePost } from '../services/postService';
import { getCommentCount } from '../services/commentService';
import { getUserProfile } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import type { Post } from '../services/postService';
import type { UserProfile } from '../services/userService';
import DeletePost from '../components/posts/DeletePost';
import CommentList from '../components/posts/comments/CommentList';
import LikeButton from '../components/posts/LikeButton';
import Avatar from '../components/ui/Avatar';
import DefaultBadge from '../components/user/DefaultBadge';
import UserRoleDisplay from '../components/user/UserRoleDisplay';
import CategoryBadge from '../components/categories/CategoryBadge';
import UserModalPostcard from '../components/posts/UserModalPostcard';

const PostDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [refreshProfile, setRefreshProfile] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalPosition, setUserModalPosition] = useState({ x: 0, y: 0 });

  const isAuthor = user?.uid === post?.authorId;
  const canDeletePost = isAuthor || hasPermission('delete', 'posts');
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      try {
        const fetchedPost = await getPostById(id);
        if (fetchedPost) {
          setPost(fetchedPost);
          const [count, profile] = await Promise.all([
            getCommentCount(id),
            getUserProfile(fetchedPost.authorId)
          ]);
          setCommentCount(count);
          setAuthorProfile(profile);
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
    if (initialLoad) {
      window.scrollTo(0, 0);
      setInitialLoad(false);
    }
  }, [id, initialLoad]);

  useEffect(() => {
    if (location.hash === '#comments') {
      setTimeout(() => {
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash, loading]);

  const handleUserClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setUserModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setShowUserModal(true);
  };

  const handleDelete = async () => {
    if (!post) return;
    
    try {
      await deletePost(post.id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
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
      if (part.match(urlRegex)) {
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">Cargando post...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-300 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error || 'Post no encontrado'}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <article className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-6">
            {/* Header del post */}
            <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6 relative">
              <button
                onClick={handleUserClick}
                className="flex-shrink-0 hover:scale-105 transition-transform duration-200"
              >
                <Avatar
                  src={authorProfile?.profileImageUrl}
                  alt={post.authorDisplayName}
                  name={post.authorDisplayName}
                  size="md"
                />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <button
                    onClick={handleUserClick}
                    className="font-semibold text-white hover:text-emerald-400 transition-colors duration-200 hover:underline"
                  >
                    {post.authorDisplayName}
                  </button>
                  
                  <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} />
                  <UserRoleDisplay userId={post.authorId} />
                  
                  <span className="text-slate-500 text-sm">•</span>
                  <time className="text-slate-400 text-sm">{formatDate(post.createdAt)}</time>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <CategoryBadge categoryId={post.categoryId} />
                </div>
              </div>

              {canDeletePost && (
                <div className="absolute top-0 right-0">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-70 hover:opacity-100"
                    title="Eliminar post"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Título */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              {post.title}
            </h1>
            
            {/* Contenido */}
            <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-4 sm:mb-6 break-words">
              {processContent(post.content)}
            </div>

            {/* Imágenes */}
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className="mb-4 sm:mb-6">
                {post.imageUrls.length === 1 ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-600/30">
                    <img
                      src={post.imageUrls[0]}
                      alt="Imagen del post"
                      className="w-full h-auto object-cover max-h-[60vh] sm:max-h-[70vh]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {post.imageUrls.map((url, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg border border-slate-600/30">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1} del post`}
                          className="w-full h-48 sm:h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Acciones del post */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-600/30">
              <div className="flex items-center space-x-1 sm:space-x-4">
                <LikeButton
                  postId={post.id}
                  initialLikes={post.likes || 0}
                  initialLikedBy={post.likedBy || []}
                />
                
                <div className="flex items-center space-x-1 sm:space-x-2 text-slate-400 py-2 px-3 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">{commentCount}</span>
                </div>
                
                <button className="flex items-center space-x-1 sm:space-x-2 text-slate-400 hover:text-cyan-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-cyan-900/20">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-sm sm:text-base hidden sm:inline">Compartir</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Sección de comentarios */}
        <div id="comments-section" className="mt-4 sm:mt-6">
          <CommentList 
            postId={post.id} 
          />
        </div>
      </div>

      <UserModalPostcard
        userId={post.authorId}
        username={post.authorUsername}
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        anchorPosition={userModalPosition}
      />

      <DeletePost
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        postId={post.id}
        postTitle={post.title}
        onDelete={handleDelete}
        isModerationAction={!isAuthor}
      />
    </div>
  );
};

export default PostDetail;