import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { SkeletonCard } from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import api from '../api/client.js'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/events?upcoming=true&per_page=20')
      .then(r => setEvents(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app-shell">
      <AppHeader title="Eventi" showBack={false} />

      <div className="scroll-content px-4 py-4 space-y-3">
        {loading ? (
          [1,2,3].map(i => <SkeletonCard key={i} />)
        ) : events.length === 0 ? (
          <EmptyState message="Nessun evento in programma" />
        ) : (
          events.map(ev => {
            const disponibili = ev.max_partecipanti
              ? ev.max_partecipanti - ev.iscritti
              : null

            return (
              <button
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="stone-card w-full text-left active:scale-[0.98] transition-transform overflow-hidden"
              >
                {/* Fascia data */}
                <div className="bg-noce -mx-3.5 -mt-3.5 mb-3 px-3.5 py-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-oro-muted flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-oro text-xs font-medium">{formatDate(ev.starts_at)}</span>
                </div>

                <h3 className="text-sm font-medium text-stone-800 mb-1">{ev.titolo}</h3>

                {ev.luogo && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {ev.luogo}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">{ev.iscritti} iscritti</span>
                  {disponibili !== null && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      disponibili > 0
                        ? 'bg-muschio/10 text-muschio border-muschio/30'
                        : 'bg-red-50 text-red-500 border-red-200'
                    }`}>
                      {disponibili > 0 ? `${disponibili} posti` : 'Esaurito'}
                    </span>
                  )}
                  {!ev.pubblico && (
                    <span className="text-[10px] bg-oro/10 text-oro-dark px-2 py-0.5 rounded-full border border-pietra-border">
                      Soci
                    </span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      <BottomNav />
    </div>
  )
}
