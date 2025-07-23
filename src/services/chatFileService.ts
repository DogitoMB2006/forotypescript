import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

export const uploadChatFile = async (file: File, chatId: string, messageId: string): Promise<string> => {
  try {
    console.log('ChatFileService: Uploading file', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      chatId,
      messageId 
    });

    
    const isImage = file.type.startsWith('image/');
    const folder = isImage ? 'images' : 'audio';
    
    
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'unknown';
    const fileName = `${messageId}_${timestamp}.${fileExtension}`;
    const filePath = `chats/${chatId}/${folder}/${fileName}`;
    
    console.log('ChatFileService: File path:', filePath);
    
   
    const fileRef = ref(storage, filePath);
    const snapshot = await uploadBytes(fileRef, file);
    
    console.log('ChatFileService: File uploaded successfully');
    
  
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('ChatFileService: Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading chat file:', error);
    throw error;
  }
};

export const deleteChatFile = async (fileUrl: string): Promise<void> => {
  try {
    console.log('ChatFileService: Deleting file:', fileUrl);
    
   
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid file URL');
    }
    
    const filePath = decodeURIComponent(pathMatch[1]);
    console.log('ChatFileService: File path extracted:', filePath);
    
    
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    
    console.log('ChatFileService: File deleted successfully');
  } catch (error) {
    console.error('Error deleting chat file:', error);
    throw error;
  }
};

export const validateChatFile = (file: File): { valid: boolean; error?: string } => {
 
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];
  const validTypes = [...validImageTypes, ...validAudioTypes];
  
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP) y audios (MP3, WAV, OGG, MP4, WebM)'
    };
  }
  
  // Validar tamaño (max 25MB para imágenes, 50MB para audio) pa que eto animale no se pasen
  const maxImageSize = 25 * 1024 * 1024; // 25MB
  const maxAudioSize = 50 * 1024 * 1024; // 50MB
  const isImage = file.type.startsWith('image/');
  const maxSize = isImage ? maxImageSize : maxAudioSize;
  
  if (file.size > maxSize) {
    const maxSizeMB = isImage ? 25 : 50;
    return {
      valid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
};