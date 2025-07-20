import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { deletePost } from '../../services/postService';
import { getCommentCount } from '../../services/commentService';
import { getUserProfile } from '../../services/userService';
import { userHasPermission } from '../../services/roleService';
import type { Post } from '../../services/postService';
import type { UserProfile } from '../../services/userService';
import DeletePost from './DeletePost';
import LikeButton from './LikeButton';
import Avatar from '../ui/Avatar';
import DefaultBadge from '../user/DefaultBadge';
import UserRoleDisplay from '../user/UserRoleDisplay';
import CategoryBadge from '../categories/CategoryBadge';
import UserModalPostcard from './UserModalPostcard';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

const PostCard: FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [refreshProfile, setRefreshProfile] = useState(0);
  const [permissionError, setPermissionError] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalPosition, setUserModalPosition] = useState({ x: 0, y: 0 });
  
  const isAuthor = user?.uid === post.authorId;
  const canDeletePost = isAuthor || hasPermission('delete', 'posts');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [count, profile] = await Promise.all([
          getCommentCount(post.id),
          getUserProfile(post.authorId)
        ]);
        setCommentCount(count);
        setAuthorProfile(profile);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [post.id, post.authorId, refreshProfile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshProfile(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Hace un momento';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
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

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      onPostDeleted?.(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDeleteClick = async () => {
    if (!canDeletePost) {
      if (!user) {
        setPermissionError('Debes iniciar sesión para eliminar posts.');
        return;
      }
      
      if (!isAuthor) {
        try {
          const hasModerationPermission = await userHasPermission(user.uid, 'delete', 'posts');
          if (!hasModerationPermission) {
            setPermissionError('No tienes permisos para eliminar este post. Contacta a un moderador si crees que este contenido viola las reglas de la comunidad.');
            return;
          }
        } catch (error) {
          console.error('Error checking permissions:', error);
          setPermissionError('Error al verificar permisos. Intenta refrescar la página.');
          return;
        }
      }
    }

    setShowDeleteModal(true);
  };

  const handleUserClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    setUserModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY
    });
    setShowUserModal(true);
  };

  const getDeleteButtonStyle = () => {
    if (isAuthor) {
      return 'bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50';
    }
    return 'bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/50';
  };

  const getDeleteButtonTitle = () => {
    return isAuthor ? 'Eliminar publicación' : 'Eliminar publicación (Moderación)';
  };



  return (
    <>
      <article 
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 group shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10"
        data-post-id={post.id}
      >
        <Link 
          to={`/post/${post.id}`} 
          className="block"
          state={{
            fromHome: location.pathname === '/',
            scrollPosition: (() => {
              const postElement = document.querySelector(`[data-post-id="${post.id}"]`);
              if (postElement) {
                const rect = postElement.getBoundingClientRect();
                return window.scrollY + rect.top - 100;
              }
              return window.scrollY;
            })()
          }}
        >
          <div className="p-4 sm:p-6">
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
                    className="font-semibold text-white group-hover:text-emerald-400 transition-colors duration-200 hover:underline"
                  >
                    {post.authorDisplayName}
                  </button>
                  
                  <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} />
                  <UserRoleDisplay userId={post.authorId} />
                  
                  <span className="text-slate-500 text-sm">•</span>
                  <time className="text-slate-400 text-sm">{formatTimeAgo(post.createdAt)}</time>
                </div>
                
                {post.categoryId && (
                  <div className="mb-2">
                    <CategoryBadge categoryId={post.categoryId} />
                  </div>
                )}
                
                {canDeletePost && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick();
                      }}
                      className={`p-1 sm:p-2 rounded-lg transition-all duration-200 ${getDeleteButtonStyle()}`}
                      title={getDeleteButtonTitle()}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 leading-tight group-hover:text-emerald-300 transition-colors duration-200">
              {post.title}
            </h2>
            
            <div className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 line-clamp-4 group-hover:text-slate-200 transition-colors duration-200">
              {post.content.length > 300 ? (
                <>
                  {processContent(post.content.substring(0, 300))}
                  <span className="text-emerald-400 font-medium">... Leer más</span>
                </>
              ) : (
                processContent(post.content)
              )}
            </div>

            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className="mb-4 sm:mb-6">
                {post.imageUrls.length === 1 ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-600/30">
                    <img 
                      src={post.imageUrls[0]} 
                      alt={`Imagen del post ${post.title}`}
                      className="w-full h-48 sm:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {post.imageUrls.slice(0, 4).map((imageUrl, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg border border-slate-600/30">
                        <img 
                          src={imageUrl} 
                          alt={`Imagen ${index + 1} del post ${post.title}`}
                          className="w-full h-24 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        {index === 3 && post.imageUrls.length > 4 && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">+{post.imageUrls.length - 4}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Link>
        
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex items-center justify-between pt-3 border-t border-slate-600/30">
            <div className="flex items-center space-x-1 sm:space-x-4">
              <LikeButton 
                postId={post.id}
                initialLikes={post.likes || 0}
                initialLikedBy={post.likedBy || []}
              />
              
              <Link 
                to={`/post/${post.id}#comments`}
                className="flex items-center space-x-1 sm:space-x-2 text-slate-400 hover:text-emerald-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-emerald-900/20"
                state={{
                  fromHome: location.pathname === '/',
                  scrollPosition: (() => {
                    const postElement = document.querySelector(`[data-post-id="${post.id}"]`);
                    if (postElement) {
                      const rect = postElement.getBoundingClientRect();
                      return window.scrollY + rect.top - 100;
                    }
                    return window.scrollY;
                  })()
                }}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm sm:text-base">{commentCount}</span>
              </Link>
              
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

      {permissionError && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-red-500 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Permisos Insuficientes</h3>
                <p className="text-sm text-red-300">{permissionError}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setPermissionError('')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Refrescar Página
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
};

export default PostCard;