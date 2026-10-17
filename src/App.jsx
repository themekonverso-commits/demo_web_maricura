import { useState } from 'react'
import GlassDefs from './components/GlassDefs'
import Header from './components/Header'
import Hero from './components/Hero'
import WinterZone from './components/WinterZone'
import Gallery from './components/Gallery'
import Services from './components/Services'
import About from './components/About'
import Booking from './components/Booking'
import Faq from './components/Faq'
import Footer from './components/Footer'

function goToBooking() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('reserva')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
}

export default function App() {
  const [prefill, setPrefill] = useState(null)

  const pick = (data) => {
    setPrefill({ ...data, at: Date.now() })
    requestAnimationFrame(goToBooking)
  }

  return (
    <>
      <GlassDefs />
      <Header />
      <main className="relative z-10 bg-[#151010] overflow-x-clip">
        <Hero />
        <WinterZone>
          <Gallery onWantDesign={(g) => pick({ extraId: g.extra, note: `Quiero el diseño «${g.title}» de la galería.` })} />
          <Services onPickService={(serviceId) => pick({ serviceId })} onPickExtra={(extraId) => pick({ extraId })} />
          <About />
          <Booking prefill={prefill} />
          <Faq />
          <Footer />
        </WinterZone>
      </main>
    </>
  )
}
