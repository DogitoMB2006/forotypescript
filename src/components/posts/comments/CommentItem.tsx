import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { deleteComment, updateComment } from '../../../services/commentService';
import { getUserProfile } from '../../../services/userService';
import { userHasPermission } from '../../../services/roleService';
import type { Comment } from '../../../services/commentService';
import type { UserProfile } from '../../../services/userService';
import EditComment from './EditComment';
import DeleteComment from './DeleteComment';
import ReplyComment from './ReplyComment';
import Avatar from '../../ui/Avatar';
import ClickableUsername from '../../ui/ClickableUsername';
import DefaultBadge from '../../user/DefaultBadge';
import UserRoleDisplay from '../../user/UserRoleDisplay';
import AudioPlayer from '../../audio/AudioPlayer';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onCommentDeleted: (commentId: string) => void;
  onCommentUpdated: (comment: Comment) => void;
  onReplyAdded: (parentId: string, reply: Comment) => void;
  level?: number;
}

const CommentItem: FC<CommentItemProps> = ({ comment, postId, onCommentDeleted, onCommentUpdated, onReplyAdded, level = 0 }) => {
  const { user, hasPermission } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [refreshProfile, setRefreshProfile] = useState(0);
  const [showFullContent, setShowFullContent] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  
  const isAuthor = user?.uid === comment.authorId;
  const canDeleteComment = isAuthor || hasPermission('delete', 'comments');
  const canEditComment = isAuthor && !comment.audioUrl;

  useEffect(() => {
    const fetchAuthorProfile = async () => {
      try {
        const profile = await getUserProfile(comment.authorId);
        setAuthorProfile(profile);
      } catch (error) {
        console.error('Error fetching comment author profile:', error);
      }
    };

    fetchAuthorProfile();
  }, [comment.authorId, refreshProfile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshProfile(prev => prev + 1);
    }, 10000);

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

  const handleEdit = async (newContent: string) => {
    try {
      await updateComment(comment.id, newContent);
      const updatedComment = {
        ...comment,
        content: newContent,
        updatedAt: new Date()
      };
      onCommentUpdated(updatedComment);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (!isAuthor) {
      const isAdmin = user.email === 'dogitomb2022@gmail.com';
      if (!isAdmin) {
        const hasDeletePermission = await userHasPermission(user.uid, 'delete', 'comments');
        if (!hasDeletePermission) {
          setPermissionError('No tienes permisos suficientes para realizar esta acción. Por favor, refresca la página.');
          return;
        }
      }
    }

    try {
      await deleteComment(comment.id);
      onCommentDeleted(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  const handleDeleteClick = async () => {
    if (!user) return;

    if (!isAuthor) {
      const isAdmin = user.email === 'dogitomb2022@gmail.com';
      if (!isAdmin) {
        const hasDeletePermission = await userHasPermission(user.uid, 'delete', 'comments');
        if (!hasDeletePermission) {
          setPermissionError('No tienes permisos suficientes para realizar esta acción. Por favor, refresca la página.');
          return;
        }
      }
    }

    setShowDeleteModal(true);
  };

  const handleReplyCreated = (reply: Comment) => {
    onReplyAdded(comment.id, reply);
    setShowReplyForm(false);
  };

  const processContent = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    return text.split(mentionRegex).map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-blue-400 font-medium">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const isContentLong = comment.content && comment.content.length > 200;
  const shouldTruncate = isContentLong && !showFullContent;

  if (isEditing) {
    return (
      <EditComment
        comment={comment}
        onSave={handleEdit}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const getMarginClass = () => {
    if (level === 0) return '';
    if (level === 1) return 'ml-3 sm:ml-6 md:ml-8';
    if (level === 2) return 'ml-6 sm:ml-12 md:ml-16';
    return 'ml-8 sm:ml-16 md:ml-20';
  };

  const getDeleteButtonStyle = () => {
    if (isAuthor) {
      return "text-gray-500 hover:text-red-400 hover:bg-red-900/20";
    }
    return "text-red-500 hover:text-red-400 hover:bg-red-900/20";
  };

  const getDeleteButtonTitle = () => {
    if (isAuthor) {
      return "Eliminar comentario";
    }
    return "Eliminar comentario (Moderación)";
  };

  return (
    <>
      <div 
        id={`comment-${comment.id}`}
        className={`bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 hover:border-gray-600 transition-colors duration-200 ${getMarginClass()} scroll-mt-24 group`}
      >
        <div className="flex items-start space-x-2 sm:space-x-3">
          <Avatar 
            src={authorProfile?.profileImageUrl}
            name={comment.authorDisplayName}
            size="md"
            className="flex-shrink-0 mt-0.5"
          />
          
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 min-w-0 flex-1">
                <div className="flex items-center space-x-2 min-w-0">
                  <ClickableUsername
                    userId={comment.authorId}
                    username={comment.authorUsername}
                    displayName={comment.authorDisplayName}
                    className="font-medium text-white hover:text-blue-400 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none"
                  >
                    <span className="sm:hidden">
                      {truncateName(comment.authorDisplayName, 12)}
                    </span>
                    <span className="hidden sm:inline">
                      {truncateName(comment.authorDisplayName, 20)}
                    </span>
                  </ClickableUsername>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} size="sm" />
                    <UserRoleDisplay userId={comment.authorId} size="sm" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 sm:space-x-2 text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-0">
                  <span className="hidden sm:inline text-gray-500">
                    @{comment.authorUsername.length > 15 ? comment.authorUsername.substring(0, 15) + '...' : comment.authorUsername}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="whitespace-nowrap">{formatTimeAgo(comment.createdAt)}</span>
                  {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                    <>
                      <span>•</span>
                      <span className="text-xs">(editado)</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1 flex-shrink-0">
                {canDeleteComment && !isAuthor && (
                  <div className="px-1.5 py-0.5 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Mod
                  </div>
                )}
                
                {canEditComment && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-500 hover:text-blue-400 p-1.5 rounded transition-colors duration-200 hover:bg-blue-900/20 opacity-0 group-hover:opacity-100"
                    title="Editar comentario"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                
                {canDeleteComment && (
                  <button
                    onClick={handleDeleteClick}
                    className={`p-1.5 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100 ${getDeleteButtonStyle()}`}
                    title={getDeleteButtonTitle()}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {comment.audioUrl ? (
              <div className="mb-3">
                <AudioPlayer audioUrl={comment.audioUrl} />
              </div>
            ) : comment.content && (
              <div className="text-gray-200 text-sm sm:text-base leading-relaxed mb-3">
                <div className="break-words overflow-wrap-anywhere">
                  {shouldTruncate ? (
                    <>
                      <span className="whitespace-pre-wrap">
                        {processContent(comment.content.substring(0, 200))}...
                      </span>
                      <button
                        onClick={() => setShowFullContent(true)}
                        className="text-blue-400 hover:text-blue-300 text-sm ml-1 font-medium"
                      >
                        Ver más
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="whitespace-pre-wrap">
                        {processContent(comment.content)}
                      </span>
                      {isContentLong && showFullContent && (
                        <button
                          onClick={() => setShowFullContent(false)}
                          className="text-blue-400 hover:text-blue-300 text-sm ml-1 font-medium"
                        >
                          Ver menos
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button className="flex items-center space-x-1 text-gray-500 hover:text-red-400 transition-colors duration-200 py-1 px-2 rounded-lg hover:bg-red-900/20">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-xs sm:text-sm">{comment.likes}</span>
              </button>
              
              <button 
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-400 transition-colors duration-200 py-1 px-2 rounded-lg hover:bg-blue-900/20"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="text-xs sm:text-sm">Responder</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className={`mt-2 ${getMarginClass()}`}>
          <ReplyComment
            parentComment={comment}
            postId={postId}
            onReplyCreated={handleReplyCreated}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onCommentDeleted={onCommentDeleted}
              onCommentUpdated={onCommentUpdated}
              onReplyAdded={onReplyAdded}
              level={level + 1}
            />
          ))}
        </div>
      )}

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

      <DeleteComment
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
        isModerationAction={!isAuthor}
      />
    </>
  );
};

export default CommentItem;