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

// Horario de la demo: lunes a sábado, de 10:00 a 20:00, turnos cada 15 minutos.
export const SCHEDULE = {
  open: 10 * 60,
  close: 20 * 60,
  step: 15,
  closedWeekdays: [0], // 0 = domingo
  daysAhead: 60, // hasta cuántos días hacia delante se puede reservar
  changeHours: 24, // hasta cuántas horas antes se puede cambiar o cancelar
}

export function whatsappLink(text) {
  const base = BUSINESS.whatsapp ? `https://wa.me/${BUSINESS.whatsapp}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}
