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
    const fetchAuthorProfile = async () => {
      if (!post?.authorId) return;
      
      try {
        const profile = await getUserProfile(post.authorId);
        setAuthorProfile(profile);
      } catch (error) {
        console.error('Error fetching author profile:', error);
      }
    };

    const interval = setInterval(fetchAuthorProfile, 5000);
    return () => clearInterval(interval);
  }, [post?.authorId]);

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

  useEffect(() => {
    if (!showUserModal) return;

    let initialScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - initialScrollY);
      
      if (scrollDifference > 100) {
        setShowUserModal(false);
      }
    };

    document.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [showUserModal]);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          <div className="p-4 sm:p-8">
            <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6 relative">
              <button
                onClick={handleUserClick}
                className="flex-shrink-0 hover:scale-105 transition-transform duration-200"
              >
                <Avatar
                  src={authorProfile?.profileImageUrl}
                  alt={post.authorDisplayName}
                  name={post.authorDisplayName}
                  size="lg"
                />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                  <div className="flex items-center space-x-2 mb-1 sm:mb-0">
                    <button
                      onClick={handleUserClick}
                      className="text-lg sm:text-xl font-bold text-white hover:text-blue-400 transition-colors duration-200 hover:underline truncate"
                    >
                      {post.authorDisplayName}
                    </button>
                    <div className="flex items-center space-x-2 flex-shrink-0 mt-1 sm:mt-0">
                      <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} size="sm" />
                      <UserRoleDisplay userId={post.authorId} size="sm" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm sm:text-base">@{post.authorUsername}</p>
                <p className="text-gray-500 text-xs sm:text-sm">{formatDate(post.createdAt)}</p>
              </div>

              {canDeletePost && (
                <div className="absolute top-0 right-0">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title="Eliminar post"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 leading-tight">{post.title}</h1>
            
            <div className="flex items-center mb-4 sm:mb-6">
              <CategoryBadge 
                categoryId={post.categoryId} 
                size="md"
              />
            </div>
            
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
              
              <div className="flex items-center space-x-2 text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium">{commentCount} comentarios</span>
              </div>

              <button className="flex items-center space-x-2 text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>Compartir</span>
              </button>
            </div>
          </div>
        </div>

        <div id="comments-section" className="mt-6 sm:mt-8">
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