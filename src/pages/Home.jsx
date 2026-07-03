import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import FeedCard from '../components/FeedCard.jsx'
import { SkeletonCard } from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import { showToast } from '../components/Toast.jsx'
import ToastContainer from '../components/Toast.jsx'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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
        showToast('Errore nel caricamento della bacheca')
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
        <div className="bg-amber-600 text-white text-xs text-center py-1.5 px-4 flex-shrink-0">
          Sei offline — alcuni contenuti potrebbero non essere aggiornati
        </div>
      )}

      <AppHeader
        rightSlot={
          <button
            className="touch-target text-oro-dark hover:text-oro transition-colors"
            onClick={logout}
            aria-label="Esci"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        }
      />

      <div className="scroll-content">
        {/* Benvenuto */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-stone-500 text-xs">Benvenuto, <span className="text-stone-700 font-medium">{user?.nome}</span></p>
        </div>

        {/* Banner evento prossimo */}
        {event && (
          <button
            className="mx-4 mb-3 bg-noce-light rounded-2xl p-4 flex items-center gap-3 w-[calc(100%-2rem)] active:scale-[0.98] transition-transform"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <div className="bg-oro/20 rounded-xl p-2.5 flex-shrink-0">
              <svg className="w-5 h-5 text-oro" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left min-w-0">
              <p className="text-oro text-sm font-medium truncate">{event.titolo}</p>
              <p className="text-oro-dark text-[11px]">{formatDate(event.starts_at)}{event.luogo ? ` · ${event.luogo}` : ''}</p>
              {event.iscritti != null && (
                <p className="text-oro-dark text-[10px] mt-0.5">{event.iscritti} iscritti</p>
              )}
            </div>
            <svg className="w-4 h-4 text-oro-dark flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Bacheca */}
        <div className="px-4 mb-1">
          <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium">Bacheca</p>
          <div className="h-px bg-pietra-border mt-1 mb-3" />
        </div>

        {loading ? (
          <div className="px-4 space-y-3">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : threads.length === 0 ? (
          <EmptyState message="Nessun post ancora" sub="Sii il primo a scrivere nel forum" />
        ) : (
          <div className="px-4 space-y-3 pb-6">
            {threads.map(t => <FeedCard key={t.id} thread={t} />)}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
