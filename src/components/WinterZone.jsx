import Snowfall from './Snowfall'

// Zona oscura continua para el carrusel y la carta: un solo fondo, sin cortes entre secciones,
// y una sola nevada que acompaña la pantalla mientras se recorre toda la zona.
export default function WinterZone({ children }) {
  return (
    <div className="winter-zone relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="sticky top-0 h-[100svh]">
          <Snowfall />
        </div>
      </div>
      {children}
    </div>
  )
}
