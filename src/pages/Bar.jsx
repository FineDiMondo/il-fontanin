import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ToastContainer, { showToast } from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getBalance, getContributions, contribute } from '../lib/wallet.js'
import { useTranslation } from 'react-i18next'

// Menu tipico di un bar internazionale veronese, prezzi in punti F
// (coerenti con il tasso community: 10 F ~ 1 ora di volontariato)
// catKey rimanda alla chiave di traduzione della categoria (vedi locales/*.json bar.cat_*)
const MENU = [
  { categoria: 'Caffetteria', catKey: 'bar.cat_coffee', voci: [
    { nome: 'Caffè espresso', prezzo: 1 },
    { nome: 'Caffè macchiato', prezzo: 1 },
    { nome: 'Cappuccino', prezzo: 2 },
    { nome: 'Tè caldo', prezzo: 1 },
  ]},
  { categoria: 'Analcolici', catKey: 'bar.cat_soft', voci: [
    { nome: 'Acqua naturale / frizzante', prezzo: 1 },
    { nome: 'Coca-Cola, Fanta, Sprite', prezzo: 2 },
    { nome: 'Succo di frutta', prezzo: 2 },
    { nome: 'Tè freddo', prezzo: 2 },
    { nome: 'Chinotto', prezzo: 2 },
  ]},
  { categoria: 'Birre', catKey: 'bar.cat_beer', voci: [
    { nome: 'Birra piccola 0,2L', prezzo: 3 },
    { nome: 'Birra media 0,4L', prezzo: 5 },
    { nome: 'Birra artigianale', prezzo: 6 },
  ]},
  { categoria: 'Vino e bollicine', catKey: 'bar.cat_wine', voci: [
    { nome: 'Calice vino rosso', prezzo: 4 },
    { nome: 'Calice vino bianco', prezzo: 4 },
    { nome: 'Prosecco', prezzo: 4 },
  ]},
  { categoria: 'Cocktail internazionali', catKey: 'bar.cat_cocktail', voci: [
    { nome: 'Spritz Aperol', prezzo: 5 },
    { nome: 'Gin Tonic', prezzo: 7 },
    { nome: 'Mojito', prezzo: 7 },
    { nome: 'Negroni', prezzo: 7 },
    { nome: 'Moscow Mule', prezzo: 7 },
  ]},
  { categoria: 'Da sgranocchiare', catKey: 'bar.cat_snack', voci: [
    { nome: 'Patatine / noccioline', prezzo: 2 },
    { nome: 'Tramezzino', prezzo: 4 },
  ]},
]

function formatOra(iso, locale) {
  return new Date(iso).toLocaleTimeString(locale || 'it-IT', { hour: '2-digit', minute: '2-digit' })
}
export default function Bar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const userId = user?.id ?? user?.email ?? 'anon'
  const [balance, setBalance] = useState(() => getBalance(userId))
  const [log, setLog] = useState(() => getContributions(userId))

  function handleOrder(voce) {
    try {
      const { balance: nuovoSaldo, entry } = contribute(userId, voce)
      setBalance(nuovoSaldo)
      setLog(l => [entry, ...l].slice(0, 20))
      showToast(t('bar.contributed', { amount: voce.prezzo, item: voce.nome }), 'success')
    } catch (e) {
      showToast(e.message === 'insufficient_funds' ? t('bar.insufficient') : e.message)
    }
  }

  return (
    <div className="app-shell">
      <ToastContainer />
      <AppHeader title={t('bar.title')} showBack />

      <div className="scroll-content pb-6">
        <div className="mx-4 mt-4 mb-2 stone-card flex items-center justify-between">
          <div>
            <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium">{t('bar.balance_of', { name: user?.nome || t('bar.you') })}</p>
            <p className="text-2xl font-medium text-noce mt-0.5">{balance} F</p>
          </div>
          <svg className="w-8 h-8 text-oro flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7v10M9.5 9.5c0-1 .9-1.8 2.5-1.8s2.5.9 2.5 2c0 2.3-5 1.2-5 3.5 0 1.1 1 2 2.5 2s2.5-.7 2.5-1.8" />
          </svg>
        </div>

        <p className="px-4 pt-2 pb-3 text-[11px] text-stone-500">
          {t('bar.intro')}
        </p>
        {MENU.map(sezione => (
          <div key={sezione.categoria} className="mb-4">
            <div className="px-4 mb-1">
              <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium">{t(sezione.catKey)}</p>
              <div className="h-px bg-pietra-border mt-1 mb-2" />
            </div>
            <div className="px-4 space-y-2">
              {sezione.voci.map(voce => (
                <button
                  key={voce.nome}
                  onClick={() => handleOrder(voce)}
                  disabled={balance < voce.prezzo}
                  className="stone-card w-full flex items-center justify-between active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  <span className="text-sm text-stone-700">{voce.nome}</span>
                  <span className="text-sm font-medium text-oro-dark flex-shrink-0 ml-3">{voce.prezzo} F</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {log.length > 0 && (
          <div className="mt-2">
            <div className="px-4 mb-1">
              <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium">{t('bar.recent')}</p>
              <div className="h-px bg-pietra-border mt-1 mb-2" />
            </div>
            <div className="px-4 space-y-1.5 pb-4">
              {log.map(voce => (
                <div key={voce.id} className="flex items-center justify-between text-xs text-stone-500">
                  <span>{voce.nome} <span className="text-stone-400">· {formatOra(voce.data, i18n.language)}</span></span>
                  <span>{voce.prezzo} F</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="px-4 pt-2 pb-4">
          <button
            onClick={() => navigate('/dona')}
            className="w-full border border-pietra-border rounded-xl py-2.5 text-sm text-stone-600"
          >
            {t('bar.support_link')}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
