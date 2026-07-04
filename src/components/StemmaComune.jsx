/**
 * StemmaComune — riproduzioni vettoriali degli stemmi civici ufficiali.
 *
 * Blasoni riprodotti (semplificati, senza corona murale e fronde ornamentali):
 *  - villafranca : semipartito d'azzurro e di rosso, al castello d'oro
 *                  torricellato, merlato, aperto (Villafranca di Verona)
 *  - povegliano  : di rosso, al gambero e alla pastinaca al naturale,
 *                  accompagnati da sei stelle d'argento (Povegliano Veronese)
 *  - mozzecane   : troncato: nel 1° d'azzurro, al braccio al naturale
 *                  sopra un braciere d'oro fiammeggiante di rosso; nel 2°
 *                  d'argento, al cane passante di rosso (Mozzecane)
 *  - vigasio     : d'azzurro, alla croce d'argento accantonata da quattro
 *                  libellule (Vigasio)
 *
 * Varianti d'uso (deterministiche, una per contesto):
 *  - "pieno"   : colori araldici ufficiali — card, elenchi, popup mappa
 *  - "storico" : desaturato (filtro CSS) — timeline storica, contesti d'epoca
 *  - "linea"   : monocromo ad alto contrasto — header scuri, icone piccole
 */
import { useId } from 'react'

const AZZURRO = '#4a86d0'
const ROSSO = '#cf2420'
const ORO = '#e9c353'
const ORO_SCURO = '#8a6414'
const ARGENTO = '#f4f7f9'
const ARGENTO_SCURO = '#8fa0ac'
const CARNAGIONE = '#f2c9a4'
const VERDE = '#3f8f2e'

const FILTRI = {
  pieno: 'none',
  storico: 'grayscale(1) opacity(0.82)',
  linea: 'grayscale(1) contrast(1.6)',
}

function Scudo({ children, title, clipId }) {
  return (
    <svg viewBox="0 0 64 76" fill="none" role="img" aria-label={title} width="100%" height="100%">
      <title>{title}</title>
      <clipPath id={clipId}>
        <path d="M6 6 H58 V44 C58 60 46 68 32 72 C18 68 6 60 6 44 Z" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{children}</g>
      <path
        d="M6 6 H58 V44 C58 60 46 68 32 72 C18 68 6 60 6 44 Z"
        fill="none" stroke={ORO_SCURO} strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  )
}

/* Semipartito d'azzurro e di rosso, castello d'oro torricellato */
function Villafranca() {
  return (
    <>
      <rect x="6" y="6" width="26" height="66" fill={AZZURRO} />
      <rect x="32" y="6" width="26" height="66" fill={ROSSO} />
      <g stroke={ORO_SCURO} strokeWidth="1">
        {/* corpo centrale con porta */}
        <path d="M18 60 L18 40 L46 40 L46 60 Z" fill={ORO} />
        <path d="M27 60 L27 50 Q32 45.5 37 50 L37 60 Z" fill="#4a3808" stroke="none" />
        {/* torre centrale merlata */}
        <path d="M25 40 L25 18 L27.5 18 L27.5 21.5 L30.5 21.5 L30.5 18 L33.5 18 L33.5 21.5 L36.5 21.5 L36.5 18 L39 18 L39 40 Z" fill={ORO} />
        <rect x="30" y="26" width="4" height="6" rx="2" fill="#4a3808" stroke="none" />
        {/* torrette laterali merlate */}
        <path d="M14 40 L14 28 L16 28 L16 31 L18.5 31 L18.5 28 L21.5 28 L21.5 31 L24 31 L24 28 L25 28 L25 40 Z" fill={ORO} />
        <path d="M39 40 L39 28 L40 28 L40 31 L42.5 31 L42.5 28 L45.5 28 L45.5 31 L48 31 L48 28 L50 28 L50 40 Z" fill={ORO} />
        <rect x="17.5" y="33" width="3" height="4.5" rx="1.5" fill="#4a3808" stroke="none" />
        <rect x="43.5" y="33" width="3" height="4.5" rx="1.5" fill="#4a3808" stroke="none" />
        {/* accenni di muratura */}
        <path d="M18 46 H27 M37 46 H46 M18 53 H27 M37 53 H46 M25 24 H39 M25 34 H30 M34 34 H39" fill="none" strokeWidth="0.7" />
      </g>
    </>
  )
}

/* Di rosso, al gambero e alla pastinaca, con sei stelle d'argento */
function Stella({ cx, cy, r = 3 }) {
  const pts = []
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI / 6) * i - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.45
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`)
  }
  return <polygon points={pts.join(' ')} fill={ARGENTO} stroke={ARGENTO_SCURO} strokeWidth="0.4" />
}

function Povegliano() {
  return (
    <>
      <rect x="6" y="6" width="52" height="66" fill={ROSSO} />
      <Stella cx="22" cy="14" /><Stella cx="42" cy="14" />
      <Stella cx="20" cy="52" /><Stella cx="44" cy="52" />
      <Stella cx="26" cy="63" /><Stella cx="38" cy="63" />
      {/* gambero d'oro (chele in alto) */}
      <g fill={ORO} stroke={ORO_SCURO} strokeWidth="0.8">
        <path d="M18 22 Q15 19 16.5 16.5 Q19 18 20.5 20.5 Z" />
        <path d="M28 22 Q31 19 29.5 16.5 Q27 18 25.5 20.5 Z" />
        <path d="M19.5 24 Q18 21 18.5 19.5 L21 22.5 Z" />
        <path d="M26.5 24 Q28 21 27.5 19.5 L25 22.5 Z" />
        <ellipse cx="23" cy="28" rx="4" ry="6" />
        <path d="M20.5 33 Q19 36 20 39 L23 37.5 L26 39 Q27 36 25.5 33 Z" />
        <path d="M20 40 L23 38.5 L26 40 L23 43 Z" />
        <path d="M19 27 L15.5 25 M19 30 L15 30 M27 27 L30.5 25 M27 30 L31 30" fill="none" />
      </g>
      {/* pastinaca al naturale */}
      <g>
        <path d="M41 26 Q37.5 22 38.5 18.5 Q41.5 20.5 41.8 24 Z" fill={VERDE} />
        <path d="M42.5 25.5 Q42 20 44.5 17 Q46 21 44.5 25 Z" fill={VERDE} />
        <path d="M44 26 Q46.5 22 49.5 21.5 Q48.5 25.5 45.5 27 Z" fill={VERDE} />
        <path d="M40.5 26.5 Q39.5 34 41.5 41 Q42.8 46 43.5 48.5 Q44.8 44 45.5 39 Q46.8 32 45.5 26.5 Q43 25 40.5 26.5 Z" fill="#f0e3b2" stroke={ORO_SCURO} strokeWidth="0.8" />
        <path d="M41.5 31 L45.6 30.2 M42 36 L45.2 35.4 M42.7 41 L44.6 40.6" stroke={ORO_SCURO} strokeWidth="0.6" />
      </g>
    </>
  )
}

/* Troncato: braccio su braciere fiammeggiante; cane passante di rosso */
function Mozzecane() {
  return (
    <>
      <rect x="6" y="6" width="52" height="30" fill={AZZURRO} />
      <rect x="6" y="36" width="52" height="36" fill={ARGENTO} />
      <line x1="6" y1="36" x2="58" y2="36" stroke={ARGENTO_SCURO} strokeWidth="0.6" />
      {/* braccio al naturale con pugno, dall'angolo destro */}
      <path d="M58 10 L44 13 Q40 14 38.5 17 L37 20 L41 21.5 L42.5 18.5 Q43.5 16.8 46 16.5 L58 15 Z" fill={CARNAGIONE} stroke="#b98a5e" strokeWidth="0.7" />
      <path d="M36 19 Q34 18.5 33.5 20.5 Q33 22.5 35 23.2 Q34 24.5 35.5 25.5 Q37.5 26.5 39 25 L41 22 L37.5 19.6 Z" fill={CARNAGIONE} stroke="#b98a5e" strokeWidth="0.7" />
      {/* braciere d'oro con fiamme di rosso */}
      <g>
        <path d="M27 28 Q26 26.5 27.5 25 Q27 23 29 22.5 Q29.5 20.5 31.5 21.5 Q32 19 34 20.5 Q36 19.5 36.5 22 Q38.5 22.5 37.8 24.8 Q39.5 26 38 28 Z" fill={ROSSO} />
        <path d="M30 27 Q29.8 24.5 31.5 23.5 Q31.8 25.5 33 26 Q33.5 24 35 24.5 Q35.5 26 34.5 27.5 Z" fill="#f07030" />
        <path d="M25.5 28 L39.5 28 L38 32.5 Q32.5 34.5 27 32.5 Z" fill={ORO} stroke={ORO_SCURO} strokeWidth="0.8" />
        <ellipse cx="32.5" cy="28" rx="7" ry="1.4" fill={ORO} stroke={ORO_SCURO} strokeWidth="0.6" />
      </g>
      {/* cane passante di rosso */}
      <g fill={ROSSO} stroke="#8f1512" strokeWidth="0.6">
        <path d="M20 62 L20.5 54.5 Q18.5 52.5 19 49.5 L16 47.5 Q14.5 46.5 14.5 44.5 L17.5 45.8 Q19 44.5 21 45 L22.5 47.5 Q28 46.5 33.5 47.5 Q38 46 42.5 47.8 Q46 49 46.5 52.5 Q46.8 55 44.5 56.5 L45.5 62 L43 62 L42 57.5 L38 57 L37.5 62 L35 62 L34.5 56.8 Q29 55.8 25.5 56.8 L25 62 L22.5 62 Z" />
        <path d="M45.5 50 Q49 47.5 50 44 Q47 44.8 45.5 47 Z" />
      </g>
    </>
  )
}

/* D'azzurro, alla croce d'argento accantonata da quattro libellule */
function Libellula({ x, y, flip = false }) {
  return (
    <g transform={`translate(${x} ${y})${flip ? ' scale(-1,1)' : ''}`}>
      <ellipse cx="-2.6" cy="-1.4" rx="3" ry="1.1" transform="rotate(-28 -2.6 -1.4)" fill={ARGENTO} stroke={ARGENTO_SCURO} strokeWidth="0.4" />
      <ellipse cx="2.6" cy="-1.4" rx="3" ry="1.1" transform="rotate(28 2.6 -1.4)" fill={ARGENTO} stroke={ARGENTO_SCURO} strokeWidth="0.4" />
      <ellipse cx="-2.2" cy="0.6" rx="2.4" ry="0.9" transform="rotate(-8 -2.2 0.6)" fill={ARGENTO} stroke={ARGENTO_SCURO} strokeWidth="0.4" />
      <ellipse cx="2.2" cy="0.6" rx="2.4" ry="0.9" transform="rotate(8 2.2 0.6)" fill={ARGENTO} stroke={ARGENTO_SCURO} strokeWidth="0.4" />
      <line x1="0" y1="-2.4" x2="0" y2="4.2" stroke="#2a5a94" strokeWidth="1" strokeLinecap="round" />
      <circle cx="0" cy="-2.8" r="1" fill="#2a5a94" />
    </g>
  )
}

function Vigasio() {
  return (
    <>
      <rect x="6" y="6" width="52" height="66" fill={AZZURRO} />
      <path d="M27.5 6 H36.5 V30.5 H58 V39.5 H36.5 V72 H27.5 V39.5 H6 V30.5 H27.5 Z" fill={ARGENTO} stroke={ARGENTO_SCURO} strokeWidth="0.5" />
      <Libellula x="17" y="19" />
      <Libellula x="47" y="19" flip />
      <Libellula x="18" y="52" />
      <Libellula x="46" y="52" flip />
    </>
  )
}

const FIGURE = {
  villafranca: { Comp: Villafranca, nome: 'Villafranca di Verona' },
  povegliano:  { Comp: Povegliano,  nome: 'Povegliano Veronese' },
  mozzecane:   { Comp: Mozzecane,   nome: 'Mozzecane' },
  vigasio:     { Comp: Vigasio,     nome: 'Vigasio' },
}

export default function StemmaComune({ comune, variant = 'pieno', size = 40, className = '' }) {
  const clipId = useId().replace(/[«»:]/g, '')
  const entry = FIGURE[comune]
  if (!entry) return null
  const { Comp, nome } = entry
  return (
    <span
      className={`inline-block flex-shrink-0 ${className}`}
      style={{ width: size, height: Math.round(size * 76 / 64), filter: FILTRI[variant] || 'none' }}
    >
      <Scudo title={`Stemma di ${nome}`} clipId={`fn-scudo-${clipId}`}>
        <Comp />
      </Scudo>
    </span>
  )
}

export { FIGURE as STEMMI_DISPONIBILI }
