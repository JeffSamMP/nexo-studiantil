import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

// Subir imagen de producto y obtener URL
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

    console.log('📤 Subiendo imagen:', file.name);

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${userId}_${timestamp}.${extension}`;
    const storageRef = ref(storage, `products/${fileName}`);

    // Subir archivo
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Imagen subida exitosamente');
    
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

    const extension = file.name.split('.').pop();
    const fileName = `profile_${userId}_${Date.now()}.${extension}`;
    const storageRef = ref(storage, `profiles/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Foto de perfil subida');
    return downloadURL;
  } catch (error) {
    console.error('❌ Error al subir foto de perfil:', error);
    throw error;
  }
};