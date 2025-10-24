import emailjs from '@emailjs/browser';


// Configuración de EmailJS con tus credenciales
const EMAILJS_CONFIG = {
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_4hl327h',
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '8WTFO8-0I53X4WD8z',
  templates: {
    welcome: process.env.REACT_APP_EMAILJS_TEMPLATE_WELCOME || 'template_ty8ph61',
    orderConfirmation: process.env.REACT_APP_EMAILJS_TEMPLATE_ORDER || 'template_nf24ug7'
  }
};

// Inicializar EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Enviar email de bienvenida
export const sendWelcomeEmail = async (userName, userEmail, userRole) => {
  try {
    console.log('📧 Enviando email de bienvenida a:', userEmail);
    
    const templateParams = {
      to_name: userName,
      to_email: userEmail,
      user_role: userRole === 'admin' ? 'Administrador' : 'Estudiante'
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.welcome,
      templateParams
    );

    console.log('✅ Email de bienvenida enviado:', response.status);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al enviar email de bienvenida:', error);
    return { success: false, error };
  }
};

// Enviar email de confirmación de pedido
export const sendOrderConfirmationEmail = async (userName, userEmail, order) => {
  try {
    console.log('📧 Enviando confirmación de pedido a:', userEmail);
    
    // Formatear items del pedido
    const itemsList = order.items.map(item => 
      `- ${item.title} ($${item.price})`
    ).join('\n');

    const templateParams = {
      to_name: userName,
      to_email: userEmail,
      order_id: order.id,
      order_total: order.total,
      order_date: order.date,
      order_items: itemsList
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.orderConfirmation,
      templateParams
    );

    console.log('✅ Email de confirmación enviado:', response.status);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al enviar email de confirmación:', error);
    return { success: false, error };
  }
};

export default emailjs;