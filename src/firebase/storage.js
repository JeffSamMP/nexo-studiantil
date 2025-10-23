import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

// Subir imagen y obtener URL
export const uploadProductImage = async (file, userId) => {
  try {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen no debe superar 5MB');
    }

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `products/${fileName}`);

    // Subir archivo
    console.log('📤 Subiendo imagen...');
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Imagen subida:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Error al subir imagen:', error);
    throw error;
  }
};

// Subir imagen de perfil
export const uploadProfileImage = async (file, userId) => {
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new Error('La imagen no debe superar 2MB');
    }

    const fileName = `profile_${userId}_${Date.now()}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `profiles/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error al subir imagen de perfil:', error);
    throw error;
  }
};