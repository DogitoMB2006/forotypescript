// src/components/call/MicrophoneSelector.tsx
import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Mic, Volume2, X } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      loadAudioDevices();
    }
  }, [isOpen]);

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
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={loading}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
        title="Seleccionar dispositivos de audio"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">Dispositivos de Audio</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                  <span className="text-sm text-gray-400">Cargando dispositivos...</span>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Mic className="w-5 h-5 text-blue-500" />
                      <span className="text-base font-medium text-white">Micrófono</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                      {microphones.length > 0 ? (
                        microphones.map((mic) => (
                          <button
                            key={mic.deviceId}
                            onClick={() => handleMicrophoneSelect(mic.deviceId)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border ${
                              currentMicId === mic.deviceId
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <div className="font-medium truncate">{mic.label}</div>
                            {currentMicId === mic.deviceId && (
                              <div className="text-xs text-blue-200 mt-1">✓ Seleccionado</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm px-4 py-3 text-center border border-gray-600 rounded-lg">
                          No se encontraron micrófonos
                        </div>
                      )}
                    </div>
                  </div>

                  {onSpeakerChange && (
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <Volume2 className="w-5 h-5 text-green-500" />
                        <span className="text-base font-medium text-white">Altavoz</span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                        {speakers.length > 0 ? (
                          speakers.map((speaker) => (
                            <button
                              key={speaker.deviceId}
                              onClick={() => handleSpeakerSelect(speaker.deviceId)}
                              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border ${
                                currentSpeakerId === speaker.deviceId
                                  ? 'bg-green-600 text-white border-green-500'
                                  : 'text-gray-300 hover:bg-gray-800 hover:text-white border-gray-600 hover:border-gray-500'
                              }`}
                            >
                              <div className="font-medium truncate">{speaker.label}</div>
                              {currentSpeakerId === speaker.deviceId && (
                                <div className="text-xs text-green-200 mt-1">✓ Seleccionado</div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm px-4 py-3 text-center border border-gray-600 rounded-lg">
                            Altavoces no disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={loadAudioDevices}
                      disabled={loading}
                      className="w-full py-3 text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-800 border border-gray-600 hover:border-gray-500"
                    >
                      🔄 Actualizar dispositivos
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MicrophoneSelector;