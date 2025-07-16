import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';
import { processAudioForBetterQuality } from '../utils/audioProcessor';

export const uploadAudioFile = async (audioBlob: Blob, userId: string): Promise<string> => {
  try {
    console.log('Uploading audio blob:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    if (audioBlob.size === 0) {
      throw new Error('El archivo de audio está vacío');
    }
    
    // Procesar audio para mejor calidad
    const processedBlob = await processAudioForBetterQuality(audioBlob);
    
    let fileName = `voice_note_${Date.now()}`;
    let fileExtension = '.wav';
    let mimeType = 'audio/wav';
    
    const audioFile = new File([processedBlob], fileName + fileExtension, {
      type: mimeType
    });
    
    const audioRef = ref(storage, `audio/${userId}/${fileName + fileExtension}`);
    
    const metadata = {
      contentType: mimeType,
      customMetadata: {
        'Access-Control-Allow-Origin': '*',
        'originalSize': audioBlob.size.toString(),
        'processedSize': processedBlob.size.toString(),
        'uploadedAt': new Date().toISOString(),
        'quality': 'enhanced'
      }
    };
    
    const snapshot = await uploadBytes(audioRef, audioFile, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Audio uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw new Error('Error al subir el archivo de audio: ' + (error as Error).message);
  }
};

export const deleteAudioFile = async (audioUrl: string): Promise<void> => {
  try {
    const audioRef = ref(storage, audioUrl);
    await deleteObject(audioRef);
  } catch (error) {
    console.error('Error deleting audio file:', error);
  }
};