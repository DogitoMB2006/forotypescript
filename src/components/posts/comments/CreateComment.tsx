import type { FC } from 'react';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { createComment } from '../../../services/commentService';
import type { Comment } from '../../../services/commentService';
import Avatar from '../../ui/Avatar';

interface CreateCommentProps {
  postId: string;
  onCommentCreated: (comment: Comment) => void;
}

const CreateComment: FC<CreateCommentProps> = ({ postId, onCommentCreated }) => {
  const { user, userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !userProfile) return;

    setIsSubmitting(true);
    setError('');

    try {
      const commentId = await createComment({
        content: content.trim(),
        postId,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName
      });

      const newComment: Comment = {
        id: commentId,
        content: content.trim(),
        postId,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 0,
        likedBy: []
      };

      onCommentCreated(newComment);
      setContent('');
    } catch (error) {
      console.error('Error creating comment:', error);
      setError('Error al crear el comentario. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Avatar 
          src={userProfile?.profileImageUrl}
          name={userProfile?.displayName || 'Usuario'}
          size="md"
          className="flex-shrink-0"
        />
        
        <form onSubmit={handleSubmit} className="flex-1">
          {error && (
            <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe un comentario..."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={500}
            disabled={isSubmitting}
          />
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">{content.length}/500</span>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              {isSubmitting ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateComment;