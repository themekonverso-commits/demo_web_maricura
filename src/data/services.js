// Carta de servicios. Precios de referencia de salones de Sevilla (octubre 2026); confirmar con Andreina.
export const SERVICE_GROUPS = [
  {
    id: 'manos',
    name: 'Manos',
    items: [
      { id: 'express', name: 'Manicura express', minutes: 30, price: 12, desc: 'Limado, cutícula y esmalte tradicional.' },
      { id: 'semi', name: 'Semipermanente', minutes: 45, price: 18, desc: 'Color con brillo que dura hasta tres semanas.' },
      { id: 'semi-refuerzo', name: 'Semipermanente con refuerzo', minutes: 60, price: 22, desc: 'Base niveladora para uñas finas o que se parten.' },
      { id: 'rusa', name: 'Manicura rusa', minutes: 75, price: 26, desc: 'Cutícula en seco con torno y color pegado a la piel.' },
      { id: 'kapping', name: 'Kapping en gel', minutes: 75, price: 28, desc: 'Gel sobre tu uña natural, sin alargar.' },
    ],
  },
  {
    id: 'extensiones',
    name: 'Extensiones',
    items: [
      { id: 'gel', name: 'Esculpidas en gel', minutes: 120, price: 38, desc: 'Primera puesta, forma y largo a tu medida.' },
      { id: 'acrilico', name: 'Acrílicas', minutes: 120, price: 35, desc: 'Primera puesta, resistentes y ligeras.' },
      { id: 'softgel', name: 'Soft gel con tips', minutes: 90, price: 32, desc: 'Largo inmediato con tips de gel flexibles.' },
      { id: 'polygel', name: 'Polygel', minutes: 105, price: 35, desc: 'Lo mejor del gel y del acrílico, sin olor.' },
      { id: 'relleno', name: 'Relleno de gel o acrílico', minutes: 90, price: 28, desc: 'Mantenimiento a las tres o cuatro semanas.' },
    ],
  },
  {
    id: 'pies',
    name: 'Pies',
    items: [
      { id: 'pedi-semi', name: 'Pedicura semipermanente', minutes: 50, price: 22, desc: 'Limado, cutícula y color que aguanta semanas.' },
      { id: 'pedi-completa', name: 'Pedicura completa', minutes: 75, price: 30, desc: 'Durezas, hidratación y semipermanente.' },
    ],
  },
]

export const EXTRAS = [
  { id: 'ninguno', name: 'Sin decoración', minutes: 0, price: 0, desc: 'Un solo color, limpio y brillante.' },
  { id: 'francesa', name: 'Francesa o baby boomer', minutes: 15, price: 5, desc: 'Punta de color o degradado lechoso.' },
  { id: 'ojo-gato', name: 'Ojo de gato o cromado', minutes: 10, price: 5, desc: 'Brillo magnético o efecto espejo.' },
  { id: 'mano-alzada', name: 'Diseño a mano alzada', minutes: 20, price: 8, desc: 'Lunares, estrellas, animal print, hasta cuatro uñas.' },
  { id: 'relieve', name: 'Flores 3D y bolitas doradas', minutes: 30, price: 12, desc: 'Relieve, conchas y pedrería.' },
  { id: 'autor', name: 'Diseño de autora completo', minutes: 45, price: 18, desc: 'Cada uña distinta, como en el Nail Diary.' },
]

export const REMOVAL = { minutes: 15, price: 8 }

export const ALL_SERVICES = SERVICE_GROUPS.flatMap((g) => g.items.map((s) => ({ ...s, group: g.name })))

export const findService = (id) => ALL_SERVICES.find((s) => s.id === id)
export const findExtra = (id) => EXTRAS.find((e) => e.id === id) ?? EXTRAS[0]

export const formatPrice = (n) => `${n} €`
export function formatMinutes(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}
