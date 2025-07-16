import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
  maxDuration?: number;
}

const AudioRecorder: FC<AudioRecorderProps> = ({ 
  onRecordingComplete, 
  onCancel, 
  maxDuration = 60 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
          volume: 1.0
        } 
      });
      
      // Detectar el mejor formato soportado
      let mimeType = '';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('Using MIME type:', mimeType);
      
      const recorderOptions = mimeType 
        ? { 
            mimeType,
            audioBitsPerSecond: 128000
          }
        : { audioBitsPerSecond: 128000 };
      
      const recorder = new MediaRecorder(stream, recorderOptions);
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };
      
      recorder.onstop = () => {
        console.log('Recording stopped, chunks:', chunks.length);
        
        if (chunks.length === 0) {
          console.error('No audio data recorded');
          alert('No se pudo grabar audio. Intenta de nuevo.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        const finalMimeType = recorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: finalMimeType });
        
        console.log('Final audio blob:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
        
        if (audioBlob.size === 0) {
          console.error('Empty audio blob');
          alert('La grabación está vacía. Intenta de nuevo.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.onerror = (event) => {
        console.error('Recording error:', event);
        alert('Error durante la grabación');
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start(500);
      setIsRecording(true);
      setDuration(0);
      
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRecording(false);
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (duration / maxDuration) * 100;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <div 
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h4v12H6zm8 0h4v12h-4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm5.3 6.7c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4-1.27 1.27-2.9 2.28-4.8 2.85l.9.9c.4.4.4 1 0 1.4-.2.2-.4.3-.7.3s-.5-.1-.7-.3l-2.1-2.1c-.4-.4-.4-1 0-1.4l2.1-2.1c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-.9.9c1.35-.41 2.58-1.17 3.6-2.19zM11 14h2v4h-2v-4z"/>
              </svg>
            )}
          </div>
          
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
          )}
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-white text-xl sm:text-2xl font-mono mb-2">
          {formatTime(duration)}
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage > 80 ? 'bg-red-500' : progressPercentage > 60 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        
        <p className="text-gray-400 text-sm">
          {isRecording ? 'Grabando...' : 'Toca para empezar a grabar'}
        </p>
        
        {duration > 0 && duration < maxDuration && (
          <p className="text-gray-500 text-xs mt-1">
            Máximo {maxDuration} segundos
          </p>
        )}
      </div>

      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          <>
            <button
              onClick={cancelRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Cancelar</span>
            </button>
            
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2z"/>
                <path d="M19 10v2c0 3.87-3.13 7-7 7s-7-3.13-7-7v-2h2v2c0 2.76 2.24 5 5 5s5-2.24 5-5v-2h2z"/>
              </svg>
              <span>Grabar</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={cancelRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Cancelar</span>
            </button>
            
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z"/>
              </svg>
              <span>Enviar</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;