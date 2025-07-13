import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { deleteComment, updateComment } from '../../../services/commentService';
import { getUserProfile } from '../../../services/userService';
import type { Comment } from '../../../services/commentService';
import type { UserProfile } from '../../../services/userService';
import EditComment from './EditComment';
import DeleteComment from './DeleteComment';
import ReplyComment from './ReplyComment';
import Avatar from '../../ui/Avatar';
import ClickableUsername from '../../ui/ClickableUsername';
import DefaultBadge from '../../user/DefaultBadge';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onCommentDeleted: (commentId: string) => void;
  onCommentUpdated: (comment: Comment) => void;
  onReplyAdded: (parentId: string, reply: Comment) => void;
  level?: number;
}

const CommentItem: FC<CommentItemProps> = ({ comment, postId, onCommentDeleted, onCommentUpdated, onReplyAdded, level = 0 }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [refreshProfile, setRefreshProfile] = useState(0);
  const [showFullContent, setShowFullContent] = useState(false);
  const isAuthor = user?.uid === comment.authorId;

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
    try {
      await deleteComment(comment.id);
      onCommentDeleted(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
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

  const isContentLong = comment.content.length > 200;
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

  return (
    <>
      <div 
        id={`comment-${comment.id}`}
        className={`bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 hover:border-gray-600 transition-colors duration-200 ${getMarginClass()} scroll-mt-24`}
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
                  <div className="flex-shrink-0">
                    <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} size="sm" />
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
              
              {isAuthor && (
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-500 hover:text-blue-400 p-1.5 rounded transition-colors duration-200 hover:bg-blue-900/20"
                    title="Editar comentario"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-gray-500 hover:text-red-400 p-1.5 rounded transition-colors duration-200 hover:bg-red-900/20"
                    title="Eliminar comentario"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
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

      <DeleteComment
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
      />
    </>
  );
};

export default CommentItem;