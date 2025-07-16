import type { FC } from 'react';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { createComment } from '../../../services/commentService';
import { uploadAudioFile } from '../../../services/audioService';
import type { Comment } from '../../../services/commentService';
import Avatar from '../../ui/Avatar';
import AudioRecorder from '../../audio/AudioRecorder';

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
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

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

  const handleAudioRecordingComplete = async (audioBlob: Blob) => {
    if (!user || !userProfile) return;

    setIsUploadingAudio(true);
    setError('');

    try {
      const audioUrl = await uploadAudioFile(audioBlob, user.uid);
      
      const replyId = await createComment({
        audioUrl,
        postId,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName,
        parentId: parentComment.id,
        replyToUsername: parentComment.authorUsername
      });

      const newReply: Comment = {
        id: replyId,
        audioUrl,
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
      setShowAudioRecorder(false);
      onCancel();
    } catch (error) {
      console.error('Error creating audio reply:', error);
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
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 sm:p-3 ml-0 sm:ml-2 space-y-3">
        <div className="flex items-center space-x-2">
          <Avatar 
            src={userProfile?.profileImageUrl}
            name={userProfile?.displayName || 'Usuario'}
            size="sm"
            className="flex-shrink-0"
          />
          <span className="text-gray-400 text-sm">
            Respondiendo a @{parentComment.authorUsername}
          </span>
        </div>
        
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
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 sm:p-3 ml-0 sm:ml-2">
      <div className="flex items-start space-x-2">
        <Avatar 
          src={userProfile?.profileImageUrl}
          name={userProfile?.displayName || 'Usuario'}
          size="sm"
          className="flex-shrink-0 mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <span className="text-gray-400 text-sm">
              Respondiendo a @{parentComment.authorUsername}
            </span>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2 bg-red-900/50 border border-red-500 rounded text-red-300 text-xs">
                {error}
              </div>
            )}
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe una respuesta..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm break-words"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
              autoFocus
            />
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 flex-shrink-0">{content.length}/500</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAudioRecorder(true)}
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 transition-all duration-200 p-2 rounded-lg border border-blue-500/30 hover:border-blue-400/50"
                  title="Enviar nota de voz"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2z"/>
                    <path d="M19 10v2c0 3.87-3.13 7-7 7s-7-3.13-7-7v-2h2v2c0 2.76 2.24 5 5 5s5-2.24 5-5v-2h2z"/>
                  </svg>
                  <span className="text-sm font-medium">Voz</span>
                </button>
                
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-white px-3 py-1.5 rounded text-sm transition-colors duration-200"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>{isSubmitting ? 'Enviando...' : 'Responder'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReplyComment;