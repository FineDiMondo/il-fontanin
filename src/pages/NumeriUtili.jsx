import { useTranslation } from 'react-i18next'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'

// Numeri e contatti verificati via ricerca web il 2026-07-04. Nomi, indirizzi
// e numeri sono lasciati in italiano (dati reali locali) anche nelle lingue
// tradotte: solo le etichette di categoria e le note sono tradotte.
const EMERGENZE = [
  { nome: 'Numero unico emergenze', tel: '112' },
  { nome: 'Vigili del Fuoco', tel: '115' },
  { nome: 'Guardia Medica (continuità assistenziale)', tel: '116117' },
]

const ENTI = [
  { nome: 'Consorzio di Bonifica Veronese', tel: '045 8569500', noteKey: 'numeri.ente_consorzio' },
  { nome: 'Comune di Villafranca di Verona', tel: '045 6339111' },
  { nome: 'Comune di Povegliano Veronese', tel: '045 6334111' },
  { nome: 'Comune di Mozzecane', tel: '045 6335811' },
]

const RISTORANTE = {
  nome: 'Trattoria Al Canton',
  indirizzo: 'Via Simone Di Canossa, 10 · 37060 Grezzano di Mozzecane (VR)',
  tel: '045 7975070',
}

function telHref(tel) {
  return `tel:+39${tel.replace(/\s+/g, '')}`
}

function Row({ nome, tel, sub }) {
  return (
    <a href={telHref(tel)} className="stone-card flex items-center justify-between active:scale-[0.98] transition-transform">
      <div className="min-w-0">
        <p className="text-sm text-stone-700 truncate">{nome}</p>
        {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
      </div>
      <span className="text-sm font-medium text-oro-dark flex-shrink-0 ml-3">{tel}</span>
    </a>
  )
}

export default function NumeriUtili() {
  const { t } = useTranslation()

  return (
    <div className="app-shell">
      <AppHeader title={t('numeri.title')} showBack />

      <div className="scroll-content px-4 py-4 space-y-5">
        <p className="text-sm text-stone-400">{t('numeri.intro')}</p>

        <div>
          <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium mb-2">{t('numeri.emergenze')}</p>
          <div className="space-y-2">
            {EMERGENZE.map(e => <Row key={e.tel} nome={e.nome} tel={e.tel} />)}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium mb-2">{t('numeri.enti')}</p>
          <div className="space-y-2">
            {ENTI.map(e => <Row key={e.tel} nome={e.nome} tel={e.tel} sub={e.noteKey ? t(e.noteKey) : undefined} />)}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium mb-2">{t('numeri.ristorante')}</p>
          <a href={telHref(RISTORANTE.tel)} className="stone-card flex items-center justify-between active:scale-[0.98] transition-transform">
            <div className="min-w-0">
              <p className="text-sm text-stone-700 font-medium truncate">{RISTORANTE.nome}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{RISTORANTE.indirizzo}</p>
              <p className="text-[10px] text-stone-400 mt-1">{t('numeri.ristorante_note')}</p>
            </div>
            <span className="text-sm font-medium text-oro-dark flex-shrink-0 ml-3">{RISTORANTE.tel}</span>
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
