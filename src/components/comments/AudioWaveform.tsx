import type { FC } from 'react';
import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  levels: number[];
  isRecording?: boolean;
  isPlaying?: boolean;
  className?: string;
}

const AudioWaveform: FC<AudioWaveformProps> = ({ 
  levels, 
  isRecording = false, 
  isPlaying = false, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (levels.length === 0) {
        drawStaticWave(ctx, width, height);
      } else {
        drawDynamicWave(ctx, width, height, levels, isRecording, isPlaying);
      }

      if (isRecording || isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [levels, isRecording, isPlaying]);

  const drawStaticWave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const barCount = Math.floor(width / 4);
    const barWidth = 2;
    const barSpacing = 4;

    ctx.fillStyle = '#4B5563';

    for (let i = 0; i < barCount; i++) {
      const x = i * barSpacing;
      const baseHeight = height * 0.3;
      const variation = Math.sin(i * 0.5) * height * 0.2;
      const barHeight = baseHeight + variation;
      const y = (height - barHeight) / 2;

      ctx.fillRect(x, y, barWidth, barHeight);
    }
  };

  const drawDynamicWave = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    levels: number[], 
    recording: boolean, 
    playing: boolean
  ) => {
    const barCount = Math.floor(width / 4);
    const barWidth = 2;
    const barSpacing = 4;

    for (let i = 0; i < barCount; i++) {
      const x = i * barSpacing;
      
      let barHeight: number;
      let alpha = 1;

      if (i < levels.length) {
        const level = levels[levels.length - 1 - i] || 0;
        barHeight = Math.max(height * 0.1, level * height * 0.8);
        
        if (recording) {
          const fadeDistance = 5;
          const distanceFromLatest = i;
          alpha = Math.max(0.2, 1 - (distanceFromLatest / fadeDistance));
        }
      } else {
        barHeight = height * (0.1 + Math.random() * 0.2);
        alpha = 0.3;
      }

      const y = (height - barHeight) / 2;

      if (recording) {
        const hue = 200 + (levels[levels.length - 1 - i] || 0) * 60;
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
      } else if (playing) {
        const playingAlpha = 0.5 + Math.sin(Date.now() * 0.01 + i * 0.1) * 0.3;
        ctx.fillStyle = `rgba(59, 130, 246, ${playingAlpha})`;
      } else {
        ctx.fillStyle = `rgba(75, 85, 99, ${alpha})`;
      }

      ctx.fillRect(x, y, barWidth, barHeight);
    }

    if (recording) {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
      gradient.addColorStop(0.7, 'rgba(239, 68, 68, 0.2)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.6)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={200}
        height={40}
        className="w-full h-8 sm:h-10"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {isRecording && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-red-500/10 to-red-500/20 animate-pulse rounded"></div>
        </div>
      )}
      
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-blue-500/10 to-blue-500/20 animate-pulse rounded"></div>
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;