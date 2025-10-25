import React, { useState, useEffect } from 'react';
import { ReviewModal, ProductReviews } from './components/Reviews';
import { ShoppingCart, User, Search, Heart, Star, Upload, X, DollarSign, Check, Clock, Package } from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, db } from './firebase/config';
import { getProducts, getPendingProducts, createProduct, approveProduct, deleteProduct } from './firebase/products';
import { doc, getDoc, setDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from './config/stripe';
import CheckoutForm from './components/CheckoutForm';
import { sendWelcomeEmail, sendOrderConfirmationEmail } from './config/emailjs';



const NexoStudiantil = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('marketplace');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState(''); // 'cart', 'upload', 'buy'

  const categories = [
    { id: 'all', name: 'Todas las Categorías', icon: '🎨' },
    { id: 'design', name: 'Diseño Gráfico', icon: '🎨' },
    { id: 'illustration', name: 'Ilustración', icon: '✏️' },
    { id: 'software', name: 'Software', icon: '💻' },
    { id: 'photography', name: 'Fotografía', icon: '📸' },
    { id: 'video', name: 'Video', icon: '🎥' },
    { id: 'music', name: 'Música', icon: '🎵' }
  ];

useEffect(() => {
  const initProducts = async () => {
    await seedInitialProducts();
    await loadProducts();
  };
  initProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const loadProducts = async () => {
  const productsData = await getProducts();
  setProducts(productsData);
};

const loadPendingProducts = async () => {
  const pendingData = await getPendingProducts();
  setPendingProducts(pendingData);
};

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Obtener datos del usuario desde Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Obtener avatar de mejor calidad
          let avatarUrl = user.photoURL || userData.avatar;
          if (avatarUrl && avatarUrl.includes('googleusercontent.com')) {
            avatarUrl = avatarUrl.replace('s96-c', 's400-c');
          }
          
          setCurrentUser({
            id: user.uid,
            name: user.displayName || userData.name,
            email: user.email,
            role: userData.role,
            avatar: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || userData.name)}&background=6366f1&color=fff`
          });
          
          console.log('✅ Sesión restaurada:', user.displayName);
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      }
    } else {
      setCurrentUser(null);
    }
  });

  return () => unsubscribe();
}, []);

const seedInitialProducts = async () => {
  try {
    console.log('🔥 Verificando productos existentes...');
    
    // Verificar si ya hay productos aprobados
    const querySnapshot = await getDocs(collection(db, 'products'));
    const existingProducts = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'approved') {
        existingProducts.push(doc.id);
      }
    });
    
    console.log('📦 Productos existentes:', existingProducts.length);
    
    if (existingProducts.length > 0) {
      console.log('⚠️ Ya hay productos aprobados, no se crearán duplicados');
      return; // DETIENE LA FUNCIÓN AQUÍ
    }

    console.log('✅ No hay productos, creando iniciales...');
    
    const initialProducts = [
      {
        title: 'Logo Moderno Minimalista',
        description: 'Diseño de logo profesional con concepto minimalista. Incluye versiones en color y blanco/negro.',
        price: 45,
        category: 'design',
        seller: 'María González',
        sellerId: 'demo1',
        sellerEmail: 'maria@example.com',
        rating: 4.8,
        reviews: 23,
        image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop',
        sales: 45
      },
      {
        title: 'Ilustración Digital Personalizada',
        description: 'Ilustración única en estilo cartoon/anime según tus especificaciones.',
        price: 60,
        category: 'illustration',
        seller: 'Carlos Ruiz',
        sellerId: 'demo2',
        sellerEmail: 'carlos@example.com',
        rating: 4.9,
        reviews: 31,
        image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=300&fit=crop',
        sales: 67
      },
      {
        title: 'App Móvil React Native',
        description: 'Desarrollo de aplicación móvil cross-platform con React Native. UI/UX incluido.',
        price: 250,
        category: 'software',
        seller: 'Ana Martínez',
        sellerId: 'demo3',
        sellerEmail: 'ana@example.com',
        rating: 5.0,
        reviews: 12,
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop',
        sales: 28
      },
      {
        title: 'Sesión Fotográfica Profesional',
        description: 'Sesión de fotos de producto o retrato. Incluye 20 fotos editadas en alta resolución.',
        price: 80,
        category: 'photography',
        seller: 'Luis Fernández',
        sellerId: 'demo4',
        sellerEmail: 'luis@example.com',
        rating: 4.7,
        reviews: 19,
        image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop',
        sales: 34
      },
      {
        title: 'Video Promocional Animado',
        description: 'Video animado de 30-60 segundos para redes sociales o presentaciones.',
        price: 120,
        category: 'video',
        seller: 'Sofía López',
        sellerId: 'demo5',
        sellerEmail: 'sofia@example.com',
        rating: 4.9,
        reviews: 15,
        image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop',
        sales: 41
      },
      {
        title: 'Composición Musical Original',
        description: 'Música original para proyectos, videojuegos o contenido multimedia.',
        price: 95,
        category: 'music',
        seller: 'Diego Torres',
        sellerId: 'demo6',
        sellerEmail: 'diego@example.com',
        rating: 4.8,
        reviews: 8,
        image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop',
        sales: 22
      }
    ];

    for (const product of initialProducts) {
      await addDoc(collection(db, 'products'), {
        ...product,
        status: 'approved',
        createdAt: new Date().toISOString()
      });
    }

    console.log('✅ 6 productos iniciales creados exitosamente');
    await loadProducts();
  } catch (error) {
    console.error('❌ Error al poblar productos:', error);
  }
};

const handleRegister = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Verificar si ya está registrado
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      alert('Ya tienes una cuenta. Usa "Iniciar Sesión".');
      await signOut(auth);
      return;
    }
    
    // Determinar rol
    const role = user.email === 'samirmp123@gmail.com' ? 'admin' : 'student';
    
    // Obtener foto de perfil de alta calidad
    let avatarUrl = user.photoURL;
    if (avatarUrl) {
      // Cambiar tamaño de imagen de Google para mejor calidad
      avatarUrl = avatarUrl.replace('s96-c', 's400-c');
    }
    
    console.log('📸 Avatar URL:', avatarUrl);
    
    // Guardar nuevo usuario
    await setDoc(doc(db, 'users', user.uid), {
      name: user.displayName,
      email: user.email,
      role: role,
      avatar: avatarUrl,
      createdAt: new Date().toISOString()
    });
   await setDoc(doc(db, 'users', user.uid), {
  name: user.displayName,
  email: user.email,
  role: role,
  avatar: avatarUrl,
  createdAt: new Date().toISOString()
});

// Enviar email de bienvenida
try {
  await sendWelcomeEmail(user.displayName, user.email, role);
} catch (error) {
  console.error('Error al enviar email de bienvenida:', error);
}

    setCurrentUser({
      id: user.uid,
      name: user.displayName,
      email: user.email,
      role: role,
      avatar: user.photoURL
    });
    
    // Redirigir según rol
    if (role === 'admin') {
      alert('¡Bienvenido Administrador!');
      setCurrentView('admin');
    } else {
      alert('¡Registro exitoso! Bienvenido a NEXO STUDIANTIL');
      setCurrentView('marketplace');
    }
    
  } catch (error) {
    console.error('Error al registrarse:', error);
    alert('Error al registrarse. Intenta de nuevo.');
  }
};

const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Verificar si el usuario ya está registrado
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Usuario nuevo - debe registrarse
      alert('Debes registrarte primero. Click en "Crear Cuenta Gratis".');
      await signOut(auth);
      return;
    }
    
    // Usuario ya registrado - obtener su rol
    const userData = userDoc.data();
    
// Obtener avatar de mejor calidad
let avatarUrl = user.photoURL || userData.avatar;
if (avatarUrl && avatarUrl.includes('googleusercontent.com')) {
  avatarUrl = avatarUrl.replace('s96-c', 's400-c');
}

setCurrentUser({
  id: user.uid,
  name: user.displayName || userData.name,
  email: user.email,
  role: userData.role,
  avatar: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || userData.name)}&background=6366f1&color=fff`
});

console.log('👤 Usuario cargado:', user.displayName, 'Avatar:', avatarUrl);
    
    // Redirigir según rol
    if (userData.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('marketplace');
    }
    
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    alert('Error al iniciar sesión con Google. Intenta de nuevo.');
  }
};

 const addToCart = (product) => {
  if (!requireLogin('cart')) return;
  
  if (!cart.find(item => item.id === product.id)) {
    setCart([...cart, product]);
    alert('Producto agregado al carrito');
  } else {
    alert('Este producto ya está en tu carrito');
  }
};
const requireLogin = (action) => {
  if (!currentUser) {
    setLoginAction(action);
    setShowLoginModal(true);
    return false;
  }
  return true;
};

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleCheckout = async () => {
  const newOrder = {
    id: `ORD-${Date.now()}`,
    items: [...cart],
    total: cart.reduce((sum, item) => sum + item.price, 0),
    status: 'pending',
    date: new Date().toLocaleDateString(),
    buyer: currentUser.name
  };
  
  setOrders([...orders, newOrder]);
  setCart([]);
  
  // Enviar email de confirmación
  try {
    const { sendOrderConfirmationEmail } = await import('./config/emailjs');
    await sendOrderConfirmationEmail(currentUser.name, currentUser.email, newOrder);
    alert('¡Pedido realizado con éxito! Revisa tu email para la confirmación.');
  } catch (error) {
    console.error('Error al enviar email:', error);
    alert('¡Pedido realizado con éxito! (No se pudo enviar el email)');
  }
  
  setCurrentView('orders');
};

  const handleProductSubmit = async (productData) => {
  try {
    const newProduct = {
      ...productData,
      seller: currentUser.name,
      sellerId: currentUser.id,
      sellerEmail: currentUser.email
    };
    
    await createProduct(newProduct);
    alert('¡Producto enviado para revisión! El administrador lo aprobará pronto.');
    setCurrentView('marketplace');
  } catch (error) {
    console.error('Error al publicar producto:', error);
    alert('Error al publicar el producto. Intenta de nuevo.');
  }
};

  const handleApproveProduct = async (productId) => {
  try {
    const success = await approveProduct(productId);
    if (success) {
      alert('Producto aprobado exitosamente');
      await loadProducts();
      await loadPendingProducts();
    }
  } catch (error) {
    console.error('Error al aprobar producto:', error);
    alert('Error al aprobar el producto');
  }
};

  const handleRejectProduct = async (productId) => {
  try {
    const success = await deleteProduct(productId);
    if (success) {
      alert('Producto rechazado');
      await loadPendingProducts();
    }
  } catch (error) {
    console.error('Error al rechazar producto:', error);
    alert('Error al rechazar el producto');
  }
};

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesPrice = priceFilter === 'all' ||
                        (priceFilter === 'low' && product.price < 50) ||
                        (priceFilter === 'medium' && product.price >= 50 && product.price < 150) ||
                        (priceFilter === 'high' && product.price >= 150);
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            NEXO STUDIANTIL
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Tu marketplace de creatividad estudiantil
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
            Conectamos talento universitario con oportunidades. Compra y vende trabajos creativos de alta calidad.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => setCurrentView('marketplace')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg"
            >
              <Search size={20} />
              Explorar Marketplace
            </button>
            <button
              onClick={handleRegister}
              className="bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg"
            >
              <User size={20} />
              Comenzar Gratis
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="text-indigo-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Publica tus Trabajos</h3>
            <p className="text-gray-600">Muestra tu talento y vende tus creaciones a compradores interesados.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="text-purple-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Compra Seguro</h3>
            <p className="text-gray-600">Adquiere servicios y productos creativos con transacciones protegidas.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
              <Star className="text-pink-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Califica y Comenta</h3>
            <p className="text-gray-600">Comparte tu experiencia y ayuda a otros a tomar decisiones.</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
          <p className="text-xl mb-6">Únete a nuestra comunidad de creadores y compradores</p>
          <button
              onClick={handleRegister}
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all"
            >
              Crear Cuenta Gratis
          </button>
        </div>
      </div>
    </div>
  );

  const MarketplaceView = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar trabajos creativos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">💰 Todos los precios</option>
            <option value="low">$ Menos de $50</option>
            <option value="medium">$$ $50 - $150</option>
            <option value="high">$$$ Más de $150</option>
          </select>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer" onClick={() => setSelectedProduct(product)}>
            <div className="relative h-48 overflow-hidden bg-gray-200">
              <img src={product.image} alt={product.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
              <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full font-bold text-indigo-600">
                ${product.price}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg mb-2 line-clamp-1">{product.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <Star className="text-yellow-400 fill-yellow-400" size={16} />
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-gray-500 text-sm">({product.reviews})</span>
                </div>
                <span className="text-sm text-gray-500">{product.sales} ventas</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Por {product.seller}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No se encontraron productos con estos filtros</p>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold">{selectedProduct.title}</h2>
                <button onClick={() => setSelectedProduct(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-96 object-cover rounded-xl mb-6" />
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="text-yellow-400 fill-yellow-400" size={20} />
                  <span className="font-bold text-xl">{selectedProduct.rating}</span>
                  <span className="text-gray-500">({selectedProduct.reviews} reviews)</span>
                </div>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{selectedProduct.sales} ventas</span>
              </div>
              <p className="text-gray-700 text-lg mb-6">{selectedProduct.description}</p>
              <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl mb-6">
                <div>
                  <p className="text-gray-600 mb-1">Vendido por</p>
                  <p className="font-bold text-lg">{selectedProduct.seller}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 mb-1">Precio</p>
                  <p className="font-bold text-3xl text-indigo-600">${selectedProduct.price}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Agregar al Carrito
                </button>
                <button className="px-6 py-4 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all">
                  <Heart size={20} />
                </button>
              </div>

              {/* BOTÓN NUEVO PARA DEJAR REVIEW */}
              {currentUser && (
                <button
                  onClick={() => {
                    setShowReviewModal(true);
                  }}
                  className="w-full mt-4 bg-white border-2 border-indigo-600 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                >
                  <Star size={20} />
                  Dejar una Opinión
                </button>
              )}

              {/* SECCIÓN NUEVA DE REVIEWS */}
              <ProductReviews productId={selectedProduct.id} />
            </div>
          </div>
        </div>
      )}
```

    </div>
  );

  const CartView = () => {
  const [showCheckout, setShowCheckout] = useState(false);

  const handlePaymentSuccess = async (paymentData) => {
    console.log('✅ Pago exitoso:', paymentData);
    
    const newOrder = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      total: cart.reduce((sum, item) => sum + item.price, 0),
      status: 'paid',
      date: new Date().toLocaleDateString(),
      buyer: currentUser.name,
      paymentId: paymentData.paymentMethodId
    };
    
    setOrders([...orders, newOrder]);
    setCart([]);
    setShowCheckout(false);
    
    // Enviar email de confirmación
    try {
      await sendOrderConfirmationEmail(currentUser.name, currentUser.email, newOrder);
    } catch (error) {
      console.error('Error al enviar email:', error);
    }
    
    alert('¡Pago exitoso! Tu pedido ha sido confirmado. Revisa tu email.');
    setCurrentView('orders');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">Carrito de Compras</h2>
      
      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
          <button
            onClick={() => setCurrentView('marketplace')}
            className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Explorar Productos
          </button>
        </div>
      ) : showCheckout ? (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold mb-6">Checkout</h3>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Resumen del pedido:</h4>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between py-2 border-b">
                <span>{item.title}</span>
                <span className="font-semibold">${item.price}</span>
              </div>
            ))}
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm 
              amount={cart.reduce((sum, item) => sum + item.price, 0)}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowCheckout(false)}
            />
          </Elements>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {cart.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-xl shadow-md flex gap-6">
                <img src={item.image} alt={item.title} className="w-32 h-32 object-cover rounded-lg" />
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-2">Por {item.seller}</p>
                  <p className="font-bold text-2xl text-indigo-600">${item.price}</p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={24} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <span className="text-2xl font-bold">Total:</span>
              <span className="text-3xl font-bold text-indigo-600">
                ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all"
            >
              Proceder al Pago
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const UploadProductView = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'design'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar 5MB');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes');
        return;
      }

      setImageFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (!imageFile) {
      alert('Por favor selecciona una imagen');
      return;
    }

    setUploading(true);

    try {
      console.log('📤 Iniciando subida de producto...');
      
      // Subir imagen a Firebase Storage
      const { uploadProductImage } = await import('./firebase/storage');
      const imageUrl = await uploadProductImage(imageFile, currentUser.id);
      
      console.log('🖼️ URL de imagen obtenida:', imageUrl);
      
      // Crear producto con la URL real de la imagen
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image: imageUrl
      };

      await handleProductSubmit(productData);
      
      // Limpiar formulario
      setFormData({
        title: '',
        description: '',
        price: '',
        category: 'design'
      });
      setImageFile(null);
      setImagePreview(null);
      
      alert('¡Producto publicado exitosamente! Espera la aprobación del administrador.');
    } catch (error) {
      console.error('❌ Error al publicar:', error);
      alert('Error al subir la imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">Publicar Nuevo Trabajo</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg">
        
        <div className="mb-6">
          <label className="block font-semibold mb-2">Título del Trabajo *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Ej: Logo Moderno Minimalista"
            required
            disabled={uploading}
          />
        </div>
        
        <div className="mb-6">
          <label className="block font-semibold mb-2">Descripción *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32"
            placeholder="Describe tu trabajo en detalle..."
            required
            disabled={uploading}
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block font-semibold mb-2">Precio ($) *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="45"
              min="1"
              step="0.01"
              required
              disabled={uploading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Categoría *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              disabled={uploading}
            >
              {categories.filter(c => c.id !== 'all').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block font-semibold mb-2">Imagen de Portada * (máx. 5MB)</label>
          
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-64 object-cover rounded-lg mb-4 border-2 border-indigo-200"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                disabled={uploading}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all disabled:opacity-50"
              >
                <X size={20} />
              </button>
              <p className="text-sm text-gray-600 text-center">
                {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-all cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-600 font-semibold">Click para subir imagen</p>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF hasta 5MB</p>
              </label>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={uploading || !imageFile}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Subiendo imagen...
            </>
          ) : (
            <>
              <Upload size={20} />
              Publicar Trabajo
            </>
          )}
        </button>
        
        {uploading && (
          <p className="text-center text-gray-600 mt-4">
            Por favor espera, esto puede tardar unos segundos...
          </p>
        )}
      </form>
    </div>
  );
};
  const OrdersView = () => (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">Mis Pedidos</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No tienes pedidos aún</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl">Pedido {order.id}</h3>
                  <p className="text-gray-600">{order.date}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {order.status === 'pending' ? 'Pendiente' :
                   order.status === 'processing' ? 'Procesando' : 'Completado'}
                </span>
              </div>
              <div className="space-y-3 mb-4">
                {order.items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-gray-600 text-sm">Por {item.seller}</p>
                    </div>
                    <p className="font-bold text-indigo-600">${item.price}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-indigo-600">${order.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

const AdminView = () => {
  React.useEffect(() => {
    loadPendingProducts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">Panel de Administración</h2>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Package size={32} />
            <span className="text-3xl font-bold">{products.length}</span>
          </div>
          <p className="text-lg font-semibold">Productos Activos</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Clock size={32} />
            <span className="text-3xl font-bold">{pendingProducts.length}</span>
          </div>
          <p className="text-lg font-semibold">Pendientes de Aprobar</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign size={32} />
            <span className="text-3xl font-bold">{orders.length}</span>
          </div>
          <p className="text-lg font-semibold">Pedidos Totales</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-2xl font-bold mb-6">Productos Pendientes de Aprobación</h3>
        {pendingProducts.length === 0 ? (
          <div className="text-center py-12">
            <Check className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg">No hay productos pendientes de aprobación</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProducts.map(product => (
              <div key={product.id} className="border rounded-lg p-6 hover:shadow-md transition-all">
                <div className="flex gap-6 flex-wrap">
                  <img src={product.image} alt={product.title} className="w-32 h-32 object-cover rounded-lg" />
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="font-bold text-xl mb-2">{product.title}</h4>
                    <p className="text-gray-600 mb-2">{product.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span>Por: {product.seller}</span>
                      <span>•</span>
                      <span>Categoría: {categories.find(c => c.id === product.category)?.name}</span>
                      <span>•</span>
                      <span className="font-bold text-indigo-600">${product.price}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleApproveProduct(product.id)}
                      className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
                    >
                      <Check size={20} />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleRejectProduct(product.id)}
                      className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all flex items-center gap-2"
                    >
                      <X size={20} />
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-6">Todos los Productos Aprobados</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.title} className="w-12 h-12 object-cover rounded" />
                      <span className="font-medium">{product.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.seller}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categories.find(c => c.id === product.category)?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">${product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400 fill-yellow-400" size={16} />
                      <span>{product.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LoginModal = () => {
  if (!showLoginModal) return null;

  const getModalText = () => {
    switch (loginAction) {
      case 'cart':
        return 'iniciar sesión para agregar productos al carrito';
      case 'upload':
        return 'iniciar sesión para publicar tus trabajos';
      case 'buy':
        return 'iniciar sesión para realizar compras';
      default:
        return 'iniciar sesión para continuar';
    }
  };

const ReviewModal = ({ product, onClose }) => {
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
      const { addReview } = await import('./firebase/reviews');
      
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

const ReviewModal = ({ product, onClose }) => {
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
      const { addReview } = await import('./firebase/reviews');
      
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

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    const { getProductReviews } = await import('./firebase/reviews');
    const productReviews = await getProductReviews(productId);
    setReviews(productReviews);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600">Cargando reviews...</div>;
  }

  // Calcular rating promedio
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

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    const { getProductReviews } = await import('./firebase/reviews');
    const productReviews = await getProductReviews(productId);
    setReviews(productReviews);
    setLoading(false);
  };

  const { calculateAverageRating } = require('./firebase/reviews');
  const avgRating = calculateAverageRating(reviews);

  if (loading) {
    return <div className="text-center py-4">Cargando reviews...</div>;
  }

  return (
    <div className="mt-8">
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
            <div key={review.id} className="bg-white p-6 rounded-xl border">
              <div className="flex items-start gap-4">
                <img
                  src={review.userAvatar}
                  alt={review.userName}
                  className="w-12 h-12 rounded-full object-cover"
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowLoginModal(false)}>
      <div className="bg-white rounded-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Necesitas una cuenta!</h2>
          <p className="text-gray-600">Debes {getModalText()}</p>
        </div>
        
        <div className="space-y-3 mb-4">
          <button
            onClick={() => {
              setShowLoginModal(false);
              handleRegister();
            }}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <User size={20} />
            Registrarse Gratis
          </button>
          
          <button
            onClick={() => {
              setShowLoginModal(false);
              handleGoogleLogin();
            }}
            className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            <User size={20} />
            Ya tengo cuenta
          </button>
        </div>
        
        <button
          onClick={() => setShowLoginModal(false)}
          className="w-full text-gray-500 hover:text-gray-700 py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

const [selectedProductReviews, setSelectedProductReviews] = useState([]);
const [showReviewModal, setShowReviewModal] = useState(false);
const [reviewFormData, setReviewFormData] = useState({
  rating: 5,
  comment: ''
});

return (
  <div className="min-h-screen bg-gray-50">
    {/* Navbar siempre visible */}
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
                onClick={() => setCurrentView(currentUser?.role === 'admin' ? 'admin' : 'marketplace')}>
              NEXO STUDIANTIL
            </h1>
            
            <button
              onClick={() => setCurrentView('home')}
              className="hidden md:block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              Inicio
            </button>

            {currentUser && (
              <div className="hidden lg:flex gap-4">
                {currentUser.role === 'admin' ? (
                  <>
                    <button
                      onClick={() => setCurrentView('admin')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentView === 'admin' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Panel Admin
                    </button>
                    <button
                      onClick={() => setCurrentView('marketplace')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentView === 'marketplace' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Ver Marketplace
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentView('marketplace')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentView === 'marketplace' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Explorar
                    </button>
                    <button
                      onClick={() => {
                        if (requireLogin('upload')) {
                          setCurrentView('upload');
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        currentView === 'upload' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Upload size={18} />
                      Publicar
                    </button>
                    <button
                      onClick={() => setCurrentView('orders')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentView === 'orders' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Mis Pedidos
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentUser?.role !== 'admin' && (
              <button
                onClick={() => {
                  if (requireLogin('cart')) {
                    setCurrentView('cart');
                  }
                }}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cart.length}
                  </span>
                )}
              </button>
            )}
            
            <div className="flex items-center gap-3 border-l pl-4">
              {currentUser ? (
                <>
                  {(() => {
  console.log('🖼️ Avatar URL:', currentUser.avatar);
  console.log('👤 Nombre:', currentUser.name);
  return (
    <img 
      src={currentUser.avatar} 
      alt={currentUser.name} 
      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
      onError={(e) => {
        console.log('❌ Error cargando avatar, URL:', currentUser.avatar);
        console.log('🔄 Cambiando a fallback con iniciales');
        e.target.onerror = null; // Prevenir loop infinito
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6366f1&color=fff`;
      }}
      onLoad={() => {
        console.log('✅ Avatar cargado exitosamente desde:', currentUser.avatar);
      }}
    />
  );
})()}           <div className="hidden sm:block">
                    <p className="font-semibold text-sm">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.role === 'admin' ? 'Administrador' : 'Estudiante'}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await signOut(auth);
                      setCurrentUser(null);
                      setCurrentView('home');
                      setCart([]);
                    }}
                    className="text-gray-600 hover:text-red-600 transition-all"
                    title="Cerrar sesión"
                  >
                    <User size={20} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleGoogleLogin}
                    className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-semibold"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={handleRegister}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold"
                  >
                    Registrarse
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>

    {/* Contenido según la vista */}
    <main>
      {currentView === 'home' && <HomePage />}
      {currentView === 'marketplace' && <MarketplaceView />}
      {currentView === 'cart' && <CartView />}
      {currentView === 'upload' && <UploadProductView />}
      {currentView === 'orders' && <OrdersView />}
      {currentView === 'admin' && <AdminView />}
    </main>

    {/* Footer siempre visible */}
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              NEXO STUDIANTIL
            </h3>
            <p className="text-gray-400">
              Conectando talento universitario con oportunidades reales.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Plataforma</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-white cursor-pointer transition-all">Cómo funciona</li>
              <li className="hover:text-white cursor-pointer transition-all">Categorías</li>
              <li className="hover:text-white cursor-pointer transition-all">Precios</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Soporte</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-white cursor-pointer transition-all">Centro de ayuda</li>
              <li className="hover:text-white cursor-pointer transition-all">Términos de uso</li>
              <li className="hover:text-white cursor-pointer transition-all">Privacidad</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contacto</h4>
            <ul className="space-y-2 text-gray-400">
              <li>info@nexostudiantil.com</li>
              <li>+51 999 999 999</li>
              <li>Lima, Perú</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>© 2024 Nexo Studiantil. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
    
<LoginModal />
{showReviewModal && selectedProduct && (
  <ReviewModal 
    product={selectedProduct} 
    onClose={() => setShowReviewModal(false)} 
  />
)}  </div>
);
};

export default NexoStudiantil;