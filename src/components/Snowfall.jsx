import { useEffect, useRef } from 'react'

// Nieve cayendo en bucle sobre un lienzo. Tres capas de copos para dar profundidad:
// diminutos y nítidos (lejos), medianos, y unos pocos grandes y desenfocados (cerca de la cámara).
const TONE = '255, 246, 240' // blanco cálido

const LAYERS = [
  { share: 0.68, r: [0.5, 1.4], alpha: [0.45, 0.85], speed: [6, 14], blur: false },
  { share: 0.24, r: [1.6, 3], alpha: [0.35, 0.65], speed: [12, 22], blur: false },
  { share: 0.08, r: [5, 11], alpha: [0.12, 0.3], speed: [20, 34], blur: true },
]

const rand = (a, b) => a + Math.random() * (b - a)

// Copo desenfocado ya dibujado, para no calcular el degradado en cada fotograma.
function makeSoftSprite() {
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, `rgba(${TONE}, 1)`)
  grad.addColorStop(0.35, `rgba(${TONE}, 0.75)`)
  grad.addColorStop(1, `rgba(${TONE}, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return c
}

function makeFlake(w, h, layer, anywhere) {
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : -20,
    r: rand(...layer.r),
    a: rand(...layer.alpha),
    vy: rand(...layer.speed), // píxeles por segundo
    sway: rand(6, 22), // amplitud del vaivén
    freq: rand(0.15, 0.45), // vaivenes por segundo
    phase: Math.random() * Math.PI * 2,
    blur: layer.blur,
    layer,
  }
}

export default function Snowfall({ className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const sprite = makeSoftSprite()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let flakes = []
    let frame = 0
    let last = 0
    let visible = true
    let t = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(220, Math.max(80, Math.round((w * h) / 4600)))
      flakes = []
      for (const layer of LAYERS) {
        const n = Math.max(layer.blur ? 3 : 8, Math.round(count * layer.share))
        for (let i = 0; i < n; i++) flakes.push(makeFlake(w, h, layer, true))
      }
      // Los grandes se dibujan al final, por delante.
      flakes.sort((a, b) => a.r - b.r)
      draw(0)
    }

    const draw = (dt) => {
      t += dt
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        f.y += f.vy * dt
        if (f.y - f.r * 2 > h) Object.assign(f, makeFlake(w, h, f.layer, false), { y: -f.r * 2 })
        const x = f.x + Math.sin(t * f.freq * Math.PI * 2 + f.phase) * f.sway
        if (f.blur) {
          const s = f.r * 4
          ctx.globalAlpha = f.a
          ctx.drawImage(sprite, x - s / 2, f.y - s / 2, s, s)
        } else {
          ctx.globalAlpha = f.a
          ctx.fillStyle = `rgb(${TONE})`
          ctx.beginPath()
          ctx.arc(x, f.y, f.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    const loop = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      draw(dt)
      frame = requestAnimationFrame(loop)
    }

    const start = () => {
      if (reduce || frame || !visible || document.hidden) return
      last = 0
      frame = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Solo se anima cuando la sección está en pantalla y la pestaña está visible.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      visible ? start() : stop()
    })
    io.observe(canvas)
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />
}
