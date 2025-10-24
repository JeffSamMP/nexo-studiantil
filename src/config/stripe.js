import { loadStripe } from '@stripe/stripe-js';

// Reemplaza con tu Publishable Key de Stripe (empieza con pk_test_)
const stripePromise = loadStripe('pk_test_51SLEgLRzfAXxa6VYy4IscNpMS6sto4U15EvwmfutFPrn9TrUakavUO2UlXLRkhbYr3aXFvxwd9ksO8bS7yG4Aw7J00eNSqeKtJ');

export default stripePromise;