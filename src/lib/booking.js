import { SCHEDULE } from '../config'

const STORAGE_KEY = 'yuye-reservas-demo'
const CURRENT_KEY = 'yuye-cita-actual'
const SLOTS_PER_DAY = (SCHEDULE.close - SCHEDULE.open) / SCHEDULE.step

const pad = (n) => String(n).padStart(2, '0') // taste-skill-ignore: ceros de reloj y fecha

export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const minutesToTime = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const longDate = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
// «Miércoles, 28 de octubre»
export const formatLongDate = (key) => cap(longDate.format(parseKey(key)))
// «Mié 28 oct»
export const formatShortDate = (key) => cap(shortDate.format(parseKey(key)).replace(/[.,]/g, ''))

// Fecha y hora real de inicio de una cita.
export const startsAt = (b) => {
  const d = parseKey(b.date)
  d.setMinutes(b.start)
  return d
}

// Generador pseudoaleatorio con semilla: el mismo día siempre muestra las mismas horas ocupadas.
function seeded(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

// ---------- Citas guardadas en este navegador (la demo no tiene servidor) ----------

export function loadBookings() {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []).filter((b) => b && b.id)
  } catch {
    return []
  }
}

function persist(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Sin almacenamiento (modo privado): la reserva vale solo para esta visita.
  }
  return all
}

export const newId = () => `YN-${Date.now().toString(36).toUpperCase()}`

export const saveBooking = (booking) => persist([...loadBookings(), booking])

export const updateBooking = (id, patch) => persist(loadBookings().map((b) => (b.id === id ? { ...b, ...patch } : b)))

export function rememberCurrent(id) {
  try {
    localStorage.setItem(CURRENT_KEY, id)
  } catch {
    // sin almacenamiento
  }
}

export function currentId() {
  try {
    return localStorage.getItem(CURRENT_KEY)
  } catch {
    return null
  }
}

// ---------- Agenda ----------

// Citas de ejemplo para que la agenda se vea real, más las confirmadas en este navegador.
// `excludeId` deja fuera la cita que se está cambiando, para que su propia hora cuente como libre.
export function busySlots(key, bookings, excludeId) {
  const busy = new Array(SLOTS_PER_DAY).fill(false)
  const rand = seeded(key)
  const isSaturday = parseKey(key).getDay() === 6
  const blocks = 2 + Math.floor(rand() * (isSaturday ? 5 : 4))
  for (let b = 0; b < blocks; b++) {
    const start = Math.floor(rand() * SLOTS_PER_DAY)
    const length = 2 + Math.floor(rand() * 8)
    for (let i = start; i < Math.min(start + length, SLOTS_PER_DAY); i++) busy[i] = true
  }
  for (const bk of bookings) {
    if (bk.date !== key || bk.status === 'cancelled' || bk.id === excludeId) continue
    const start = (bk.start - SCHEDULE.open) / SCHEDULE.step
    const length = Math.ceil(bk.minutes / SCHEDULE.step)
    for (let i = start; i < Math.min(start + length, SLOTS_PER_DAY); i++) busy[i] = true
  }
  return busy
}

// Horas de inicio en las que caben todos los servicios sin pisar otra cita ni pasar del cierre.
export function availableTimes(key, minutes, bookings, now = new Date(), excludeId) {
  const day = parseKey(key)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last = new Date(today)
  last.setDate(last.getDate() + SCHEDULE.daysAhead)
  if (day < today || day > last || SCHEDULE.closedWeekdays.includes(day.getDay()) || minutes <= 0) return []

  const busy = busySlots(key, bookings, excludeId)
  const need = Math.ceil(minutes / SCHEDULE.step)
  const isToday = key === dateKey(now)
  const earliest = now.getHours() * 60 + now.getMinutes() + 60
  const times = []
  for (let s = 0; s + need <= SLOTS_PER_DAY; s++) {
    const start = SCHEDULE.open + s * SCHEDULE.step
    if (isToday && start < earliest) continue
    if (busy.slice(s, s + need).some(Boolean)) continue
    times.push(start)
  }
  return times
}

// ¿Se puede todavía cambiar o cancelar online? Hasta `changeHours` antes de la cita.
export function changeDeadline(b) {
  const d = startsAt(b)
  d.setHours(d.getHours() - SCHEDULE.changeHours)
  return d
}
