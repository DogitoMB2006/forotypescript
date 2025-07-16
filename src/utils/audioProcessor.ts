export const processAudioForBetterQuality = async (audioBlob: Blob): Promise<Blob> => {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 48000
    });
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Normalizar el audio para mejor volumen
    const normalizedBuffer = normalizeAudio(audioBuffer, audioContext);
    
    // Aplicar compresión dinámica
    const compressedBuffer = await applyDynamicCompression(normalizedBuffer, audioContext);
    
    // Convertir de vuelta a blob
    const processedBlob = await audioBufferToBlob(compressedBuffer);
    
    audioContext.close();
    return processedBlob;
  } catch (error) {
    console.warn('Could not process audio, using original:', error);
    return audioBlob;
  }
};

const normalizeAudio = (audioBuffer: AudioBuffer, audioContext: AudioContext): AudioBuffer => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  const normalizedBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = normalizedBuffer.getChannelData(channel);
    
    // Encontrar el pico máximo
    let maxPeak = 0;
    for (let i = 0; i < length; i++) {
      const absSample = Math.abs(inputData[i]);
      if (absSample > maxPeak) {
        maxPeak = absSample;
      }
    }
    
    // Normalizar si hay contenido de audio
    const gain = maxPeak > 0 ? 0.95 / maxPeak : 1;
    for (let i = 0; i < length; i++) {
      outputData[i] = inputData[i] * gain;
    }
  }
  
  return normalizedBuffer;
};

const applyDynamicCompression = async (audioBuffer: AudioBuffer, audioContext: AudioContext): Promise<AudioBuffer> => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  // Crear un OfflineAudioContext para procesamiento
  const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
  
  // Crear nodos de audio
  const source = offlineContext.createBufferSource();
  const compressor = offlineContext.createDynamicsCompressor();
  const gainNode = offlineContext.createGain();
  
  // Configurar el compresor
  compressor.threshold.setValueAtTime(-18, offlineContext.currentTime);
  compressor.knee.setValueAtTime(6, offlineContext.currentTime);
  compressor.ratio.setValueAtTime(4, offlineContext.currentTime);
  compressor.attack.setValueAtTime(0.003, offlineContext.currentTime);
  compressor.release.setValueAtTime(0.1, offlineContext.currentTime);
  
  // Configurar ganancia de salida
  gainNode.gain.setValueAtTime(1.2, offlineContext.currentTime);
  
  // Conectar nodos
  source.buffer = audioBuffer;
  source.connect(compressor);
  compressor.connect(gainNode);
  gainNode.connect(offlineContext.destination);
  
  // Procesar audio
  source.start(0);
  const renderedBuffer = await offlineContext.startRendering();
  
  return renderedBuffer;
};

const audioBufferToBlob = async (audioBuffer: AudioBuffer): Promise<Blob> => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numberOfChannels * 2;
  
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  // WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
};