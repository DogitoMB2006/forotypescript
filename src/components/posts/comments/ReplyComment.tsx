import type { FC } from 'react';
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase/config';
import { useAuth } from '../../../hooks/useAuth';
import { createComment } from '../../../services/commentService';
import type { Comment } from '../../../services/commentService';
import Avatar from '../../ui/Avatar';
import VoiceNoteRecorder from '../../comments/VoiceNoteRecorder';

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
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

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

  const handleVoiceNote = async (audioBlob: Blob) => {
    if (!user || !userProfile) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Crear URL temporal para el audio
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const replyId = await createComment({
        content: `@${parentComment.authorUsername} [VOICE_NOTE]${audioUrl}[/VOICE_NOTE]`,
        postId,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName,
        parentId: parentComment.id,
        replyToUsername: parentComment.authorUsername
      });

      const newReply: Comment = {
        id: replyId,
        content: `@${parentComment.authorUsername} [VOICE_NOTE]${audioUrl}[/VOICE_NOTE]`,
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
      setShowVoiceRecorder(false);
      onCancel();
    } catch (error) {
      console.error('Error creating voice note reply:', error);
      setError('Error al enviar la nota de voz. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showVoiceRecorder) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 sm:p-3 ml-0 sm:ml-2">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <Avatar 
            src={userProfile?.profileImageUrl}
            name={userProfile?.displayName || 'Usuario'}
            size="sm"
            className="flex-shrink-0 mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <VoiceNoteRecorder 
              onVoiceNote={handleVoiceNote}
              disabled={isSubmitting}
              className="w-full"
            />
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Respuesta por voz a @{parentComment.authorUsername}</span>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white px-2 py-1 rounded text-xs transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 sm:p-3 ml-0 sm:ml-2">
      <div className="flex items-start space-x-2 sm:space-x-3">
        <Avatar 
          src={userProfile?.profileImageUrl}
          name={userProfile?.displayName || 'Usuario'}
          size="sm"
          className="flex-shrink-0 mt-1"
        />
        
        <form onSubmit={handleSubmit} className="flex-1 min-w-0">
          {error && (
            <div className="mb-2 p-2 bg-red-900/50 border border-red-500 rounded text-red-300 text-xs">
              {error}
            </div>
          )}
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Responder a @${parentComment.authorUsername}...`}
            className="w-full bg-gray-900 border border-gray-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none break-words"
            rows={2}
            maxLength={500}
            disabled={isSubmitting}
            autoFocus
            style={{ minHeight: '60px' }}
          />
          
          <div className="flex items-center justify-between mt-1.5 sm:mt-2 gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 flex-shrink-0">{content.length}/500</span>
              
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                disabled={isSubmitting}
                className="text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200 p-1"
                title="Grabar nota de voz"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white px-2 sm:px-3 py-1 rounded text-xs transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
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