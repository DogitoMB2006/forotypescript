import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import AudioWaveform from './AudioWaveform';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: string;
  className?: string;
}

const VoiceNotePlayer: FC<VoiceNotePlayerProps> = ({ audioUrl, duration, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.preload = 'metadata';

    const updateProgress = () => {
      if (audio.currentTime && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      } else {
        setTotalDuration(0);
      }
      generateStaticWaveform();
    };

    const handleCanPlay = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleError = () => {
      console.error('Error loading audio:', audioUrl);
      setTotalDuration(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    audio.load();

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  const generateStaticWaveform = () => {
    const levels = [];
    for (let i = 0; i < 40; i++) {
      const baseLevel = 0.15;
      const variation = Math.sin(i * 0.3) * 0.4 + Math.random() * 0.3;
      levels.push(Math.max(0.05, Math.min(0.9, baseLevel + variation)));
    }
    setAudioLevels(levels);
  };

  const setupAudioContext = async () => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      const updateAudioLevels = () => {
        if (analyser && isPlaying) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const normalizedLevel = Math.min(average / 100, 1);
          
          setAudioLevels(prev => {
            const newLevels = [...prev.slice(1), normalizedLevel];
            return newLevels;
          });
        }
        
        if (isPlaying) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
        }
      };

      if (isPlaying) {
        updateAudioLevels();
      }
    } catch (error) {
      console.error('Error setting up audio context:', error);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        await setupAudioContext();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !totalDuration || !isFinite(totalDuration)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * totalDuration;
    
    if (isFinite(seekTime) && seekTime >= 0 && seekTime <= totalDuration) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const progress = totalDuration > 0 && isFinite(totalDuration) && isFinite(currentTime) 
    ? (currentTime / totalDuration) * 100 
    : 0;

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-white text-sm font-medium">Nota de voz</span>
            <span className="text-gray-400 text-xs">
              {formatTime(currentTime)} / {totalDuration > 0 ? formatTime(totalDuration) : '0:00'}
            </span>
          </div>

          <div className="relative">
            <div 
              className="cursor-pointer"
              onClick={handleSeek}
            >
              <AudioWaveform levels={audioLevels} isPlaying={isPlaying} />
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center text-gray-400">
          <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span className="text-xs">{duration || (totalDuration > 0 ? formatTime(totalDuration) : '0:00')}</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceNotePlayer;