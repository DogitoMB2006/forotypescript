import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import ClickableUsername from '../ui/ClickableUsername';
import DefaultBadge from '../user/DefaultBadge';
import UserRoleDisplay from '../user/UserRoleDisplay';
import CategoryBadge from '../categories/CategoryBadge';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

const PostCard: FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user, hasPermission } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [refreshProfile, setRefreshProfile] = useState(0);
  const [permissionError, setPermissionError] = useState('');
  
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
    
    if (diffInSeconds < 60) return 'ahora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}sem`;
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
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;

    if (!isAuthor) {
      const isAdmin = user.email === 'dogitomb2022@gmail.com';
      if (!isAdmin) {
        const hasDeletePermission = await userHasPermission(user.uid, 'delete', 'posts');
        if (!hasDeletePermission) {
          setPermissionError('No tienes permisos suficientes para realizar esta acción. Por favor, refresca la página.');
          return;
        }
      }
    }

    try {
      await deletePost(postId, post.imageUrls);
      onPostDeleted?.(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    if (!isAuthor) {
      const isAdmin = user.email === 'dogitomb2022@gmail.com';
      if (!isAdmin) {
        const hasDeletePermission = await userHasPermission(user.uid, 'delete', 'posts');
        if (!hasDeletePermission) {
          setPermissionError('No tienes permisos suficientes para realizar esta acción. Por favor, refresca la página.');
          return;
        }
      }
    }

    setShowDeleteModal(true);
  };

  const getDeleteButtonStyle = () => {
    if (isAuthor) {
      return "text-gray-500 hover:text-red-400 hover:bg-red-900/20";
    }
    return "text-red-500 hover:text-red-400 hover:bg-red-900/20";
  };

  const getDeleteButtonTitle = () => {
    if (isAuthor) {
      return "Eliminar post";
    }
    return "Eliminar post (Moderación)";
  };

  return (
    <>
      <Link to={`/post/${post.id}`}>
        <article className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-5 hover:border-gray-600/60 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 cursor-pointer group hover:scale-[1.02] transform-gpu">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="relative">
              <Avatar 
                src={authorProfile?.profileImageUrl}
                name={post.authorDisplayName}
                size="lg"
                className="flex-shrink-0 ring-2 ring-gray-700/50 group-hover:ring-blue-500/30 transition-all duration-300"
              />
              <div className="absolute -bottom-1 -right-1">
                <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} size="sm" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClickableUsername
                      userId={post.authorId}
                      username={post.authorUsername}
                      displayName={post.authorDisplayName}
                      className="font-bold text-white hover:text-blue-400 text-sm sm:text-base truncate transition-colors duration-200"
                    >
                      {post.authorDisplayName}
                    </ClickableUsername>
                    <UserRoleDisplay userId={post.authorId} size="sm" />
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs sm:text-sm">
                    <span>•</span>
                    <time className="font-medium">{formatTimeAgo(post.createdAt)}</time>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CategoryBadge categoryId={post.categoryId} size="sm" />
                  {canDeletePost && (
                    <button
                      onClick={handleDeleteClick}
                      className={`p-2 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 ${getDeleteButtonStyle()}`}
                      title={getDeleteButtonTitle()}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300 line-clamp-2 leading-tight">
                  {post.title}
                </h2>
                
                <div className="text-gray-300 text-sm sm:text-base line-clamp-3 leading-relaxed">
                  {processContent(post.content)}
                </div>
              </div>
              
              {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-700/30">
                  {post.imageUrls.length === 1 ? (
                    <div className="relative group/image">
                      <img
                        src={post.imageUrls[0]}
                        alt="Post image"
                        className="w-full max-h-48 sm:max-h-56 object-cover transition-transform duration-300 group-hover/image:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-gray-800/30">
                      {post.imageUrls.slice(0, 4).map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                          <img
                            src={url}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                          />
                          {index === 3 && post.imageUrls.length > 4 && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                +{post.imageUrls.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
                <div className="flex items-center gap-1 sm:gap-2">
                  <LikeButton
                    postId={post.id}
                    initialLikes={post.likes || 0}
                    initialLikedBy={post.likedBy || []}
                    size="md"
                    showCount={true}
                    className="hover:scale-110 transition-transform duration-200"
                  />
                  
                  <Link
                    to={`/post/${post.id}#comments`}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 transition-all duration-200 py-2 px-3 rounded-xl hover:bg-blue-900/20 hover:scale-105"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm font-medium">{commentCount}</span>
                  </Link>
                  
                  <button 
                    className="flex items-center gap-1.5 text-gray-500 hover:text-emerald-400 transition-all duration-200 py-2 px-3 rounded-xl hover:bg-emerald-900/20 hover:scale-105"
                    onClick={(e) => e.preventDefault()}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  @{post.authorUsername}
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>

      {permissionError && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500 rounded-xl shadow-2xl w-full max-w-md p-6">
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
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Refrescar Página
              </button>
            </div>
          </div>
        </div>
      )}

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