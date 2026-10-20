import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { GALLERY } from '../data/gallery'
import { findExtra, findService, formatMinutes, formatPrice } from '../data/services'
import { findIn, useCatalog } from '../lib/catalog'
import { Item, Stagger } from './Reveal'

const N = GALLERY.length
const START = 0
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Interpola en una tabla por posición (0 = centro, 1 = primera de al lado, ...).
function fromTable(table, a) {
  const i = Math.min(Math.floor(a), table.length - 2)
  const t = Math.min(a - i, 1)
  return table[i] + (table[i + 1] - table[i]) * t
}

// Cómo se colocan las tarjetas según lo lejos que están del centro, como en la referencia:
// las de los lados se hacen pequeñas y giran hacia dentro, con el borde exterior más cerca.
const LAYOUT = {
  desktop: { x: [0, 1.06, 1.98, 2.72], scale: [1, 0.86, 0.76, 0.68], rot: [0, 16, 24, 30], z: [0, -60, -120, -180], visible: 2.4 },
  mobile: { x: [0, 0.92, 1.66, 2.3], scale: [1, 0.84, 0.72, 0.62], rot: [0, 18, 26, 32], z: [0, -60, -120, -180], visible: 1.3 },
}

// Resistencia elástica al pasarse de la primera o la última tarjeta.
// Carrusel infinito: la posición de cada tarjeta respecto al centro se "enrolla" en un círculo de N tarjetas,
// así después de la última viene la primera y antes de la primera, la última.
const mod = (n, m) => ((n % m) + m) % m
const wrapOffset = (i, p) => {
  const o = mod(i - p, N)
  return o > N / 2 ? o - N : o
}

