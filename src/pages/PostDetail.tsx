import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import CategoryBadge from '../components/categories/CategoryBadge';

const PostDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshProfile(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleDelete = async () => {
    if (!post) return;
    
    try {
      await deletePost(post.id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDeleteSuccess = () => {
    navigate('/');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Hace un momento';
    
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
            className="text-emerald-400 hover:text-emerald-300 underline transition-colors duration-200 break-all"
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
      <div className="min-h-screen bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-emerald-900/5 to-cyan-900/10 pointer-events-none"></div>
        
        <div className="relative container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 sm:p-8 animate-pulse">
            <div className="flex items-center space-x-4 mb-6">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Volver</span>
              </button>
            </div>

            <div className="flex items-start space-x-4 mb-6">
              <div className="w-16 h-16 bg-slate-600 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-6 bg-slate-600 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-slate-600 rounded w-1/4"></div>
              </div>
            </div>
            
            <div className="h-8 bg-slate-600 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-600 rounded"></div>
              <div className="h-4 bg-slate-600 rounded w-5/6"></div>
              <div className="h-4 bg-slate-600 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-emerald-900/5 to-cyan-900/10 pointer-events-none"></div>
        
        <div className="relative container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
          <div className="bg-gradient-to-br from-red-900/90 to-red-800/90 backdrop-blur-sm border border-red-500/50 rounded-2xl p-6 sm:p-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-red-300">{error || 'Post no encontrado'}</h2>
            </div>
            <p className="text-red-200 mb-6">El post que buscas no existe o ha sido eliminado.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
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
      <div className="min-h-screen bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-emerald-900/5 to-cyan-900/10 pointer-events-none"></div>
        
        <div className="relative container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-all duration-200 p-2 rounded-full hover:bg-slate-800/50 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline font-medium">Volver</span>
            </button>

            {canDeletePost && (
              <div className="flex items-center space-x-2">
                {!isAuthor && (
                  <div className="px-3 py-1 bg-red-900/30 border border-red-500/50 rounded-full text-red-400 text-xs font-medium">
                    Moderación
                  </div>
                )}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${getDeleteButtonStyle()}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-sm font-medium">{getDeleteButtonText()}</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8">
              <div className="flex items-start space-x-4 mb-6">
                <Avatar 
                  src={authorProfile?.profileImageUrl}
                  name={post.authorDisplayName}
                  size="xl"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <ClickableUsername
                      userId={post.authorId}
                      username={post.authorUsername}
                      displayName={post.authorDisplayName}
                      className="text-xl sm:text-2xl font-bold text-white hover:text-emerald-400 truncate"
                    >
                      {post.authorDisplayName}
                    </ClickableUsername>
                    <div className="flex items-center space-x-2 flex-shrink-0 mt-1 sm:mt-0">
                      <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} size="sm" />
                      <UserRoleDisplay userId={post.authorId} size="sm" />
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm sm:text-base">@{post.authorUsername}</p>
                  <p className="text-slate-500 text-xs sm:text-sm">{formatDate(post.createdAt)}</p>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              
              {post.categoryId && (
                <div className="flex items-center mb-6">
                  <CategoryBadge 
                    categoryId={post.categoryId} 
                    size="md"
                  />
                </div>
              )}
              
              <div className="text-slate-200 text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-6 break-words">
                {processContent(post.content)}
              </div>

              {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="mb-8">
                  {post.imageUrls.length === 1 ? (
                    <div className="relative overflow-hidden rounded-xl border border-slate-600/30">
                      <img
                        src={post.imageUrls[0]}
                        alt="Post image"
                        className="w-full h-auto object-contain rounded-xl max-h-screen"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {post.imageUrls.map((url, index) => (
                        <div key={index} className="relative overflow-hidden rounded-xl border border-slate-600/30">
                          <img
                            src={url}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-auto object-contain rounded-xl max-h-96"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6 text-slate-500 border-t border-slate-600/30 pt-6">
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
                  className="flex items-center space-x-2 hover:text-emerald-400 transition-colors duration-200 py-2 px-4 rounded-xl hover:bg-emerald-900/20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-base font-medium">{commentCount} Comentarios</span>
                </button>
                
                <button className="flex items-center space-x-2 hover:text-cyan-400 transition-colors duration-200 py-2 px-4 rounded-xl hover:bg-cyan-900/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-base font-medium">Compartir</span>
                </button>
              </div>
            </div>
          </div>

          <div id="comments" className="mt-8 bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 sm:p-8 scroll-mt-24">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center space-x-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Comentarios</span>
            </h3>
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