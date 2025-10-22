import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './config';

// Colección de productos
const productsCollection = collection(db, 'products');

// Obtener todos los productos
export const getProducts = async () => {
  try {
    const q = query(productsCollection, where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('Productos cargados desde Firestore:', products.length);
    return products;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
};

// Obtener productos pendientes (para admin)
export const getPendingProducts = async () => {
  try {
    const q = query(productsCollection, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error al obtener productos pendientes:', error);
    return [];
  }
};

// Crear nuevo producto
export const createProduct = async (productData) => {
  try {
    const docRef = await addDoc(productsCollection, {
      ...productData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      rating: 0,
      reviews: 0,
      sales: 0
    });
    
    return { id: docRef.id, ...productData };
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw error;
  }
};

// Aprobar producto
export const approveProduct = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      status: 'approved',
      approvedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error al aprobar producto:', error);
    return false;
  }
};

// Rechazar/eliminar producto
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    return true;
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return false;
  }
};

// Actualizar producto
export const updateProduct = async (productId, updates) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, updates);
    return true;
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return false;
  }
};