import { BUSINESS } from '../config'
import { Item, Stagger } from './Reveal'

// Andreina, grande: en un negocio de una sola persona, su cara es la mitad de la confianza.
// Va sobre el fondo oscuro con nieve; en celular el retrato queda centrado.
export default function About() {
  return (
    <section id="andreina" className="relative z-10 text-cream section-y">
      <h2 className="sr-only">Sobre Andreina</h2>
      <Stagger className="wrap grid lg:grid-cols-12 gap-x-6 gap-y-10 items-center">
        <Item className="lg:col-span-5">
          <figure className="relative mx-auto lg:mx-0 aspect-square w-full max-w-[420px] overflow-hidden rounded-[var(--radius-media)]">
            <img
              src="./galeria/andreina-retrato.jpg"
              alt="Retrato de Andreina Soto, nail artist de Yuye Nails"
              width="960"
              height="960"
              loading="lazy"
              className="photo rounded-none size-full object-cover"
            />
            <figcaption className="glass absolute left-1/2 -translate-x-1/2 bottom-3 whitespace-nowrap rounded-full px-4 py-2 text-small text-cream">
              Andreina Soto · nail artist
            </figcaption>
          </figure>
        </Item>

        <div className="lg:col-span-6 lg:col-start-7 text-center lg:text-left">
          <Item as="p" className="text-mid leading-[1.15]">
            <span className="text-cream">Andreina Soto es Yuye,</span>{' '}
            <span className="text-cream/75">nail artist venezolana en Sevilla: almendra, chocolate y flores con bolitas doradas.</span>
          </Item>
          <Item as="p" className="mt-6 text-lead text-cream/75 max-w-[46ch] mx-auto lg:mx-0">
            Formada y certificada, comparte cada trabajo en su{' '}
            <a href={BUSINESS.instagram} className="link text-rg" target="_blank" rel="noreferrer">Nail Diary</a>. En su mesa hay
            sitio para una sola clienta: el tiempo que pide el diseño es tuyo.
          </Item>
        </div>
      </Stagger>
    </section>
  )
}
