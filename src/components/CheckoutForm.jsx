import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // En producción, aquí crearías un Payment Intent desde tu backend
      // Por ahora, simularemos el pago
      
      const cardElement = elements.getElement(CardElement);

      // Crear método de pago
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Método de pago creado:', paymentMethod.id);

      // Simular pago exitoso (en producción usarías tu backend)
      setTimeout(() => {
        setProcessing(false);
        onSuccess({
          paymentMethodId: paymentMethod.id,
          amount: amount
        });
      }, 1500);

    } catch (err) {
      console.error('❌ Error en el pago:', err);
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-semibold mb-2">Información de Tarjeta</label>
        <div className="border rounded-lg p-4 bg-gray-50">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          💳 Usa la tarjeta de prueba: 4242 4242 4242 4242
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-indigo-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total a pagar:</span>
          <span className="text-2xl font-bold text-indigo-600">${amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {processing ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm;