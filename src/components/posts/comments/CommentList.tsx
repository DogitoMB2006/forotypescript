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

  // Loading skeleton mejorado y responsive
  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {/* Header skeleton */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-gray-700/50 rounded-xl p-3 sm:p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-1/3 mb-2"></div>
              <div className="h-2 sm:h-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full w-2/3"></div>
            </div>
          </div>
        </div>

        {/* Comment skeletons */}
        {[...Array(3)].map((_, index) => (
          <div 
            key={index} 
            className="bg-gray-800/60 border border-gray-700/30 rounded-lg p-3 sm:p-4 animate-pulse backdrop-blur-sm"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              {/* Avatar skeleton */}
              <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex-shrink-0 mt-1"></div>
              
              <div className="flex-1 min-w-0">
                {/* User info skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-20 sm:w-24"></div>
                    <div className="hidden xs:block w-3 h-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <div className="h-2 sm:h-3 bg-gray-800 rounded-full w-12"></div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full hidden sm:block"></div>
                    <div className="h-2 sm:h-3 bg-gray-800 rounded-full w-16"></div>
                  </div>
                </div>
                
                {/* Content skeleton */}
                <div className="space-y-2 mb-3">
                  <div className="h-3 sm:h-4 bg-gray-700 rounded-full w-full"></div>
                  <div className="h-3 sm:h-4 bg-gray-700 rounded-full w-4/5"></div>
                  <div className="h-3 sm:h-4 bg-gray-700 rounded-full w-2/3"></div>
                </div>
                
                {/* Actions skeleton */}
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 bg-gray-700 rounded"></div>
                    <div className="h-2 bg-gray-700 rounded w-4"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 bg-gray-700 rounded"></div>
                    <div className="h-2 bg-gray-700 rounded w-12 hidden xs:block"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state mejorado
  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-900/20 via-red-800/30 to-red-900/20 border border-red-500/30 rounded-xl p-4 sm:p-6 text-center backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-300 font-medium mb-1">Error al cargar comentarios</h3>
            <p className="text-red-400/80 text-sm">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 touch-manipulation"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header de comentarios con estadísticas hermosas */}
      <div className="flex items-center justify-between border-b border-gray-700/50 pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Comentarios
            {comments.length > 0 && (
              <span className="ml-2 text-sm sm:text-base text-blue-400 font-normal">
                ({comments.length})
              </span>
            )}
          </h2>
        </div>
        
        {/* Indicador de actividad */}
        <div className="flex items-center gap-1 text-gray-400 text-xs sm:text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">En vivo</span>
        </div>
      </div>

      {/* Create comment section mejorado */}
      {isAuthenticated ? (
        <div className="bg-gradient-to-r from-gray-800/50 via-gray-800/80 to-gray-800/50 border border-gray-700/50 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
          <CreateComment postId={postId} onCommentCreated={handleCommentCreated} />
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-900/10 via-purple-900/20 to-blue-900/10 border border-blue-500/20 rounded-xl p-4 sm:p-6 text-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1 sm:mb-2 text-sm sm:text-base">
                ¡Únete a la conversación!
              </h3>
              <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">
                Inicia sesión para participar en los comentarios
              </p>
              <a 
                href="/login" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 touch-manipulation text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Iniciar Sesión
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Comments section */}
      {comments.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-400 font-medium mb-2 text-sm sm:text-base">
                Aún no hay comentarios
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm">
                ¡Sé el primero en compartir tu opinión!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Contador de comentarios total */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-700/30 rounded-full px-3 py-1.5 text-xs sm:text-sm text-gray-400">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
            </div>
          </div>

          {/* Lista de comentarios con animaciones */}
          <div className="space-y-3 sm:space-y-4">
            {comments.map((comment, index) => (
              <div
                key={comment.id}
                className="animate-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CommentItem
                  comment={comment}
                  postId={postId}
                  onCommentDeleted={handleCommentDeleted}
                  onCommentUpdated={handleCommentUpdated}
                  onReplyAdded={handleReplyAdded}
                />
              </div>
            ))}
          </div>

          {/* Footer con estadísticas */}
          {comments.length > 5 && (
            <div className="text-center pt-4 border-t border-gray-700/30">
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Mostrando todos los comentarios
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentList;