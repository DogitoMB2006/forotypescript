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
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 ml-8 mt-2">
      <div className="flex items-start space-x-3">
        <Avatar 
          src={userProfile?.profileImageUrl}
          name={userProfile?.displayName || 'Usuario'}
          size="sm"
          className="flex-shrink-0"
        />
        
        <form onSubmit={handleSubmit} className="flex-1">
          {error && (
            <div className="mb-2 p-2 bg-red-900/50 border border-red-500 rounded text-red-300 text-xs">
              {error}
            </div>
          )}
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Responder a @${parentComment.authorUsername}...`}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            maxLength={500}
            disabled={isSubmitting}
            autoFocus
          />
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{content.length}/500</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white px-3 py-1 rounded text-xs transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
              >
                {isSubmitting ? 'Enviando...' : 'Responder'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplyComment;