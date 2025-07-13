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
import ClickableUsername from '../components/ui/ClickableUsername';
import DefaultBadge from '../components/user/DefaultBadge';
import UserRoleDisplay from '../components/user/UserRoleDisplay';

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
  }, [id, refreshProfile, initialLoad]);

  useEffect(() => {
    if (location.hash && !loading && post) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 2000);
        }
      }, 500);
    }
  }, [location.hash, loading, post]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshProfile(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
            className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200 break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getDeleteButtonStyle = () => {
    if (isAuthor) {
      return "text-red-400 hover:text-red-300 hover:bg-red-900/20";
    }
    return "text-red-500 hover:text-red-400 hover:bg-red-900/20";
  };

  const getDeleteButtonText = () => {
    if (isAuthor) {
      return "Eliminar";
    }
    return "Eliminar (Mod)";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 py-4 sm:py-8">
        <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-8 animate-pulse">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 sm:h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
            <div className="h-6 sm:h-8 bg-gray-700 rounded w-3/4 mb-3 sm:mb-4"></div>
            <div className="space-y-2 sm:space-y-3">
              <div className="h-3 sm:h-4 bg-gray-700 rounded"></div>
              <div className="h-3 sm:h-4 bg-gray-700 rounded"></div>
              <div className="h-3 sm:h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-950 py-4 sm:py-8">
        <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-red-300 mb-4">{error || 'Post no encontrado'}</h2>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-md transition-colors duration-200"
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
      <div className="min-h-screen bg-gray-950 py-4 sm:py-8">
        <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 p-2 sm:p-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Volver</span>
            </button>

            {canDeletePost && (
              <div className="flex items-center space-x-2">
                {!isAuthor && (
                  <div className="px-2 py-1 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-xs font-medium">
                    Moderación
                  </div>
                )}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-colors duration-200 ${getDeleteButtonStyle()}`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-sm sm:text-base">{getDeleteButtonText()}</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 sm:p-8">
              <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                <Avatar 
                  src={authorProfile?.profileImageUrl}
                  name={post.authorDisplayName}
                  size="lg"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <ClickableUsername
                      userId={post.authorId}
                      username={post.authorUsername}
                      displayName={post.authorDisplayName}
                      className="text-lg sm:text-xl font-bold text-white hover:text-blue-400 truncate"
                    >
                      {post.authorDisplayName}
                    </ClickableUsername>
                    <div className="flex items-center space-x-2 flex-shrink-0 mt-1 sm:mt-0">
                      <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} size="sm" />
                      <UserRoleDisplay userId={post.authorId} size="sm" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm sm:text-base">@{post.authorUsername}</p>
                  <p className="text-gray-500 text-xs sm:text-sm">{formatDate(post.createdAt)}</p>
                </div>
              </div>

              <h1 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 leading-tight">{post.title}</h1>
              
              <div className="text-gray-200 text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-4 sm:mb-6 break-words">
                {processContent(post.content)}
              </div>

              {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  {post.imageUrls.length === 1 ? (
                    <img
                      src={post.imageUrls[0]}
                      alt="Post image"
                      className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-screen"
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      {post.imageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Post image ${index + 1}`}
                          className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-96"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-gray-500 border-t border-gray-800 pt-4 sm:pt-6">
                <LikeButton
                  postId={post.id}
                  initialLikes={post.likes || 0}
                  initialLikedBy={post.likedBy || []}
                  size="lg"
                  showCount={true}
                />
                
                <button 
                  onClick={() => {
                    const commentsSection = document.getElementById('comments');
                    if (commentsSection) {
                      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="flex items-center space-x-1 sm:space-x-2 hover:text-blue-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-blue-900/20"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm sm:text-base">{commentCount} Comentarios</span>
                </button>
                
                <button className="flex items-center space-x-1 sm:space-x-2 hover:text-green-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-green-900/20">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-sm sm:text-base">Compartir</span>
                </button>
              </div>
            </div>
          </div>

          <div id="comments" className="mt-6 sm:mt-8 bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6 scroll-mt-24">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Comentarios</h3>
            <CommentList postId={post.id} />
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
        isModerationAction={!isAuthor}
      />
    </>
  );
};

export default PostDetail;