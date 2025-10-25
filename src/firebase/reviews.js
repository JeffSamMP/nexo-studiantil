import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './config';

// Agregar review a un producto
export const addReview = async (productId, reviewData) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    
    const review = {
      productId,
      userId: reviewData.userId,
      userName: reviewData.userName,
      userAvatar: reviewData.userAvatar,
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date().toISOString()
    };

    await addDoc(reviewsRef, review);
    console.log('✅ Review agregado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al agregar review:', error);
    return { success: false, error };
  }
};

// Obtener reviews de un producto
export const getProductReviews = async (productId) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef, 
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reviews = [];
    
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('✅ Reviews cargados:', reviews.length);
    return reviews;
  } catch (error) {
    console.error('❌ Error al cargar reviews:', error);
    return [];
  }
};

// Calcular rating promedio de un producto
export const calculateAverageRating = (reviews) => {
  if (reviews.length === 0) return 0;
  
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
};