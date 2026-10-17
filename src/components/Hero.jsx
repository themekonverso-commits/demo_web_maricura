import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

// Portada de solo imagen: la mano a toda pantalla con un degradado que la funde,
// por abajo, con el fondo oscuro de la zona del carrusel y la carta.
export default function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const drift = useTransform(scrollYProgress, [0, 1], ['translateY(0px) scale(1)', 'translateY(80px) scale(1.06)'])

  return (
    <section ref={ref} id="inicio" className="relative h-[100svh] min-h-[620px] overflow-hidden bg-[#151010]">
      <h1 className="sr-only">Yuye Nails: uñas de autora en Sevilla por Andreina Soto</h1>

      <motion.div
        className="absolute inset-0"
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(1.08)' }}
        animate={{ opacity: 1, transform: 'scale(1)' }}
        transition={{ duration: 1.6, ease: [0.23, 1, 0.32, 1] }}
      >
        <motion.img
          src="./decor/hero-tortuga.jpg"
          alt="Mano con uñas almendra en chocolate y carey, francesas con bolitas doradas y anillos dorados"
          width="1188"
          height="1558"
          fetchpriority="high"
          className="h-full w-full object-cover object-[50%_42%]"
          style={reduce ? undefined : { transform: drift }}
        />
      </motion.div>

      <div aria-hidden="true" className="hero-fade absolute inset-0" />
    </section>
  )
}
