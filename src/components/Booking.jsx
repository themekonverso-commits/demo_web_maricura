import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BUSINESS, SCHEDULE, whatsappLink } from '../config'
import { EXTRAS, REMOVAL, SERVICE_GROUPS, formatMinutes, formatPrice } from '../data/services'
import {
  availableTimes,
  changeDeadline,
  currentId,
  dateKey,
  formatLongDate,
  formatShortDate,
  loadBookings,
  minutesToTime,
  newId,
  parseKey,
  rememberCurrent,
  saveBooking,
  startsAt,
  updateBooking,
} from '../lib/booking'

// ---------- Catálogo para reservar: la carta + extras que se suman ----------
const EXTRA_ITEMS = [
  ...EXTRAS.filter((e) => e.id !== 'ninguno').map((e) => ({ ...e, extra: true })),
  { id: 'retirada', name: 'Retirada de otro salón', minutes: REMOVAL.minutes, price: REMOVAL.price, desc: 'Gel, acrílico o semipermanente.', extra: true },
]
const GROUPS = [...SERVICE_GROUPS, { id: 'extras', name: 'Extras', note: 'Se suman a un servicio de manos o pies.', items: EXTRA_ITEMS }]
const BY_ID = Object.fromEntries(GROUPS.flatMap((g) => g.items).map((s) => [s.id, s]))

const STEPS = ['Servicios', 'Día y hora', 'Tus datos']
const COUNTRIES = [
  ['+34', 'España'],
  ['+57', 'Colombia'],
  ['+58', 'Venezuela'],
  ['+52', 'México'],
  ['+54', 'Argentina'],
  ['+51', 'Perú'],
  ['+56', 'Chile'],
  ['+1', 'EE. UU.'],
  ['+44', 'Reino Unido'],
  ['+351', 'Portugal'],
]
const MIDDAY = 14 * 60
const FEW = 6 // con este número de horas libres o menos, el día lleva el puntito de «pocos huecos»
const WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
const EASE = [0.23, 1, 0.32, 1]

const range = (b) => `${minutesToTime(b.start)}–${minutesToTime(b.start + b.minutes)}`
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
const deadlineText = (b) => {
  const d = changeDeadline(b)
  return `${formatShortDate(dateKey(d))} a las ${minutesToTime(d.getHours() * 60 + d.getMinutes())}`
}

// ---------- Piezas pequeñas ----------

function Icon({ d, size = 16, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  )
}
const ICON = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
}

function Checkbox({ checked }) {
  return (
    <span className={`shrink-0 size-6 rounded-md grid place-items-center transition-colors duration-200 ${checked ? 'bg-accent text-accent-ink' : 'rg-ring'}`}>
      {checked && <Icon d={ICON.check} size={15} />}
    </span>
  )
}

// Paso en el que estoy, como en la referencia: los hechos llevan ✓ y se puede volver a ellos.
function Stepper({ step, onGo }) {
  return (
    <ol className="no-scrollbar flex gap-2 overflow-x-auto -mx-[var(--gutter)] px-[var(--gutter)] md:mx-0 md:px-0">
      {STEPS.map((label, i) => {
        const done = i < step
        const active = i === step
        return (
          <li key={label} className="shrink-0">
            <button
              type="button"
              disabled={!done}
              onClick={() => onGo(i)}
              aria-current={active ? 'step' : undefined}
              className={`chip min-h-11 rounded-full px-5 flex items-center gap-2 text-[1rem] ${
                active ? 'bg-accent text-accent-ink font-medium' : done ? 'bg-cream/[0.08] text-cream cursor-pointer' : 'text-cream/55 cursor-default'
              }`}
            >
              {done && <Icon d={ICON.check} size={15} className="text-rg" />}
              {label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// Resumen de lo elegido arriba de los pasos 2 y 3, con «Cambiar».
function SummaryCard({ items, minutes, onChange }) {
  return (
    <div className="menu-card px-5 py-4 md:px-7 md:py-5 flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-lead leading-snug">{items.map((s) => s.name).join(' + ')}</p>
        <p className="text-small text-cream/70 mt-0.5">
          {formatMinutes(minutes)} · Con {BUSINESS.owner}
        </p>
      </div>
      <button type="button" onClick={onChange} className="link text-rg shrink-0 min-h-11 px-1">
        Cambiar
      </button>
    </div>
  )
}

// Barra que acompaña abajo mientras eliges: resumen + acción principal.
function BottomBar({ note, title, sub, action, actionProps }) {
  return (
    <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mt-8">
      <div className="glass glass-dark rounded-[var(--radius-panel)] px-5 py-4 md:px-7 md:py-5 [--glass-alpha:0.72] [--glass-blur:24px]">
        {note && (
          <p className="text-small text-cream/70 flex items-center gap-2 mb-2">
            <Icon d={ICON.lock} size={14} /> {note}
          </p>
        )}
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-lead leading-tight">{title}</p>
            {sub && <p className="text-small text-cream/70 mt-0.5">{sub}</p>}
          </div>
          <button className="btn glass glass-gold glass-refract shrink-0 px-6 md:px-8" {...actionProps}>
            {action}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Paso 1: servicios ----------

function ServicesStep({ selected, toggle, error }) {
  const hasMain = selected.some((id) => !BY_ID[id].extra)
  return (
    <div>
      <h3 className="font-caps rose-gold text-[clamp(2rem,1.4rem+2.2vw,3rem)] leading-tight">¿Qué te hacemos?</h3>
      <p className="mt-1 text-cream/75">Puedes elegir varios servicios.</p>
      {GROUPS.map((g) => (
        <div key={g.id} className="mt-8">
          <h4 className="font-caps text-rg uppercase tracking-[0.12em] text-[0.95rem]">{g.name}</h4>
          {g.note && <p className="text-small text-cream/60 mt-0.5">{g.note}</p>}
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            {g.items.map((s) => {
              const checked = selected.includes(s.id)
              const locked = s.extra && !hasMain
              return (
                <button
                  key={s.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  disabled={locked}
                  onClick={() => toggle(s.id)}
                  className={`menu-card chip text-left flex items-center gap-4 px-4 py-4 md:px-5 min-h-[76px] ${checked ? 'is-selected' : ''} ${
                    locked ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Checkbox checked={checked} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-lead leading-snug">{s.name}</span>
                    <span className="block text-small text-cream/65 leading-snug mt-0.5">{s.desc}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-caps text-rg text-[1.15rem] tabular">{s.extra ? '+' : ''}{formatPrice(s.price)}</span>
                    <span className="block text-small text-cream/65 tabular">{s.extra ? '+' : ''}{formatMinutes(s.minutes)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {error && <p className="mt-4 text-accent">{error}</p>}
    </div>
  )
}

// ---------- Paso 2: día y hora ----------

function Calendar({ month, setMonth, date, onPick, freeCount }) {
  const today = new Date()
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + SCHEDULE.daysAhead)
  const canPrev = first > new Date(today.getFullYear(), today.getMonth(), 1)
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= last
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]

  return (
    <div className="menu-card p-4 md:p-6">
      <div className="flex items-center justify-between">
        <button type="button" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mes anterior" className="chip size-11 grid place-items-center rounded-full disabled:opacity-25">
          <Icon d={ICON.left} size={18} />
        </button>
        <p className="font-caps text-rg text-[1.2rem] first-letter:uppercase">{monthName.format(month)}</p>
        <button type="button" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Mes siguiente" className="chip size-11 grid place-items-center rounded-full disabled:opacity-25">
          <Icon d={ICON.right} size={18} />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-y-1.5 text-center">
        {WEEK.map((w) => (
          <span key={w} className="text-small text-cream/55 pb-2">{w}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`v${i}`} />
          const key = dateKey(d)
          const free = freeCount(key)
          const off = free === 0
          const selected = key === date
          return (
            <span key={key} className="grid place-items-center">
              <button
                type="button"
                disabled={off}
                onClick={() => onPick(key)}
                aria-pressed={selected}
                aria-label={`${formatLongDate(key)}${off ? ', sin horas libres' : free <= FEW ? ', pocos huecos' : ''}`}
                className={`chip relative size-11 md:size-12 rounded-full tabular text-[1.05rem] ${
                  selected ? 'bg-accent text-accent-ink font-medium' : off ? 'text-cream/25 cursor-not-allowed' : 'bg-cream/[0.07] text-cream font-medium'
                }`}
              >
                {d.getDate()}
                {!off && !selected && free <= FEW && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[#e2ab98]" />}
              </button>
            </span>
          )
        })}
      </div>
      <p className="mt-4 text-small text-cream/60 flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-[#e2ab98]" /> pocos huecos
        </span>
        <span>Los días en gris no tienen horas libres</span>
      </p>
    </div>
  )
}

function TimeGroup({ label, times, start, setStart, reduce }) {
  if (!times.length) return null
  return (
    <div className="mt-5">
      <p className="text-small text-cream/70 flex items-center gap-2 mb-2.5">
        <Icon d={ICON.clock} size={15} /> {label}
      </p>
      <motion.div className="grid grid-cols-4 sm:grid-cols-5 gap-2" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.02 } } }}>
        {times.map((t) => (
          <motion.button
            key={t}
            type="button"
            aria-pressed={t === start}
            onClick={() => setStart(t)}
            className={`chip min-h-12 rounded-full tabular text-[1.02rem] ${t === start ? 'bg-accent text-accent-ink font-medium' : 'bg-cream/[0.07] text-cream'}`}
            variants={
              reduce
                ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
                : { hidden: { opacity: 0, transform: 'translateY(6px)' }, show: { opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.3, ease: EASE } } }
            }
          >
            {minutesToTime(t)}
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}

function DayStep({ items, minutes, date, setDate, start, setStart, month, setMonth, freeCount, timesFor, onChangeServices, reduce, rescheduling }) {
  const times = date ? timesFor(date) : []
  const morning = times.filter((t) => t < MIDDAY)
  const afternoon = times.filter((t) => t >= MIDDAY)
  const hint = morning.length && afternoon.length ? 'Hay hueco por la mañana y por la tarde' : morning.length ? 'Solo queda hueco por la mañana' : 'Solo queda hueco por la tarde'
  return (
    <div>
      {!rescheduling && <SummaryCard items={items} minutes={minutes} onChange={onChangeServices} />}
      <h3 className="mt-8 font-caps rose-gold text-[clamp(2rem,1.4rem+2.2vw,3rem)] leading-tight">
        {rescheduling ? 'Elige el nuevo día' : '¿Qué día te viene bien?'}
      </h3>
      <div className="mt-5 grid lg:grid-cols-2 gap-4 md:gap-6 items-start">
        <Calendar
          month={month}
          setMonth={setMonth}
          date={date}
          freeCount={freeCount}
          onPick={(k) => {
            setDate(k)
            setStart(null)
          }}
        />
        <div className="menu-card p-4 md:p-6" aria-live="polite">
          {date ? (
            <>
              <p className="text-lead">{formatLongDate(date)}</p>
              <p className="text-small text-cream/65 mt-0.5">{hint}</p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                  <TimeGroup label="Mañana" times={morning} start={start} setStart={setStart} reduce={reduce} />
                  <TimeGroup label="Tarde" times={afternoon} start={start} setStart={setStart} reduce={reduce} />
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <p className="text-cream/70">Elige un día en el calendario para ver las horas libres.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- Paso 3: tus datos ----------

function Field({ label, optional, error, hint, children }) {
  return (
    <label className="block">
      <span className="block mb-1.5">
        {label} {optional && <span className="text-cream/60">(opcional)</span>}
      </span>
      {children}
      {hint && !error && <span className="block mt-1.5 text-small text-cream/60">{hint}</span>}
      {error && <span className="block mt-1.5 text-small text-accent">{error}</span>}
    </label>
  )
}

function DataStep({ items, minutes, date, start, form, setForm, errors, onChangeServices }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  return (
    <div>
      <SummaryCard items={items} minutes={minutes} onChange={onChangeServices} />
      <h3 className="mt-8 font-caps rose-gold text-[clamp(2rem,1.4rem+2.2vw,3rem)] leading-tight">Tus datos</h3>
      <p className="mt-1 text-cream/75">
        {formatLongDate(date)} a las {minutesToTime(start)} · Con {BUSINESS.owner}
      </p>
      <form id="form-datos" className="mt-6 grid md:grid-cols-2 gap-x-6 gap-y-5" noValidate onSubmit={(e) => e.preventDefault()}>
        <Field label="Nombre y apellido" error={errors.name}>
          <input className="field" value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />
        </Field>
        <Field label="Teléfono" error={errors.phone} hint="Andreina te escribirá aquí si hay algún cambio.">
          <span className="flex gap-2">
            <select className="field w-[8.5rem] shrink-0" value={form.cc} onChange={set('cc')} aria-label="Prefijo del país" autoComplete="tel-country-code">
              {COUNTRIES.map(([cc, name]) => (
                <option key={cc + name} value={cc}>
                  {cc} {name}
                </option>
              ))}
            </select>
            <input className="field tabular min-w-0" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel-national" aria-invalid={!!errors.phone} aria-label="Número de teléfono" />
          </span>
        </Field>
        <div className="md:col-span-2">
          <Field label="Email" error={errors.email}>
            <input className="field" type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="¿Algo que deba saber?" optional>
            <textarea className="field min-h-28 resize-y" value={form.note} onChange={set('note')} placeholder="Forma, largo, colores o el diseño que viste en el Nail Diary" />
          </Field>
        </div>
        <label className="md:col-span-2 flex items-start gap-3 cursor-pointer min-h-11">
          <input type="checkbox" className="sr-only" checked={form.privacy} onChange={set('privacy')} />
          <span className="pt-0.5"><Checkbox checked={form.privacy} /></span>
          <span>
            He leído y acepto la política de privacidad de {BUSINESS.name}.
            {errors.privacy && <span className="block text-small text-accent mt-1">{errors.privacy}</span>}
          </span>
        </label>
        <label className="md:col-span-2 flex items-start gap-3 cursor-pointer min-h-11">
          <input type="checkbox" className="sr-only" checked={form.promo} onChange={set('promo')} />
          <span className="pt-0.5"><Checkbox checked={form.promo} /></span>
          <span>
            Quiero recibir novedades y diseños de temporada de {BUSINESS.name}.{' '}
            <span className="text-cream/60">Opcional; puedes darte de baja cuando quieras.</span>
          </span>
        </label>
      </form>
    </div>
  )
}

// ---------- Después de reservar ----------

function DetailRows({ rows }) {
  return (
    <dl className="rounded-[calc(var(--radius-panel)-6px)] bg-cream/[0.05] px-5 md:px-6">
      {rows.map(([k, v], i) => (
        <div key={k} className={`flex items-baseline justify-between gap-6 py-3.5 ${i ? 'rg-row' : ''}`}>
          <dt className="text-cream/65 shrink-0">{k}</dt>
          <dd className="text-right font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Done({ booking, onManage, reduce }) {
  const message = [
    `Hola ${BUSINESS.owner.split(' ')[0]}, acabo de reservar en ${BUSINESS.name}:`,
    `• ${booking.services.join(' + ')}`,
    `• ${formatLongDate(booking.date)}, ${range(booking)}`,
    `• Total: ${formatPrice(booking.price)}`,
    `• A nombre de: ${booking.name} (${booking.phone})`,
    booking.note ? `• Nota: ${booking.note}` : null,
    `Código de la cita: ${booking.id}`,
  ]
    .filter(Boolean)
    .join('\n')
  return (
    <div className="menu-card mx-auto max-w-[720px] px-5 py-8 md:px-10 md:py-10 text-center">
      <motion.span
        className="mx-auto grid place-items-center size-20 rounded-full bg-accent text-accent-ink"
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.6)' }}
        animate={{ opacity: 1, transform: 'scale(1)' }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.6 }}
      >
        <Icon d={ICON.check} size={34} />
      </motion.span>
      <h3 className="mt-5 font-caps rose-gold text-[clamp(2.2rem,1.6rem+2.4vw,3.2rem)] leading-tight">¡Cita reservada!</h3>
      <p className="mt-1 text-lead text-cream/80">Te espero, {booking.name.split(' ')[0]}.</p>
      <div className="mt-7 text-left">
        <DetailRows
          rows={[
            ['Día', formatLongDate(booking.date)],
            ['Hora', range(booking)],
            ['Con', BUSINESS.owner],
            ['Servicios', booking.services.join(' + ')],
            ['Total', formatPrice(booking.price)],
          ]}
        />
      </div>
      <div className="mt-8 flex flex-col items-center gap-3">
        <button type="button" className="btn glass glass-gold glass-refract" onClick={onManage}>
          Ver, cambiar o cancelar mi cita
        </button>
        <a className="btn glass text-cream" href={whatsappLink(message)} target="_blank" rel="noreferrer">
          Enviar el resumen a Andreina por WhatsApp
        </a>
      </div>
      <p className="mt-5 text-small text-cream/60">
        Puedes cambiar o cancelar hasta {SCHEDULE.changeHours} horas antes. Esta demo guarda la cita solo en este navegador.
      </p>
    </div>
  )
}

function CancelDialog({ booking, onClose, onConfirm, reduce }) {
  const [reason, setReason] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    ref.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose])
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[#151010]/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-titulo"
        className="glass glass-dark w-full max-w-[520px] rounded-[var(--radius-panel)] p-6 md:p-8 [--glass-alpha:0.7] [--glass-blur:30px]"
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.95)', filter: 'blur(8px)' }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
        exit={{ opacity: 0, transform: 'scale(0.97)' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="cancelar-titulo" className="font-caps rose-gold text-[1.9rem] leading-tight">¿Cancelar la cita?</h3>
        <p className="mt-2 text-cream/85">
          {formatLongDate(booking.date)} a las {minutesToTime(booking.start)} con {BUSINESS.owner}. No se puede deshacer, pero puedes reservar otra cuando quieras.
        </p>
        <label className="block mt-5">
          <span className="block mb-1.5">
            Motivo <span className="text-cream/60">(opcional)</span>
          </span>
          <textarea ref={ref} className="field min-h-24 resize-y" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn glass text-cream" onClick={onClose}>
            No, volver
          </button>
          <button type="button" className="btn bg-[#e98a7c] text-[#1c0f0b] px-7" onClick={() => onConfirm(reason.trim())}>
            Sí, cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Manage({ booking, onReschedule, onCancel, onNew }) {
  const cancelled = booking.status === 'cancelled'
  const canChange = !cancelled && new Date() < changeDeadline(booking)
  return (
    <div className="menu-card mx-auto max-w-[820px] px-5 py-7 md:px-9 md:py-9">
      <span className={`inline-block rounded-full px-4 py-1.5 text-small ${cancelled ? 'bg-[#e98a7c]/15 text-[#f0a296]' : 'bg-cream/[0.08] text-rg'}`}>
        {cancelled ? 'Cancelada' : 'Confirmada'}
      </span>
      <h3 className={`mt-4 font-caps text-[clamp(1.8rem,1.2rem+2.2vw,2.8rem)] leading-tight ${cancelled ? 'text-cream/50 line-through' : 'rose-gold'}`}>
        {formatLongDate(booking.date)}, {minutesToTime(booking.start)}
      </h3>
      <p className="mt-1 text-cream/75">
        {booking.services.join(' + ')} · {formatMinutes(booking.minutes)}
      </p>
      <div className="mt-6">
        <DetailRows
          rows={[
            ['Con', BUSINESS.owner],
            ['Hora', range(booking)],
            ['Total', formatPrice(booking.price)],
            ['A nombre de', booking.name],
            ['Código', booking.id],
          ]}
        />
      </div>
      {cancelled ? (
        <div className="mt-7 text-center">
          <p className="text-cream/75">Esta cita está cancelada. Cuando quieras, reserva otra.</p>
          <button type="button" className="btn glass glass-gold glass-refract mt-5" onClick={onNew}>
            Reservar otra cita
          </button>
        </div>
      ) : (
        <>
          <div className="mt-7 grid sm:grid-cols-2 gap-3">
            <button type="button" disabled={!canChange} onClick={onReschedule} className="btn glass text-cream w-full disabled:opacity-40">
              <Icon d={ICON.calendar} size={18} /> Cambiar día u hora
            </button>
            <button type="button" disabled={!canChange} onClick={onCancel} className="btn glass text-[#f0a296] w-full disabled:opacity-40">
              <Icon d={ICON.x} size={18} /> Cancelar cita
            </button>
          </div>
          <p className="mt-4 text-center text-small text-cream/60">
            {canChange
              ? `Puedes cambiarla o cancelarla hasta ${SCHEDULE.changeHours} horas antes: hasta el ${deadlineText(booking)}.`
              : `Faltan menos de ${SCHEDULE.changeHours} horas: para cambiarla, escribe a Andreina por WhatsApp.`}
          </p>
        </>
      )}
    </div>
  )
}

// ---------- Sección completa ----------

const EMPTY_FORM = { name: '', cc: '+34', phone: '', email: '', note: '', privacy: false, promo: false }

export default function Booking({ prefill }) {
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)
  const lastStep = useRef(null)
  const [bookings, setBookings] = useState(loadBookings)
  const [view, setView] = useState('flow') // flow | done | manage
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState([])
  const [date, setDate] = useState(null)
  const [start, setStart] = useState(null)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [currentBooking, setCurrentBooking] = useState(() => currentId())
  const [reschedule, setReschedule] = useState(null) // id de la cita que se está cambiando
  const [cancelOpen, setCancelOpen] = useState(false)

  const booking = bookings.find((b) => b.id === currentBooking) ?? null
  const items = selected.map((id) => BY_ID[id])
  const minutes = reschedule ? booking?.minutes ?? 0 : items.reduce((a, s) => a + s.minutes, 0)
  const price = items.reduce((a, s) => a + s.price, 0)
  const hasMain = items.some((s) => !s.extra)

  const now = useMemo(() => new Date(), [view, step])
  const cache = useMemo(() => new Map(), [minutes, bookings, reschedule, now])
  const timesFor = (key) => {
    if (!cache.has(key)) cache.set(key, availableTimes(key, minutes, bookings, now, reschedule ?? undefined))
    return cache.get(key)
  }
  const freeCount = (key) => timesFor(key).length

  // Entrada desde el carrusel o la carta: preselecciona y abre el paso 1.
  useEffect(() => {
    if (!prefill) return
    setView('flow')
    setReschedule(null)
    setStep(0)
    setSelected((sel) => {
      let next = [...sel]
      if (prefill.serviceId && !next.includes(prefill.serviceId)) next.push(prefill.serviceId)
      if (prefill.extraId && prefill.extraId !== 'ninguno' && !next.includes(prefill.extraId)) next.push(prefill.extraId)
      if (next.some((id) => BY_ID[id]?.extra) && !next.some((id) => !BY_ID[id]?.extra)) next = ['semi', ...next]
      return next
    })
    if (prefill.note) setForm((f) => ({ ...f, note: prefill.note }))
  }, [prefill])

  // Al cambiar de paso o de vista, la sección vuelve arriba para que se vea el comienzo (clave en celular).
  // Se compara con el paso anterior (y no con «primer render») para que el modo estricto de React,
  // que ejecuta los efectos dos veces al montar, no baje la página hasta aquí al cargar.
  useEffect(() => {
    const key = `${step}|${view}|${reschedule}`
    if (lastStep.current === key) return
    const first = lastStep.current === null
    lastStep.current = key
    if (first) return
    sectionRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [step, view, reschedule])

  // Al entrar al calendario: primer día con hueco, y su mes.
  const pickFirstDay = () => {
    const today = new Date()
    for (let i = 0; i <= SCHEDULE.daysAhead; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
      const key = dateKey(d)
      if (freeCount(key) > 0) {
        setDate(key)
        setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
        return
      }
    }
    setDate(null)
  }
  useEffect(() => {
    if (view === 'flow' && step === 1 && (!date || !freeCount(date))) pickFirstDay()
    if (date && start !== null && !timesFor(date).includes(start)) setStart(null)
  }, [step, view, minutes, reschedule])

  const toggle = (id) => {
    setErrors({})
    setSelected((sel) => {
      const next = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
      // sin servicio principal, los extras no tienen sentido solos
      return next.some((x) => !BY_ID[x].extra) ? next : []
    })
  }

  function submit() {
    const e = {}
    if (form.name.trim().split(/\s+/).length < 2) e.name = 'Escribe tu nombre y apellido.'
    if (form.phone.replace(/\D/g, '').length < 6) e.phone = 'Escribe un teléfono válido.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Escribe un email válido.'
    if (!form.privacy) e.privacy = 'Necesitas aceptar la política de privacidad para reservar.'
    setErrors(e)
    if (Object.keys(e).length) {
      // lleva el cursor al primer campo con error (o a la casilla de privacidad)
      requestAnimationFrame(() => {
        const el = document.querySelector('#reserva [aria-invalid="true"]') ?? document.querySelector('#reserva input[type="checkbox"]')
        el?.focus({ preventScroll: true })
        el?.closest('label')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
      })
      return
    }
    const b = {
      id: newId(),
      status: 'confirmed',
      date,
      start,
      minutes,
      price,
      services: items.map((s) => s.name),
      name: form.name.trim(),
      phone: `${form.cc} ${form.phone.trim()}`,
      email: form.email.trim(),
      note: form.note.trim(),
      promo: form.promo,
      createdAt: Date.now(),
    }
    setBookings(saveBooking(b))
    rememberCurrent(b.id)
    setCurrentBooking(b.id)
    setView('done')
  }

  function confirmReschedule() {
    setBookings(updateBooking(reschedule, { date, start, changedAt: Date.now() }))
    setReschedule(null)
    setView('manage')
  }

  function startOver() {
    setSelected([])
    setDate(null)
    setStart(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setReschedule(null)
    setStep(0)
    setView('flow')
  }

  const upcoming = booking && booking.status === 'confirmed' && startsAt(booking) > new Date() ? booking : null
  const stepKey = `${view}-${step}-${reschedule ?? ''}`
  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, transform: 'translateX(28px)' },
        animate: { opacity: 1, transform: 'translateX(0px)' },
        exit: { opacity: 0, transform: 'translateX(-28px)', transition: { duration: 0.15 } },
      }

  let bar = null
  if (view === 'flow' && step === 0) {
    bar = (
      <BottomBar
        title={selected.length ? `${plural(items.length, 'servicio', 'servicios')} · ${formatMinutes(minutes)}` : 'Elige al menos un servicio'}
        sub={selected.length ? formatPrice(price) : 'Los extras se suman a un servicio.'}
        action="Continuar"
        actionProps={{ type: 'button', disabled: !hasMain, onClick: () => setStep(1) }}
      />
    )
  } else if (view === 'flow' && step === 1) {
    bar = (
      <BottomBar
        note={`Puedes cambiar o cancelar hasta ${SCHEDULE.changeHours} horas antes.`}
        title={date && start !== null ? `${formatShortDate(date)} · ${minutesToTime(start)}` : 'Elige día y hora'}
        sub={reschedule ? formatMinutes(minutes) : `${formatMinutes(minutes)} · ${formatPrice(price)}`}
        action={reschedule ? 'Confirmar cambio' : 'Continuar'}
        actionProps={{ type: 'button', disabled: !date || start === null, onClick: reschedule ? confirmReschedule : () => setStep(2) }}
      />
    )
  } else if (view === 'flow' && step === 2) {
    bar = (
      <BottomBar
        note={`Puedes cambiar o cancelar hasta ${SCHEDULE.changeHours} horas antes.`}
        title={`${formatShortDate(date)} · ${minutesToTime(start)}`}
        sub={`${formatMinutes(minutes)} · ${formatPrice(price)}`}
        action="Reservar"
        actionProps={{ type: 'button', onClick: submit }}
      />
    )
  }

  return (
    <section id="reserva" ref={sectionRef} className="relative z-10 text-cream section-y">
      <div className="wrap">
        {/* Encabezado: el estudio, como en la referencia */}
        <div className="flex items-center gap-4">
          <img src="./galeria/andreina-retrato.jpg" alt="" width="96" height="96" className="size-14 md:size-16 rounded-full object-cover rg-ring p-0.5" />
          <div className="min-w-0">
            <h2 className="font-caps rose-gold text-[clamp(1.6rem,1.2rem+1.4vw,2.3rem)] leading-tight">Reserva tu cita</h2>
            <p className="text-small text-cream/70">
              {BUSINESS.name} · {BUSINESS.owner} · {BUSINESS.city}, con cita previa
            </p>
          </div>
        </div>

        {upcoming && view === 'flow' && !reschedule && (
          <button type="button" onClick={() => setView('manage')} className="mt-5 w-full menu-card chip px-5 py-3.5 flex items-center gap-3 text-left cursor-pointer">
            <Icon d={ICON.calendar} size={18} className="text-rg shrink-0" />
            <span className="flex-1">
              Tienes una cita el {formatShortDate(upcoming.date)} a las {minutesToTime(upcoming.start)}
            </span>
            <span className="link text-rg shrink-0">Ver mi cita</span>
          </button>
        )}

        {view === 'flow' && (
          <div className="mt-6">
            {reschedule ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-cream/80">Cambiando tu cita del {formatShortDate(booking.date)} a las {minutesToTime(booking.start)}</p>
                <button type="button" className="link text-rg min-h-11" onClick={() => { setReschedule(null); setView('manage') }}>
                  Volver
                </button>
              </div>
            ) : (
              <Stepper step={step} onGo={setStep} />
            )}
          </div>
        )}

        <div className="mt-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={stepKey} {...slide} transition={{ duration: 0.35, ease: EASE }}>
              {view === 'flow' && step === 0 && <ServicesStep selected={selected} toggle={toggle} />}
              {view === 'flow' && step === 1 && (
                <DayStep
                  items={items}
                  minutes={minutes}
                  date={date}
                  setDate={setDate}
                  start={start}
                  setStart={setStart}
                  month={month}
                  setMonth={setMonth}
                  freeCount={freeCount}
                  timesFor={timesFor}
                  onChangeServices={() => setStep(0)}
                  reduce={reduce}
                  rescheduling={!!reschedule}
                />
              )}
              {view === 'flow' && step === 2 && (
                <DataStep items={items} minutes={minutes} date={date} start={start} form={form} setForm={setForm} errors={errors} onChangeServices={() => setStep(0)} />
              )}
              {view === 'done' && booking && <Done booking={booking} onManage={() => setView('manage')} reduce={reduce} />}
              {view === 'manage' && booking && (
                <Manage
                  booking={booking}
                  onReschedule={() => {
                    setReschedule(booking.id)
                    setDate(booking.date)
                    setStart(null)
                    setMonth(new Date(parseKey(booking.date).getFullYear(), parseKey(booking.date).getMonth(), 1))
                    setStep(1)
                    setView('flow')
                  }}
                  onCancel={() => setCancelOpen(true)}
                  onNew={startOver}
                />
              )}
            </motion.div>
          </AnimatePresence>
          {bar}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {cancelOpen && booking && (
            <CancelDialog
              booking={booking}
              reduce={reduce}
              onClose={() => setCancelOpen(false)}
              onConfirm={(reason) => {
                setBookings(updateBooking(booking.id, { status: 'cancelled', cancelReason: reason, cancelledAt: Date.now() }))
                setCancelOpen(false)
                sectionRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
              }}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  )
}
