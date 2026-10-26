// Datos del negocio. Cambia aquí lo que haga falta antes de publicar.
export const BUSINESS = {
  name: 'Yuye Nails',
  owner: 'Andreina Soto',
  city: 'Sevilla',
  instagram: 'https://www.instagram.com/yuye_nailss.es/',
  handle: '@yuye_nailss.es',
  // Número de WhatsApp con prefijo de país y sin espacios, por ejemplo '34600111222'.
  // Vacío: el botón abre WhatsApp con el mensaje escrito para elegir el contacto.
  whatsapp: '',
}

// Sistema de reservas (Reservas Konverso). La carta, los precios, el horario, los plazos y las citas se
// gestionan en su panel; esta web los lee de la API. En local se puede apuntar a otro servidor con
// VITE_RESERVAS_API y a otro negocio con VITE_RESERVAS_NEGOCIO en un archivo .env.local (por ejemplo,
// http://localhost:3030 y el negocio de pruebas test-web-yuye).
export const RESERVAS = {
  api: import.meta.env.VITE_RESERVAS_API || 'https://appreservaskonverso.vercel.app',
  negocio: import.meta.env.VITE_RESERVAS_NEGOCIO || 'yuye-nails',
  // Versión del texto de las casillas de privacidad y promociones que ve la clienta. Si cambian, sube el número.
  consentimientos: 'web-yuye-nails-v1',
  // Versión del texto de la casilla de avisos por WhatsApp (Booking.jsx, TEXTO_WHATSAPP). Si el texto cambia, sube el número.
  consentimientosWhatsapp: 'web-yuye-nails-whatsapp-v1',
}

export function whatsappLink(text) {
  const base = BUSINESS.whatsapp ? `https://wa.me/${BUSINESS.whatsapp}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}
