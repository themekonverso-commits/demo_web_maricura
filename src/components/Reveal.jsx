import { forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export const EASE_OUT = [0.23, 1, 0.32, 1]

// Contenedor que escalona la entrada de sus hijos cuando entra en pantalla, una sola vez.
export const Stagger = forwardRef(function Stagger({ as = 'div', className, children, delay = 0, amount = 0.15, ...rest }, ref) {
  const Comp = motion[as]
  return (
    <Comp
      ref={ref}
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: delay } } }}
      {...rest}
    >
      {children}
    </Comp>
  )
})

// Cada pieza sube 24px y aparece. Con movimiento reducido solo cambia la opacidad.
export function Item({ as = 'div', className, children, ...rest }) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  const variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : {
        hidden: { opacity: 0, transform: 'translateY(24px)' },
        show: { opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.7, ease: EASE_OUT } },
      }
  return (
    <Comp className={className} variants={variants} {...rest}>
      {children}
    </Comp>
  )
}
