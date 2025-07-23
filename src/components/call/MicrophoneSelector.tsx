// src/components/call/MicrophoneSelector.tsx
import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Mic, Volume2 } from 'lucide-react';

interface MicrophoneSelectorProps {
  onMicrophoneChange: (deviceId: string) => void;
  onSpeakerChange?: (deviceId: string) => void;
  currentMicId?: string;
  currentSpeakerId?: string;
  isDisabled?: boolean;
}

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

const MicrophoneSelector = ({ 
  onMicrophoneChange, 
  onSpeakerChange, 
  currentMicId, 
  currentSpeakerId,
  isDisabled = false
}: MicrophoneSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAudioDevices();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAudioDevices = async () => {
    if (isDisabled) return;
    
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevs = devices
        .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `${device.kind === 'audioinput' ? 'Micrófono' : 'Altavoz'} ${device.deviceId.slice(0, 8)}`,
          kind: device.kind as 'audioinput' | 'audiooutput'
        }));
      
      setAudioDevices(audioDevs);
    } catch (error) {
      console.error('Error loading audio devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const microphones = audioDevices.filter(device => device.kind === 'audioinput');
  const speakers = audioDevices.filter(device => device.kind === 'audiooutput');

  const handleMicrophoneSelect = async (deviceId: string) => {
    try {
      await onMicrophoneChange(deviceId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error selecting microphone:', error);
    }
  };

  const handleSpeakerSelect = async (deviceId: string) => {
    if (onSpeakerChange) {
      try {
        await onSpeakerChange(deviceId);
        setIsOpen(false);
      } catch (error) {
        console.error('Error selecting speaker:', error);
      }
    }
  };

  if (isDisabled) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
        title="Seleccionar dispositivos de audio"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl min-w-64 max-w-80 z-50">
          <div className="p-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <span className="text-sm text-gray-400">Cargando dispositivos...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mic className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-white">Micrófono</span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {microphones.length > 0 ? (
                      microphones.map((mic) => (
                        <button
                          key={mic.deviceId}
                          onClick={() => handleMicrophoneSelect(mic.deviceId)}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            currentMicId === mic.deviceId
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                          title={mic.label}
                        >
                          <div className="truncate">{mic.label}</div>
                        </button>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm px-3 py-2">
                        No se encontraron micrófonos
                      </div>
                    )}
                  </div>
                </div>

                {onSpeakerChange && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-white">Altavoz</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {speakers.length > 0 ? (
                        speakers.map((speaker) => (
                          <button
                            key={speaker.deviceId}
                            onClick={() => handleSpeakerSelect(speaker.deviceId)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              currentSpeakerId === speaker.deviceId
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                            title={speaker.label}
                          >
                            <div className="truncate">{speaker.label}</div>
                          </button>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm px-3 py-2">
                          Altavoces no disponibles
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-600">
                  <button
                    onClick={() => {
                      loadAudioDevices();
                    }}
                    disabled={loading}
                    className="w-full text-center py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    Actualizar dispositivos
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MicrophoneSelector;