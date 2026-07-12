import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SpartanoCard from '../components/SpartanoCard.jsx'
import ToastContainer from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [threads, setThreads] = useState([])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [eventsRes, threadsRes] = await Promise.allSettled([
          api.get('/events?upcoming=true&per_page=1'),
          api.get('/forum/categories/generale/threads?per_page=3'),
        ])
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data.length > 0) {
          setEvent(eventsRes.value.data[0])
        }
        if (threadsRes.status === 'fulfilled') {
          setThreads(threadsRes.value.data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="app-shell">
      <ToastContainer />
      <AppHeader />

      <div className="scroll-content pb-20">
        <div className="max-w-screen-xl mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">

          {/* 1. Hero Section */}
          <div className="mb-12">
            <h1 className="text-xl font-bold text-sp-dark mb-3">
              {t('home.hero_title', `Ciao ${user?.nome || t('home.visitor', 'volontario')}!`)}
            </h1>
            <p className="text-sp-pietra text-lg mb-8">
              {t('home.hero_subtitle', 'Cosa vuoi fare oggi?')}
            </p>

            {/* 2. CTA Primaria */}
            <button
              onClick={() => navigate('/profilo')}
              className="w-full bg-sp-oro text-sp-white font-semibold py-4 rounded-md text-lg hover:opacity-90 transition-opacity active:opacity-80"
            >
              {t('home.cta_declare', 'Racconta cosa hai fatto')}
            </button>
          </div>

          {/* 3. Quick Links */}
          <div className="mb-12">
            <h2 className="text-sm text-sp-pietra font-semibold uppercase tracking-wider mb-4">
              {t('home.quick_links', 'Link Rapidi')}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SpartanoCard
                variant="interactive"
                onClick={() => navigate('/mappa')}
                title="📍"
                description={t('home.map_label', 'Mappa')}
                className="text-center flex flex-col items-center justify-center min-h-24"
              />
              <SpartanoCard
                variant="interactive"
                onClick={() => navigate('/numeri-utili')}
                title="📞"
                description={t('home.numbers_label', 'Numeri Utili')}
                className="text-center flex flex-col items-center justify-center min-h-24"
              />
              <SpartanoCard
                variant="interactive"
                onClick={() => navigate('/canzoniere')}
                title="🎵"
                description={t('home.canzoniere_label', 'Canzoniere')}
                className="text-center flex flex-col items-center justify-center min-h-24"
              />
              <SpartanoCard
                variant="interactive"
                onClick={() => navigate('/ricettario')}
                title="🍳"
                description={t('home.ricettario_label', 'Ricettario')}
                className="text-center flex flex-col items-center justify-center min-h-24"
              />
            </div>
          </div>

          {/* 4. Prossimo Evento */}
          {event && (
            <div className="mb-12">
              <h2 className="text-sm text-sp-pietra font-semibold uppercase tracking-wider mb-4">
                {t('home.next_event', 'Prossimo Evento')}
              </h2>
              <SpartanoCard
                variant="elevated"
                onClick={() => navigate(`/events/${event.id}`)}
                title={event.titolo}
                description={`${event.starts_at ? new Date(event.starts_at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : ''} ${event.luogo ? `· ${event.luogo}` : ''}`}
              />
            </div>
          )}

          {/* 5. Bacheca - Ultimi Thread */}
          <div>
            <h2 className="text-sm text-sp-pietra font-semibold uppercase tracking-wider mb-4">
              {t('home.latest_posts', 'Ultimi Post')}
            </h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-sp-white border border-sp-pietra/20 rounded-md animate-pulse" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <SpartanoCard description={t('home.empty_posts', 'Nessun post ancora')} />
            ) : (
              <div className="space-y-4">
                {threads.map(thread => (
                  <SpartanoCard
                    key={thread.id}
                    variant="interactive"
                    onClick={() => navigate(`/forum/categoria/generale/thread/${thread.id}`)}
                    title={thread.titolo}
                    description={`${thread.autore || 'Anonimo'} • ${thread.replies_count || 0} risposte`}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  )
}
