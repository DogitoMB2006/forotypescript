import type { FC } from 'react';
import { useState } from 'react';
import type { Comment } from '../../../services/commentService';

interface EditCommentProps {
  comment: Comment;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

const EditComment: FC<EditCommentProps> = ({ comment, onSave, onCancel }) => {
  const [content, setContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSaving(true);
    setError('');

    try {
      await onSave(content.trim());
    } catch (error) {
      console.error('Error saving comment:', error);
      setError('Error al guardar el comentario. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-medium">
            {comment.authorDisplayName?.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1">
          {error && (
            <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={500}
            disabled={isSaving}
            autoFocus
          />
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">{content.length}/500</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="text-gray-400 hover:text-white px-3 py-1 rounded text-sm transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!content.trim() || isSaving || content.trim() === comment.content}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-1 rounded text-sm font-medium transition-colors duration-200"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditComment;