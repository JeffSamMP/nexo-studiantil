import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCtvDQwVQj1lA0-nt-WXhRtikfLQv1prvE",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "nexo-studiantil-a90ba.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "nexo-studiantil-a90ba",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "nexo-studiantil-a90ba.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "977322219217",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:977322219217:web:7c646ff38b63d6ee1c97f0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configurar proveedor de Google
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;