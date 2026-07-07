import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WalletCard from '../components/WalletCard.jsx'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import FeedCard from '../components/FeedCard.jsx'
import { SkeletonCard } from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import StemmaComune from '../components/StemmaComune.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import { showToast } from '../components/Toast.jsx'
import ToastContainer from '../components/Toast.jsx'
import { useTranslation } from 'react-i18next'

function formatDate(iso, locale) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(locale || 'it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [threads, setThreads] = useState([])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [threadsRes, eventsRes] = await Promise.allSettled([
          api.get('/forum/categories/generale/threads?per_page=10'),
          api.get('/events?upcoming=true&per_page=1'),
        ])
        if (threadsRes.status === 'fulfilled') setThreads(threadsRes.value.data)
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data.length > 0) {
          setEvent(eventsRes.value.data[0])
        }
      } catch {
        showToast(t('home.load_error', 'Errore nel caricamento della bacheca'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="app-shell">
      <ToastContainer />
      {!online && (
        <div className="bg-oro-dark text-white text-xs text-center py-1.5 px-4 flex-shrink-0">
          {t('home.offline')}
        </div>
      )}

      <AppHeader />

      <div className="scroll-content">
        <div className="max-w-screen-xl mx-auto w-full lg:grid lg:grid-cols-3 lg:gap-6 lg:p-6">
          
          {/* Colonna Widget Destra (mostrata SOPRA su mobile) */}
          <div className="space-y-4 lg:space-y-6 lg:col-start-3 lg:col-span-1">
            {/* Portafoglio Algorand (solo per utenti registrati) */}
            {user && (
              <div className="mx-4 mt-4 lg:mx-0 lg:mt-0">
                <WalletCard />
              </div>
            )}

            {/* Banner evento prossimo */}
            {event && (
              <div className="mx-4 lg:mx-0">
                <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium mb-2 hidden lg:block">{t('home.next_event', 'Prossimo Evento')}</p>
                <button
                  className="bg-noce-light rounded-2xl p-4 flex items-center gap-3 w-full active:scale-[0.98] transition-transform"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="bg-oro/20 rounded-xl p-2.5 flex-shrink-0">
                    <svg className="w-5 h-5 text-oro" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-oro text-sm font-medium truncate">{event.titolo}</p>
                    <p className="text-oro-dark text-[11px]">{formatDate(event.starts_at, i18n.language)}{event.luogo ? ` · ${event.luogo}` : ''}</p>
                    {event.iscritti != null && (
                      <p className="text-oro-dark text-[10px] mt-0.5">{event.iscritti} {t('home.attendees')}</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-oro-dark flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Link Rapidi: Mappa e Numeri Utili (Sezioni Principali richieste) */}
            <div className="mx-4 lg:mx-0">
              <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium mb-2 hidden lg:block">{t('home.useful_links', 'Link Rapidi')}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/mappa')}
                  className="stone-card flex flex-col items-center justify-center gap-2 py-4 active:scale-[0.98] transition-transform text-center w-full"
                >
                  <div className="text-oro">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-stone-700">{t('home.map_button', 'Fontanin Map')}</span>
                </button>

                <button
                  onClick={() => navigate('/numeri-utili')}
                  className="stone-card flex flex-col items-center justify-center gap-2 py-4 active:scale-[0.98] transition-transform text-center w-full"
                >
                  <div className="text-oro">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-stone-700">{t('home.numbers_button', 'Useful numbers')}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  onClick={() => navigate('/canzoniere')}
                  className="stone-card flex flex-col items-center justify-center gap-2 py-4 active:scale-[0.98] transition-transform text-center w-full"
                >
                  <div className="text-oro">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-stone-700">Canzoniere</span>
                </button>

                <button
                  onClick={() => navigate('/ricettario')}
                  className="stone-card flex flex-col items-center justify-center gap-2 py-4 active:scale-[0.98] transition-transform text-center w-full"
                >
                  <div className="text-oro">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-stone-700">Ricettario</span>
                </button>
              </div>
            </div>

            {/* Il territorio: stemmi dei tre comuni -> Storia */}
            <div className="mx-4 lg:mx-0">
              <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium mb-2">{t('home.territory', 'Il territorio')}</p>
              <button
                onClick={() => navigate('/storia')}
                className="stone-card w-full flex items-center justify-between gap-3 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <StemmaComune comune="villafranca" variant="pieno" size={28} />
                  <StemmaComune comune="povegliano" variant="pieno" size={28} />
                  <StemmaComune comune="mozzecane" variant="pieno" size={28} />
                  <StemmaComune comune="vigasio" variant="pieno" size={28} />
                </div>
                <div className="text-right min-w-0">
                  <p className="text-xs font-semibold text-stone-700">{t('home.territory_link', 'Storia del territorio')}</p>
                  <p className="text-[10px] text-stone-400">{t('home.territory_sub', 'Villafranca · Povegliano · Mozzecane')}</p>
                </div>
                <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Colonna Bacheca Sinistra (mostrata SOTTO su mobile) */}
          <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 space-y-4">
            {/* Benvenuto */}
            <div className="px-4 pt-4 pb-2 lg:px-0 lg:pt-0">
              {user ? (
                <p className="text-stone-500 text-xs">{t('home.welcome')}, <span className="text-stone-700 font-medium">{user.nome}</span></p>
              ) : (
                <p className="text-stone-500 text-xs">{t('home.welcome')}, <span className="text-stone-700 font-medium">{t('home.visitor', 'Visitatore')}</span></p>
              )}
            </div>

            {/* Bacheca Header */}
            <div className="px-4 mb-1 lg:px-0">
              <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium">{t('home.board')}</p>
              <div className="h-px bg-pietra-border mt-1 mb-3" />
            </div>

            {/* Feed / Caricamento */}
            {loading ? (
              <div className="px-4 space-y-3 lg:px-0">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : threads.length === 0 ? (
              <EmptyState message={t('home.empty_posts')} sub={t('home.empty_posts_sub')} />
            ) : (
              <div className="px-4 space-y-3 pb-6 lg:px-0">
                {threads.map(t => <FeedCard key={t.id} thread={t} />)}
              </div>
            )}
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  )
}
