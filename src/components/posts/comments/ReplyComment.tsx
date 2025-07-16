import type { FC } from 'react';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { createComment } from '../../../services/commentService';
import type { Comment } from '../../../services/commentService';
import Avatar from '../../ui/Avatar';

interface ReplyCommentProps {
  parentComment: Comment;
  postId: string;
  onReplyCreated: (reply: Comment) => void;
  onCancel: () => void;
}

const ReplyComment: FC<ReplyCommentProps> = ({ parentComment, postId, onReplyCreated, onCancel }) => {
  const { user, userProfile } = useAuth();
  const [content, setContent] = useState(`@${parentComment.authorUsername} `);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !userProfile) return;

    setIsSubmitting(true);
    setError('');

    try {
      const replyId = await createComment({
        content: content.trim(),
        postId,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName,
        parentId: parentComment.id,
        replyToUsername: parentComment.authorUsername
      });

      const newReply: Comment = {
        id: replyId,
        content: content.trim(),
        postId,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName,
        parentId: parentComment.id,
        replyToUsername: parentComment.authorUsername,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 0,
        likedBy: [],
        replies: []
      };

      onReplyCreated(newReply);
      setContent('');
      onCancel();
    } catch (error) {
      console.error('Error creating reply:', error);
      setError('Error al crear la respuesta. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 sm:p-3 ml-0 sm:ml-2">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-2 sm:space-x-3">
          <Avatar 
            src={userProfile?.profileImageUrl}
            name={userProfile?.displayName || 'Usuario'}
            size="sm"
            className="flex-shrink-0 mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Responder a @${parentComment.authorUsername}...`}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[60px] text-sm"
              disabled={isSubmitting}
              autoFocus
            />
            
            {error && (
              <div className="mt-2 text-red-400 text-xs">
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500">
                Respondiendo a @{parentComment.authorUsername}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting || content.length > 1000}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Responder</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReplyComment;