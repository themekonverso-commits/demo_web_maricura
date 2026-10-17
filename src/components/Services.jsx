import { EXTRAS, REMOVAL, SERVICE_GROUPS, formatMinutes, formatPrice } from '../data/services'
import { Item, Stagger } from './Reveal'

// ---------- Íconos de línea en oro rosa (se dibujan con el color del texto) ----------
const ICONS = {
  // Mano abierta: cuatro dedos, palma y pulgar.
  hand: (
    <>
      <path d="M8 13V6a1.5 1.5 0 0 1 3 0v5.5" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M17 10a1.5 1.5 0 0 1 3 0v4.5A7 7 0 0 1 13 21.5h-1.2a6 6 0 0 1-4.7-2.3L3.7 15a1.6 1.6 0 0 1 2.5-2L8 15.2" />
    </>
  ),
  // Dedo con una uña larga en punta (extensión).
  extension: (
    <>
      <path d="M8 22v-8.5a4 4 0 0 1 8 0V22" />
      <path d="M12 1.8c-1.9 2.7-2.7 5.2-2.7 7.8v2a2.7 2.7 0 0 0 5.4 0v-2c0-2.6-.8-5.1-2.7-7.8z" />
    </>
  ),
  // Pie: planta y cinco dedos.
  foot: (
    <>
      <path d="M9.6 21.5c-2.2 0-3.4-1.7-3.4-3.9 0-2.6 1.7-3.9 1.7-6.6 0-2.3 1-4 3.1-4s3.2 1.7 3.2 4.1c0 2.3-1.2 3.4-1.2 5.6 0 2.8-1.2 4.8-3.4 4.8z" />
      <circle cx="9.6" cy="3.6" r="1.35" />
      <circle cx="12.7" cy="3.9" r="1.05" />
      <circle cx="15" cy="5.1" r="0.9" />
      <circle cx="16.6" cy="6.9" r="0.8" />
      <circle cx="17.4" cy="9" r="0.7" />
    </>
  ),
  // Pincel de nail art.
  brush: (
    <>
      <path d="M20.5 3.5 13.2 10.8" />
      <path d="M12.4 9.2 14.8 11.6 12.9 13.5 10.5 11.1z" />
      <path d="M10.5 11.1c-2.3-.2-4.4 1.5-4.4 4 0 1.8-.9 3.2-2.6 4.2 3.9 1.5 9.1.3 9.4-5.8" />
    </>
  ),
  // Cinta métrica: a tu medida.
  tape: (
    <>
      <circle cx="9.5" cy="11" r="6.5" />
      <circle cx="9.5" cy="11" r="2" />
      <path d="M9.5 17.5H21v-3.5" />
      <path d="M13.5 17.5v-1.8M16.5 17.5v-1.8M19 17.5v-1.2" />
    </>
  ),
  // Copa de champán: eventos.
  glass: (
    <>
      <path d="M8.5 2.5h7l-.6 6.3a2.9 2.9 0 0 1-5.8 0z" />
      <path d="M12 11.7v8.3M8.5 21h7M8.8 6h6.4" />
      <path d="M19 3v2.4M17.8 4.2h2.4" />
    </>
  ),
  // Escudo con corazón: cuidado.
  care: (
    <>
      <path d="M12 2.8l7.5 3V11c0 4.7-3.2 8.3-7.5 10.2C7.7 19.3 4.5 15.7 4.5 11V5.8z" />
      <path d="M12 15.2s-3.2-2-3.2-4.2a1.8 1.8 0 0 1 3.2-1.1 1.8 1.8 0 0 1 3.2 1.1c0 2.2-3.2 4.2-3.2 4.2z" />
    </>
  ),
  // Una persona: una clienta cada vez.
  person: (
    <>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </>
  ),
}