function useStageSize(ref) {
  const [size, setSize] = useState({ W: 300, mobile: false })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const mobile = window.matchMedia('(max-width: 767px)').matches
      setSize({ W: mobile ? Math.min(w * 0.7, 300) : clamp(w * 0.22, 240, 330), mobile })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

function Card({ g, i, progress, dragTilt, W, mobile, flipped, onSelect, onWant, reduce }) {
  const L = mobile ? LAYOUT.mobile : LAYOUT.desktop
  // Precio y duración de la carta viva (panel de reservas); si aún no ha llegado, los de la carta de partida.
  const catalog = useCatalog()
  const BASE = findIn(catalog, 'semi') ?? findService('semi')
  const extra = findIn(catalog, g.extra) ?? findExtra(g.extra)
  const H = W * (mobile ? 1.62 : 1.5)

  const transform = useTransform(progress, (p) => {
    const o = wrapOffset(i, p)
    const a = Math.min(Math.abs(o), 3)
    const s = Math.sign(o)
    const x = s * fromTable(L.x, a) * W
    const ry = -s * fromTable(L.rot, a)
    return `translateX(${x}px) translateZ(${fromTable(L.z, a)}px) rotateY(${ry}deg) scale(${fromTable(L.scale, a)})`
  })
  const opacity = useTransform(progress, (p) => {
    const a = Math.abs(wrapOffset(i, p))
    return a <= L.visible ? 1 : clamp(1 - (a - L.visible) / 0.7, 0, 1)
  })
  const zIndex = useTransform(progress, (p) => 100 - Math.round(Math.abs(wrapOffset(i, p)) * 10))

  // Inclinación que sigue al ratón, el volteo y el giro al arrastrar, todo en el mismo elemento.
  const tiltX = useSpring(0, { stiffness: 220, damping: 20 })
  const tiltY = useSpring(0, { stiffness: 220, damping: 20 })
  const flip = useSpring(0, reduce ? { stiffness: 1000, damping: 100 } : { stiffness: 160, damping: 20 })
  useEffect(() => flip.set(flipped ? 180 : 0), [flipped, flip])
  const inner = useTransform([tiltX, tiltY, flip, dragTilt], ([x, y, f, d]) => `rotateX(${x}deg) rotateY(${y + f + d}deg)`)

  const glareX = useMotionValue('50%')
  const glareY = useMotionValue('20%')
  const glare = useSpring(0, { stiffness: 200, damping: 25 })

  const onMove = (e) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    tiltY.set((px - 0.5) * (flipped ? -14 : 14))
    tiltX.set(-(py - 0.5) * 12)
    glareX.set(`${px * 100}%`)
    glareY.set(`${py * 100}%`)
    glare.set(1)
  }
  const onLeave = () => {
    tiltX.set(0)
    tiltY.set(0)
    glare.set(0)
  }

  const totalMin = BASE.minutes + extra.minutes
  const totalPrice = BASE.price + extra.price

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ width: W, height: H, marginLeft: -W / 2, marginTop: -H / 2, transform, opacity, zIndex, transformStyle: 'preserve-3d' }}
    >
      <motion.div
        className="relative size-full"
        style={{ transform: inner, transformStyle: 'preserve-3d' }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {/* Cara delantera: la foto */}
        <button
          type="button"
          onClick={() => onSelect(i)}
          aria-label={flipped ? `Volver a la foto de ${g.title}` : `${g.title}: ver detalles`}
          className="card-face absolute inset-0 overflow-hidden rounded-[var(--radius-media)] text-white text-left cursor-pointer"
        >
          <img src={g.src} alt={g.detail} width="640" height="960" loading="lazy" draggable="false" className="photo rounded-none h-full w-full object-cover select-none" />
          <span className="card-scrim absolute inset-0" aria-hidden="true" />
          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-3 py-1 text-small">{g.category}</span>
          <span className="absolute inset-x-3 bottom-4 text-center text-lead leading-tight">{g.title}</span>
          <motion.span
            aria-hidden="true"
            className="card-glare absolute inset-0"
            style={{ '--gx': glareX, '--gy': glareY, opacity: glare }}
          />
        </button>

        {/* Cara trasera: la información del diseño */}
        <div
          className="card-face card-back absolute inset-0 overflow-hidden rounded-[var(--radius-media)] text-cream cursor-pointer"
          onClick={() => onSelect(i)}
          aria-hidden={!flipped}
          inert={flipped ? undefined : ''}
        >
          <div aria-hidden="true" className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl brightness-[0.38] saturate-150" style={{ backgroundImage: `url(${g.src})` }} />
          <div className="relative h-full flex flex-col p-4 md:p-6">
            <span className="self-start rounded-full bg-white/12 px-3 py-1 text-small">{g.category}</span>
            <h3 className="display text-[1.75rem] md:text-mid mt-3 md:mt-4 leading-[0.95]">{g.title}</h3>
            <p className="mt-2 md:mt-3 text-[0.95rem] md:text-[0.98rem] leading-snug text-cream/90">{g.detail}</p>
            <dl className="mt-3 md:mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 md:gap-y-1.5 text-small leading-snug">
              <dt className="text-cream/70">Forma</dt>
              <dd>{g.shape}</dd>
              <dt className="text-cream/70">Técnica</dt>
              <dd>{extra.name}</dd>
              <dt className="text-cream/70">Duración</dt>
              <dd className="tabular">{formatMinutes(totalMin)} aprox.</dd>
              <dt className="text-cream/70">Desde</dt>
              <dd className="tabular">{formatPrice(totalPrice)}</dd>
            </dl>
            <div className="mt-auto flex flex-col items-center gap-2 pt-4">
              <button
                type="button"
                className="btn glass glass-gold min-h-11 px-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onWant(g)
                }}
              >
                Reservar este diseño
              </button>
              <span className="text-small text-cream/60">Toca para volver</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function NavButton({ dir, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? 'Diseño anterior' : 'Diseño siguiente'}
      className="chip size-12 grid place-items-center rounded-full text-white ring-1 ring-white/55"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path d={dir < 0 ? 'M15 9H3m5-5L3 9l5 5' : 'M3 9h12m-5-5l5 5-5 5'} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// El Nail Diary como carrusel 3D: arrastra o usa las flechas; toca la tarjeta del centro para voltearla.
export default function Gallery({ onWantDesign }) {
  const reduce = useReducedMotion()
  const stageRef = useRef(null)
  const { W, mobile } = useStageSize(stageRef)
  const progress = useMotionValue(START)
  const dragTilt = useSpring(0, { stiffness: 180, damping: 18 })
  const [active, setActive] = useState(START)
  const [flipped, setFlipped] = useState(null)
  const anim = useRef(null)
  const panStart = useRef(START)
  const dragged = useRef(false)

  useMotionValueEvent(progress, 'change', (p) => setActive(mod(Math.round(p), N)))

  // Aviso de primera vez: al llegar al carrusel, la tarjeta del centro se voltea sola y vuelve a la foto,
  // para que se entienda que se puede tocar. Una sola vez por visita; si la persona toca algo antes, no sale.
  const hinted = useRef(false)
  const hintTimers = useRef([])
  const stopHint = () => {
    hinted.current = true
    hintTimers.current.forEach(clearTimeout)
    hintTimers.current = []
  }
  useEffect(() => {
    if (reduce) return
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hinted.current) return
        hinted.current = true
        io.disconnect()
        const card = mod(Math.round(progress.get()), N)
        hintTimers.current = [
          setTimeout(() => setFlipped(card), 400),
          setTimeout(() => setFlipped((f) => (f === card ? null : f)), 400 + 2000),
        ]
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      hintTimers.current.forEach(clearTimeout)
    }
  }, [reduce, progress])

  const goTo = useCallback(
    (i, velocity = 0) => {
      anim.current?.stop()
      anim.current = animate(
        progress,
        i,
        reduce ? { duration: 0.25 } : { type: 'spring', stiffness: 210, damping: 28, velocity },
      )
    },
    [progress, reduce],
  )

  const step = (d) => {
    stopHint()
    setFlipped(null)
    goTo(Math.round(progress.get()) + d)
  }

  const onSelect = (i) => {
    if (dragged.current) return
    const base = Math.round(progress.get())
    if (i !== mod(base, N)) {
      setFlipped(null)
      goTo(base + wrapOffset(i, base))
    } else {
      setFlipped((f) => (f === i ? null : i))
    }
  }

  return (
    <section id="trabajos" className="relative z-10 text-cream pt-[var(--section-y)] pb-[calc(var(--section-y)/2)]">
      <Stagger className="wrap grid md:grid-cols-12 gap-6 items-end mb-8 md:mb-12">
        <Item as="h2" className="md:col-span-6 font-script rose-gold text-[clamp(3.75rem,2rem+6vw,7rem)] leading-[1.05]">Nail Diary</Item>
        <Item as="p" className="md:col-span-5 md:col-start-8 max-w-[44ch] text-cream/85">
          Ocho trabajos recientes de su Instagram. Toca el del centro para darle la vuelta y ver cómo se hace.
        </Item>
      </Stagger>

      <div>
        <div className="relative overflow-hidden py-6 md:py-10">
          <motion.div
            ref={stageRef}
            role="region"
            aria-roledescription="carrusel"
            aria-label="Trabajos de Andreina"
            tabIndex={0}
            className="relative mx-auto outline-offset-4 select-none"
            style={{ height: W * (mobile ? 1.62 : 1.5) + 24, perspective: mobile ? 900 : 1400, touchAction: 'pan-y' }}
            onPointerDownCapture={() => {
              stopHint()
              dragged.current = false
              anim.current?.stop()
              panStart.current = progress.get()
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') step(1)
              if (e.key === 'ArrowLeft') step(-1)
            }}
            onPanStart={() => {
              dragged.current = true
              setFlipped(null)
            }}
            onPan={(_, info) => {
              const p = panStart.current - info.offset.x / (W * (mobile ? 0.92 : 1.02))
              progress.set(p)
              if (!reduce) dragTilt.set(clamp(-info.velocity.x / 55, -18, 18))
            }}
            onPanEnd={(_, info) => {
              dragTilt.set(0)
              const v = -info.velocity.x / W
              const projected = progress.get() + v * 0.22
              goTo(Math.round(projected), v)
            }}
          >
            {GALLERY.map((g, i) => (
              <Card
                key={g.src}
                g={g}
                i={i}
                progress={progress}
                dragTilt={dragTilt}
                W={W}
                mobile={mobile}
                flipped={flipped === i}
                onSelect={onSelect}
                onWant={(item) => {
                  document.activeElement?.blur() // el botón está en la cara que se va a ocultar
                  setFlipped(null)
                  onWantDesign(item)
                }}
                reduce={reduce}
              />
            ))}
          </motion.div>

          <div className="relative mt-8 flex items-center justify-center gap-3">
            <NavButton dir={-1} onClick={() => step(-1)} />
            <NavButton dir={1} onClick={() => step(1)} />
          </div>
          <p className="relative mt-4 text-center text-small text-white/60 tabular" aria-live="polite">
            {active + 1} de {N} · {GALLERY[active].title}
          </p>
        </div>
      </div>
    </section>
  )
}
