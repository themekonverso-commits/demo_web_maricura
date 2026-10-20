// Cliente de la API pública de Reservas Konverso: carta, horas libres, reservas y gestión de la cita.
// Guía completa: docs/API.md del sistema de reservas. Esta web solo pinta; las citas viven en el servidor.
import { RESERVAS } from '../config'

const BASE = `${RESERVAS.api.replace(/\/$/, '')}/api/public`
const SLUG = encodeURIComponent(RESERVAS.negocio)

// Error con el mensaje listo para enseñar (la API los manda en castellano y con tuteo).
export class ApiError extends Error {
  constructor(status, body) {
    const e = body?.error ?? {}
    super(e.message ?? 'No hemos podido conectar con la agenda. Prueba otra vez en un momento.')
    this.status = status
    this.code = e.code ?? 'network_error'
    this.fields = e.fields ?? {}
    this.details = e.details ?? {}
  }
}

async function call(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, null)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

const qs = (params) => new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString()

// ---------- Negocio y carta ----------

let configPromise = null
export function getConfig() {
  configPromise ??= call(`/${SLUG}/config`).catch((e) => {
    configPromise = null // si falla, el siguiente intento vuelve a pedirla
    throw e
  })
  return configPromise
}

// ---------- Horas libres (reserva nueva) ----------

// `staff`: id de la profesional, o nada para «sin preferencia».
export const getDays = (serviceIds, from, to, staff) => call(`/${SLUG}/days?${qs({ services: serviceIds.join(','), from, to, staff })}`)
export const getAvailability = (serviceIds, date, staff) => call(`/${SLUG}/availability?${qs({ services: serviceIds.join(','), date, staff })}`)

export const createBooking = (body) => call(`/${SLUG}/bookings`, { method: 'POST', body })

// ---------- Gestión de la cita (con el token del enlace) ----------
// El token da acceso a la cita: no se manda a analítica ni se enseña en la página.

const T = (token) => `/manage/${encodeURIComponent(token)}`
export const getManaged = (token) => call(T(token))
export const getManageDays = (token, from, to) => call(`${T(token)}/days?${qs({ from, to, staff: 'same' })}`)
export const getManageAvailability = (token, date) => call(`${T(token)}/availability?${qs({ date, staff: 'same' })}`)
export const rescheduleBooking = (token, start) => call(`${T(token)}/reschedule`, { method: 'POST', body: { start } })
export const cancelBooking = (token, reason) => call(`${T(token)}/cancel`, { method: 'POST', body: { reason: reason || undefined } })
