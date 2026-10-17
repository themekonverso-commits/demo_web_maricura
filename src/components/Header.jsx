import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const LINKS = [
  { href: '#trabajos', label: 'Trabajos' },
  { href: '#carta', label: 'Carta' },
  { href: '#andreina', label: 'Andreina' },
]

const SPRING = { type: 'spring', bounce: 0, duration: 0.5 }

// Menú en una cápsula de vidrio que flota sobre todo el sitio: el contenido pasa por debajo.
export default function Header() {
  const [compact, setCompact] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] md:top-4 z-40 flex justify-center px-3 pointer-events-none"
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-16px) scale(0.96)', filter: 'blur(8px)' }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
        transition={{ ...SPRING, delay: 0.2 }}
      >
        <motion.div
          layout
          transition={SPRING}
          className={`glass glass-dark glass-refract pointer-events-auto rounded-full flex items-center gap-2 md:gap-6 w-full ${
            compact ? 'max-w-[760px] h-14' : 'max-w-[1000px] h-16'
          } pl-2 md:pl-7 pr-2`}
        >
          {/* Izquierda: secciones (PC) o «Menú» (celular). Centro: el nombre. Derecha: Reservar. */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Principal">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="link">{l.label}</a>
            ))}
          </nav>
          <button type="button" className="md:hidden link min-h-11 px-3" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen}>
            Menú
          </button>
          <a href="#inicio" className="display text-lead tracking-normal py-2.5 absolute left-1/2 -translate-x-1/2">
            Yuye Nails
          </a>
          <a href="#reserva" className="btn glass glass-gold min-h-11 px-5 ml-auto">Reservar</a>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="glass glass-dark fixed inset-x-2 bottom-2 top-[max(0.5rem,env(safe-area-inset-top))] z-50 rounded-[var(--radius-panel)] px-6 pt-5 pb-10 flex flex-col [--glass-blur:34px] [--glass-alpha:0.7]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)', filter: 'blur(10px)' }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.97)', filter: 'blur(8px)' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <span className="display text-lead tracking-normal">Yuye Nails</span>
              <button type="button" className="link min-h-11 px-1" onClick={close} autoFocus>
                Cerrar
              </button>
            </div>
            <nav className="mt-auto flex flex-col gap-2" aria-label="Menú móvil">
              {[...LINKS, { href: '#reserva', label: 'Reservar' }].map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className={`display text-[19vw] leading-[0.9] ${l.href === '#reserva' ? 'text-accent' : ''}`}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(24px)' }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)' }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.5, delay: 0.06 + i * 0.05 }}
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
