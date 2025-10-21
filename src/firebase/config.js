import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCtvDQwVQj1lA0-nt-WXhRtikfLQv1prvE",
  authDomain: "nexo-studiantil-a90ba.firebaseapp.com",
  projectId: "nexo-studiantil-a90ba",
  storageBucket: "nexo-studiantil-a90ba.firebasestorage.app",
  messagingSenderId: "977322219217",
  appId: "1:977322219217:web:7c646ff38b63d6ee1c97f0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
