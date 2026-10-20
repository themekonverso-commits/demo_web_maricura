// La carta viva: servicios, precios, duraciones y plazos tal como están en el panel de reservas.
// Mientras llega (o si la API no responde), la web enseña la carta de src/data/services.js, que es la misma
// con la que se dio de alta el negocio. Las decoraciones y la retirada son servicios que se suman a uno principal.
import { useEffect, useState } from 'react'
import { getConfig } from './api'
import { EXTRAS, REMOVAL, SERVICE_GROUPS } from '../data/services'

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const DECOR = 'decoracion'
const REMOVAL_CATEGORY = 'retirada'

// Los ids de la carta de la web (los usan la galería y los botones de la carta), por nombre del servicio.
const STATIC_IDS = new Map([...SERVICE_GROUPS.flatMap((g) => g.items), ...EXTRAS].map((s) => [norm(s.name), s.id]))
STATIC_IDS.set(norm('Retirada de otro salón'), 'retirada')

const STATIC_REMOVAL = { id: 'retirada', name: 'Retirada de otro salón', minutes: REMOVAL.minutes, price: REMOVAL.price, desc: 'Gel, acrílico o semipermanente.' }
export const STATIC_CATALOG = {
  groups: SERVICE_GROUPS,
  decor: EXTRAS.filter((e) => e.id !== 'ninguno'),
  removal: STATIC_REMOVAL,
  extraItems: [...EXTRAS.filter((e) => e.id !== 'ninguno'), STATIC_REMOVAL],
  settings: null,
  siteKey: null,
  staff: [],
  live: false,
}

export function catalogFrom(cfg) {
  const item = (s) => ({
    id: STATIC_IDS.get(norm(s.name)) ?? s.id,
    apiId: s.id,
    name: s.name,
    minutes: s.duration_minutes,
    price: s.price_cents / 100,
    desc: s.description ?? '',
  })
  const inCategory = (id) => cfg.services.filter((s) => s.category_id === id).map(item)
  const groups = []
  const decor = []
  const removal = []
  for (const c of cfg.categories) {
    const n = norm(c.name)
    if (n === DECOR) decor.push(...inCategory(c.id))
    else if (n === REMOVAL_CATEGORY) removal.push(...inCategory(c.id))
    else {
      const items = inCategory(c.id)
      if (items.length) groups.push({ id: n.replace(/\s+/g, '-'), name: c.name, items })
    }
  }
  const loose = cfg.services.filter((s) => !cfg.categories.some((c) => c.id === s.category_id)).map(item)
  if (loose.length) groups.push({ id: 'otros', name: 'Otros servicios', items: loose })
  return {
    groups,
    decor,
    removal: removal[0] ?? null,
    extraItems: [...decor, ...removal],
    settings: cfg.settings,
    siteKey: cfg.antibot?.turnstile_site_key ?? null,
    staff: cfg.staff,
    live: true,
  }
}

let cached = null
export function useCatalog() {
  const [catalog, setCatalog] = useState(cached ?? STATIC_CATALOG)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (cached) return
    let on = true
    getConfig()
      .then((cfg) => {
        cached = catalogFrom(cfg)
        if (on) {
          setCatalog(cached)
          setError(null)
        }
      })
      .catch((e) => on && setError(e))
    return () => {
      on = false
    }
  }, [attempt])
  return { ...catalog, error, retry: () => setAttempt((n) => n + 1) }
}

export const findIn = (catalog, id) => [...catalog.groups.flatMap((g) => g.items), ...catalog.extraItems].find((s) => s.id === id) ?? null
