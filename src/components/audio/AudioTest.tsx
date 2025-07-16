import type { FC } from 'react';
import { useState } from 'react';
import AudioRecorder from './AudioRecorder';
import AudioPlayer from './AudioPlayer';

const AudioTest: FC = () => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);

  const handleRecordingComplete = (audioBlob: Blob) => {
    console.log('Audio blob received:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    setShowRecorder(false);
    
    // Crear un elemento de audio temporal para verificar
    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => {
      console.log('Audio metadata loaded:', {
        duration: tempAudio.duration,
        readyState: tempAudio.readyState
      });
    });
    tempAudio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
    });
  };

  const handleCancel = () => {
    setShowRecorder(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-white text-lg font-bold">Test de Audio</h3>
      
      {!showRecorder && !audioUrl && (
        <button
          onClick={() => setShowRecorder(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Probar Grabadora
        </button>
      )}
      
      {showRecorder && (
        <div className="space-y-4">
          <h4 className="text-white">Grabando...</h4>
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onCancel={handleCancel}
            maxDuration={30}
          />
        </div>
      )}
      
      {audioUrl && (
        <div className="space-y-4">
          <h4 className="text-white">Reproducir grabación:</h4>
          <AudioPlayer audioUrl={audioUrl} />
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (audioUrl) {
                  URL.revokeObjectURL(audioUrl);
                }
                setAudioUrl(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Eliminar
            </button>
            <button
              onClick={() => setShowRecorder(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Grabar Nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTest;