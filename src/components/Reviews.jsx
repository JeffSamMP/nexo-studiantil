import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';

export const ReviewModal = ({ product, onClose, currentUser }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      alert('Por favor escribe un comentario');
      return;
    }

    setSubmitting(true);

    try {
      const { addReview } = await import('../firebase/reviews');
      
      await addReview(product.id, {
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        rating: rating,
        comment: comment.trim()
      });

      alert('¡Gracias por tu review! 🎉');
      setComment('');
      setRating(5);
      onClose();
    } catch (error) {
      console.error('Error al enviar review:', error);
      alert('Error al enviar la review. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Calificar Producto</h2>
            <p className="text-gray-600">{product.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block font-semibold mb-3">Tu calificación:</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-all"
                >
                  <Star
                    size={40}
                    className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {rating === 5 ? '¡Excelente!' : rating === 4 ? 'Muy bueno' : rating === 3 ? 'Bueno' : rating === 2 ? 'Regular' : 'Malo'}
            </p>
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2">Tu comentario:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32"
              placeholder="Cuéntanos tu experiencia con este producto..."
              required
              disabled={submitting}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:bg-gray-400"
            >
              {submitting ? 'Enviando...' : 'Publicar Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    const { getProductReviews } = await import('../firebase/reviews');
    const productReviews = await getProductReviews(productId);
    setReviews(productReviews);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600">Cargando reviews...</div>;
  }

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold">Opiniones</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Star className="text-yellow-400 fill-yellow-400" size={24} />
            <span className="text-xl font-bold">{avgRating}</span>
            <span className="text-gray-600">({reviews.length} reviews)</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay reviews aún. ¡Sé el primero en opinar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <img
                  src={review.userAvatar}
                  alt={review.userName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=6366f1&color=fff`;
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">{review.userName}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};