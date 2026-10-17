import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Item, Stagger } from './Reveal'

const FAQ = [
  {
    q: '¿Las uñas tienen que «respirar» entre citas?',
    a: 'No. La uña recibe oxígeno y nutrientes desde la sangre, no desde el aire. Lo que de verdad la daña es una retirada brusca o un limado agresivo, por eso retiro siempre con torno y con cuidado.',
  },
  {
    q: '¿Cuánto me dura el semipermanente?',
    a: 'Entre dos y tres semanas, según lo rápido que crezca tu uña y tu día a día. En uñas finas, la base de refuerzo ayuda a que aguante más.',
  },
  {
    q: '¿Puedo traer mi propio diseño?',
    a: 'Claro. Escríbelo en la nota al reservar o mándame la foto por WhatsApp, y te digo cuánto tiempo y qué decoración lleva.',
  },
  {
    q: '¿Retiras trabajos de otro salón?',
    a: 'Sí. Al reservar, añade el extra «Retirada de otro salón» para que la cita tenga el tiempo justo.',
  },
  {
    q: '¿Y si llego tarde o no puedo ir?',
    a: 'Puedes cambiar o cancelar tu cita hasta 24 horas antes desde «Ver mi cita». Si llegas más de 15 minutos tarde, puede que haya que simplificar el diseño para no retrasar a la siguiente clienta.',
  },
  {
    q: '¿Cómo cuido mis uñas después?',
    a: 'Aceite de cutícula cada día, guantes para fregar y nada de usar las uñas como herramienta. Si se levanta un borde, escríbeme antes de arrancarlo.',
  },
]

function Question({ f, i, open, onToggle, reduce }) {
  const panelId = `faq-respuesta-${i}`
  const buttonId = `faq-pregunta-${i}`
  return (
    <Item as="li" className="faq-row">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-5 py-5 md:py-7 text-left min-h-11 cursor-pointer"
        >
          <span className="text-[clamp(1.25rem,1rem+1vw,1.85rem)] leading-snug">{f.q}</span>
          <span className={`faq-plus rg-ring shrink-0 size-10 md:size-11 rounded-full grid place-items-center text-rg ${open ? 'is-open' : ''}`} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M8 2.5v11M2.5 8h11" />
            </svg>
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            className="overflow-hidden"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="pb-6 md:pb-8 pr-12 max-w-[62ch] text-cream/80">{f.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Item>
  )
}

// Preguntas en acordeón: se abre la que interesa, y se pueden abrir varias.
export default function Faq() {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(() => new Set())
  const toggle = (i) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  return (
    <section id="preguntas" className="relative z-10 text-cream section-y">
      <div className="wrap">
        <Stagger>
          <Item as="h2" className="font-caps rose-gold text-[clamp(1.9rem,1.3rem+2.2vw,3rem)] leading-tight">
            Preguntas antes de tu cita
          </Item>
        </Stagger>
        <Stagger as="ul" className="mt-8 md:mt-12">
          {FAQ.map((f, i) => (
            <Question key={f.q} f={f} i={i} open={open.has(i)} onToggle={() => toggle(i)} reduce={reduce} />
          ))}
        </Stagger>
      </div>
    </section>
  )
}
