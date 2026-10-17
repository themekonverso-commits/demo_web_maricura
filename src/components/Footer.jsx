import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { BUSINESS } from '../config'

// Cierre: el nombre vuelve a todo el ancho, en colores invertidos.
export default function Footer() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const grow = useTransform(scrollYProgress, [0, 1], [0.94, 1])

  return (
    <footer ref={ref} className="relative z-10 text-cream pt-[var(--section-y)] pb-[max(1.5rem,env(safe-area-inset-bottom))] grid grid-rows-[auto_auto] gap-y-16 md:gap-y-24">
      <div className="wrap grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-8">
        <div className="md:col-span-3">
          <p>Estudio</p>
          <p className="text-cream/75">{BUSINESS.city}, España</p>
          <p className="text-cream/75">Dirección al confirmar la cita</p>
        </div>
        <div className="md:col-span-3">
          <p>Horario</p>
          <p className="text-cream/75">Lunes a sábado</p>
          <p className="text-cream/75 tabular">10:00 a 20:00</p>
        </div>
        <nav className="md:col-span-3 flex flex-col" aria-label="Pie de página">
          <p>Secciones</p>
          <a href="#trabajos" className="link w-fit text-cream/75 py-2.5 md:py-0">Trabajos</a>
          <a href="#carta" className="link w-fit text-cream/75 py-2.5 md:py-0">Carta</a>
          <a href="#andreina" className="link w-fit text-cream/75 py-2.5 md:py-0">Andreina</a>
          <a href="#reserva" className="link w-fit text-cream/75 py-2.5 md:py-0">Reservar</a>
        </nav>
        <div className="md:col-span-3">
          <p>Redes</p>
          <a href={BUSINESS.instagram} className="link inline-block text-cream/75 py-2.5 md:py-0" target="_blank" rel="noreferrer">
            Instagram {BUSINESS.handle}
          </a>
        </div>
      </div>

      <div className="wrap">
        <motion.svg
          viewBox="0 0 1000 178"
          className="w-full h-auto text-nude origin-bottom"
          role="img"
          aria-label="Yuye Nails"
          style={{ scale: reduce ? 1 : grow }}
        >
          <text
            x="0"
            y="176"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            fill="currentColor"
            style={{ fontFamily: 'var(--font-display)', fontSize: '252px', letterSpacing: '-0.02em' }}
          >
            YUYENAILS
          </text>
        </motion.svg>
      </div>
    </footer>
  )
}
