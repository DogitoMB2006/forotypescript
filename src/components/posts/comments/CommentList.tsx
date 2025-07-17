import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getCommentsByPostId } from '../../../services/commentService';
import type { Comment } from '../../../services/commentService';
import CommentItem from './CommentItem';
import CreateComment from './CreateComment';

interface CommentListProps {
  postId: string;
}

const CommentList: FC<CommentListProps> = ({ postId }) => {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const fetchedComments = await getCommentsByPostId(postId);
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setError('Error al cargar los comentarios');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleReplyAdded = (parentId: string, reply: Comment) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        };
      }
      
      if (comment.replies) {
        const updateReplies = (replies: Comment[]): Comment[] => {
          return replies.map(r => {
            if (r.id === parentId) {
              return {
                ...r,
                replies: [...(r.replies || []), reply]
              };
            }
            if (r.replies) {
              return { ...r, replies: updateReplies(r.replies) };
            }
            return r;
          });
        };
        
        return {
          ...comment,
          replies: updateReplies(comment.replies)
        };
      }
      
      return comment;
    }));
  };

  const handleCommentCreated = (newComment: Comment) => {
    setComments(prev => [newComment, ...prev]);
  };

  const handleCommentDeleted = (commentId: string) => {
    const deleteFromComments = (comments: Comment[]): Comment[] => {
      return comments.filter(comment => {
        if (comment.id === commentId) {
          return false;
        }
        if (comment.replies) {
          comment.replies = deleteFromComments(comment.replies);
        }
        return true;
      });
    };
    
    setComments(prev => deleteFromComments(prev));
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    const updateInComments = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === updatedComment.id) {
          return updatedComment;
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateInComments(comment.replies)
          };
        }
        return comment;
      });
    };
    
    setComments(prev => updateInComments(prev));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
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
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAuthenticated ? (
        <CreateComment postId={postId} onCommentCreated={handleCommentCreated} />
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-4">Please log in to comment</p>
          <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
            Log in here
          </a>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay comentarios todavía. ¡Sé el primero en comentar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onCommentDeleted={handleCommentDeleted}
              onCommentUpdated={handleCommentUpdated}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentList; //ee