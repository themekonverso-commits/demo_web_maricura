// El reflejo del vidrio sigue al puntero: actualiza --mx / --my en el elemento .glass que está debajo.
// Solo con ratón o trackpad; en pantallas táctiles el reflejo se queda quieto.
export function startGlassLight() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  let frame = 0
  let last = null
  const onMove = (e) => {
    last = e
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      const el = last.target instanceof Element ? last.target.closest('.glass') : null
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${((last.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--my', `${((last.clientY - r.top) / r.height) * 100}%`)
    })
  }
  window.addEventListener('pointermove', onMove, { passive: true })
}

// La refracción con filtro SVG solo funciona en navegadores Chromium.
export function enableRefraction() {
  const ua = navigator.userAgent
  const chromium = /Chrome|Chromium|Edg\//.test(ua) && !/Firefox|FxiOS/.test(ua)
  const reduced = window.matchMedia('(prefers-reduced-transparency: reduce)').matches
  if (chromium && !reduced) document.documentElement.classList.add('lg-refract')
}
