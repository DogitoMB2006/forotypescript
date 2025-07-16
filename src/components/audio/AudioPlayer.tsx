import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

const AudioPlayer: FC<AudioPlayerProps> = ({ audioUrl, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Configurar audio para mejor calidad
    audio.volume = volume;
    audio.preload = 'auto';

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded:', {
        duration: audio.duration,
        readyState: audio.readyState,
        networkState: audio.networkState
      });
      
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        setError(null);
      } else {
        console.warn('Invalid duration:', audio.duration);
        setDuration(0);
      }
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      console.log('Audio can play');
      setIsLoading(false);
      setError(null);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e, audio.error);
      setIsLoading(false);
      setError('Error al cargar el audio');
    };

    const handleLoadedData = () => {
      console.log('Audio data loaded');
      setIsLoading(false);
    };

    // Reset states
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    // Force load
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, volume]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        console.log('Attempting to play audio...');
        // Asegurar que el volumen esté configurado
        audio.volume = volume;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          console.log('Audio playing successfully');
        }
      }
    } catch (playError) {
      console.error('Error playing audio:', playError);
      setError('No se puede reproducir este audio');
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0 || error) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const newTime = clickRatio * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={`bg-red-900/30 border border-red-500 rounded-lg p-3 sm:p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-red-400 text-xs">Nota de voz no disponible</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 ${className}`}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="auto"
        controlsList="nodownload"
      />
      
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlayPause}
          disabled={isLoading || !!error}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            isLoading || error
              ? 'bg-gray-600 cursor-not-allowed' 
              : isPlaying 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h4v12H6zm8 0h4v12h-4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div 
            className={`relative rounded-full h-2 transition-colors duration-200 ${
              error ? 'bg-red-700' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
            }`}
            onClick={!error ? handleSeek : undefined}
          >
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${
                error ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs sm:text-sm text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2z"/>
                <path d="M19 10v2c0 3.87-3.13 7-7 7s-7-3.13-7-7v-2h2v2c0 2.76 2.24 5 5 5s5-2.24 5-5v-2h2z"/>
              </svg>
              <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-2">
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`
              }}
            />
            <span className="text-xs text-gray-400 w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;