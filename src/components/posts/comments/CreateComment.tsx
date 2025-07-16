import type { FC } from 'react';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { createComment } from '../../../services/commentService';
import { uploadAudioFile } from '../../../services/audioService';
import type { Comment } from '../../../services/commentService';
import Avatar from '../../ui/Avatar';
import AudioRecorder from '../../audio/AudioRecorder';

interface CreateCommentProps {
  postId: string;
  onCommentCreated: (comment: Comment) => void;
}

const CreateComment: FC<CreateCommentProps> = ({ postId, onCommentCreated }) => {
  const { user, userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

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

  const handleAudioRecordingComplete = async (audioBlob: Blob) => {
    if (!user || !userProfile) return;

    setIsUploadingAudio(true);
    setError('');

    try {
      const audioUrl = await uploadAudioFile(audioBlob, user.uid);
      
      const commentId = await createComment({
        audioUrl,
        postId,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName
      });

      const newComment: Comment = {
        id: commentId,
        audioUrl,
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
      setShowAudioRecorder(false);
    } catch (error) {
      console.error('Error creating audio comment:', error);
      setError('Error al enviar la nota de voz. Intenta de nuevo.');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleAudioRecordingCancel = () => {
    setShowAudioRecorder(false);
    setError('');
  };

  if (showAudioRecorder) {
    return (
      <div className="space-y-4">
        {isUploadingAudio && (
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <span className="text-blue-300 text-sm">Subiendo nota de voz...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        <AudioRecorder
          onRecordingComplete={handleAudioRecordingComplete}
          onCancel={handleAudioRecordingCancel}
          maxDuration={60}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4">
      <div className="flex items-start space-x-2 sm:space-x-3">
        <Avatar 
          src={userProfile?.profileImageUrl}
          name={userProfile?.displayName || 'Usuario'}
          size="md"
          className="flex-shrink-0 mt-1"
        />
        
        <form onSubmit={handleSubmit} className="flex-1 min-w-0">
          {error && (
            <div className="mb-3 p-2 sm:p-3 bg-red-900/50 border border-red-500 rounded text-red-300 text-xs sm:text-sm">
              {error}
            </div>
          )}
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe un comentario..."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base break-words"
            rows={3}
            maxLength={500}
            disabled={isSubmitting}
            style={{ minHeight: '80px' }}
          />
          
          <div className="flex items-center justify-between mt-2 sm:mt-3 gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 flex-shrink-0">{content.length}/500</span>
              
              <button
                type="button"
                onClick={() => setShowAudioRecorder(true)}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors duration-200 p-1 rounded"
                title="Enviar nota de voz"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2z"/>
                  <path d="M19 10v2c0 3.87-3.13 7-7 7s-7-3.13-7-7v-2h2v2c0 2.76 2.24 5 5 5s5-2.24 5-5v-2h2z"/>
                </svg>
                <span className="text-xs hidden sm:inline">Voz</span>
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 flex-shrink-0"
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