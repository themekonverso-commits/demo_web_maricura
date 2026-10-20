// Fechas, horas y la cita de esta clienta. Las citas viven en el sistema de reservas (src/lib/api.js);
// en este navegador solo se guarda el enlace privado de la última cita, para poder enseñarla al volver.

const TOKEN_KEY = 'yuye-cita-enlace'

const pad = (n) => String(n).padStart(2, '0') // taste-skill-ignore: ceros de reloj y fecha

export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (key, n) => {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

export const minutesToTime = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
export const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const longDate = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
// «Miércoles, 28 de octubre»
export const formatLongDate = (key) => cap(longDate.format(parseKey(key)))
// «Mié 28 oct»
export const formatShortDate = (key) => cap(shortDate.format(parseKey(key)).replace(/[.,]/g, ''))

// La cita como la pinta la web, a partir de la que devuelve la API (fecha y hora en la hora del negocio).
export function fromApi(b) {
  const start = timeToMinutes(b.time)
  return {
    id: b.id,
    code: b.id.slice(0, 8).toUpperCase(),
    status: b.status,
    date: b.date,
    start,
    minutes: timeToMinutes(b.end_time) - start,
    price: b.total_price_cents / 100,
    services: b.services.map((s) => s.name),
    name: b.customer_name,
    startsAt: new Date(b.start),
    canChange: Boolean(b.can_change),
    deadline: b.change_deadline ? new Date(b.change_deadline) : null,
    cutoffHours: b.cancel_cutoff_hours,
  }
}

// ---------- El enlace privado de la cita (token) ----------
// Llega en la respuesta al reservar o en el enlace del email (…/#cita=TOKEN). Da acceso a la cita:
// solo se guarda en este navegador y se quita de la barra de direcciones en cuanto se lee.

export function rememberToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Sin almacenamiento (modo privado): la cita se ve solo en esta visita; el enlace del email sigue valiendo.
  }
}

export function savedToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function forgetToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // sin almacenamiento
  }
}

// Lee el token del enlace del email (#cita=…) y lo quita de la dirección (para que no se comparta al copiarla).
// Una vez por carga de la página: se guarda aquí para que leerlo dos veces (modo estricto de React) dé lo mismo.
let fromUrl
export function takeTokenFromUrl() {
  if (fromUrl !== undefined) return fromUrl
  const m = window.location.hash.match(/^#cita=([A-Za-z0-9_-]{20,})$/)
  fromUrl = m ? m[1] : null
  if (m) history.replaceState(null, '', `${window.location.pathname}${window.location.search}#reserva`)
  return fromUrl
}