function Icon({ name, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

function IconCircle({ name, size = 'size-14' }) {
  return (
    <span className={`rg-ring ${size} shrink-0 grid place-items-center rounded-full text-rg`}>
      <Icon name={name} />
    </span>
  )
}

function Heart({ filled = false }) {
  return (
    <svg className="inline-block align-[-0.08em] text-rg" width="0.9em" height="0.82em" viewBox="0 0 24 22" aria-hidden="true">
      <path d="M12 20.5s-10-6.3-10-13A5.5 5.5 0 0 1 12 4.3a5.5 5.5 0 0 1 10 3.2c0 6.7-10 13-10 13z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

const PROMISES = [
  { icon: 'tape', text: 'Estilo a tu medida' },
  { icon: 'glass', text: 'Perfectas para eventos' },
  { icon: 'care', text: 'Retirada cuidadosa' },
  { icon: 'person', text: 'Una clienta cada vez' },
]

const GROUP_ICON = { manos: 'hand', extensiones: 'extension', pies: 'foot' }

function Row({ name, desc, minutes, price, plus, onClick }) {
  return (
    <Item as="li">
      <button type="button" onClick={onClick} className="row-hover group w-full text-left rounded-2xl px-3 -mx-3 py-3 transition-colors duration-200">
        <span className="flex items-baseline gap-3">
          <span className="text-lead">{name}</span>
          <span className="rg-leader" aria-hidden="true" />
          <span className="font-caps text-rg text-[1.2rem] tabular whitespace-nowrap">{plus ? `+${formatPrice(price)}` : formatPrice(price)}</span>
        </span>
        <span className="mt-1 flex items-baseline justify-between gap-4">
          <span className="text-cream/70 text-[0.98rem] leading-snug">
            {desc}
            {minutes > 0 && <span className="whitespace-nowrap"> · {plus ? '+' : ''}{formatMinutes(minutes)}</span>}
          </span>
          <span className="row-arrow hidden md:inline text-small text-rg whitespace-nowrap" aria-hidden="true">Reservar →</span>
        </span>
      </button>
    </Item>
  )
}

function MenuCard({ icon, title, from, children }) {
  return (
    <Stagger className="menu-card p-5 sm:p-7 md:p-8">
      <Item className="flex items-center gap-4 mb-4">
        <IconCircle name={icon} size="size-12" />
        <div>
          <h3 className="font-caps rose-gold text-[clamp(1.6rem,1.2rem+1.2vw,2.25rem)] leading-none">{title}</h3>
          {from && <p className="mt-1 text-small text-cream/65">{from}</p>}
        </div>
      </Item>
      <ul>{children}</ul>
    </Stagger>
  )
}

// La carta, al estilo del póster de referencia: los servicios como un menú de lujo en oro rosa
// sobre el fondo oscuro con nieve.
export default function Services({ onPickService, onPickExtra }) {
  return (
    <section id="carta" className="relative z-10 overflow-hidden text-cream pt-[calc(var(--section-y)/2)] pb-[var(--section-y)]">
      <div className="relative wrap">
        <h2 className="sr-only">La carta</h2>

        <Stagger className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-10 text-center md:text-left">
          <Item as="p" className="font-script rose-gold text-[clamp(2.4rem,1.6rem+2.4vw,3.6rem)] leading-[1.05] md:text-right">
            Tus uñas hablan por ti
          </Item>
          <Item className="rg-line-v hidden md:block h-20" />
          <Item as="p" className="text-lead text-cream/90 max-w-[22ch] mx-auto md:mx-0">
            Elegancia en la punta de tus dedos <Heart />
          </Item>
        </Stagger>

        <div className="mt-8 md:mt-12 columns-1 md:columns-2 gap-6 md:gap-8 [&>*]:break-inside-avoid [&>*]:mb-6 md:[&>*]:mb-8">
          {SERVICE_GROUPS.map((g) => (
            <MenuCard key={g.id} icon={GROUP_ICON[g.id]} title={g.name} from={`Desde ${formatPrice(Math.min(...g.items.map((s) => s.price)))}`}>
              {g.items.map((s) => (
                <Row key={s.id} {...s} onClick={() => onPickService(s.id)} />
              ))}
            </MenuCard>
          ))}
          <MenuCard icon="brush" title="Nail art" from="Se suma a cualquier servicio">
            {EXTRAS.filter((e) => e.id !== 'ninguno').map((e) => (
              <Row key={e.id} {...e} plus onClick={() => onPickExtra(e.id)} />
            ))}
            <Item as="li" className="mt-4 text-small text-cream/70">
              ¿Vienes con trabajo de otro salón? La retirada suma {formatPrice(REMOVAL.price)} y {REMOVAL.minutes} minutos.
            </Item>
          </MenuCard>
        </div>

        <Stagger as="ul" className="rg-band mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4">
          {PROMISES.map((p) => (
            <Item as="li" key={p.text} className="rg-band-cell flex flex-col md:flex-row items-center text-center md:text-left gap-2 md:gap-3 px-2 md:px-6 py-5">
              <IconCircle name={p.icon} size="size-11" />
              <span className="font-caps text-[0.85rem] md:text-[0.95rem] tracking-[0.05em] uppercase leading-tight">{p.text}</span>
            </Item>
          ))}
        </Stagger>

        <Stagger>
          <Item as="p" className="mt-12 text-center font-script rose-gold text-[clamp(2rem,1.4rem+2vw,3rem)] leading-tight">
            Regálate el arte de lucir uñas <span className="whitespace-nowrap">bonitas <Heart filled /></span>
          </Item>
          <Item className="mt-8 flex justify-center">
            <a href="#reserva" className="btn glass glass-gold glass-refract">Reservar mi cita</a>
          </Item>
        </Stagger>
      </div>
    </section>
  )
}
