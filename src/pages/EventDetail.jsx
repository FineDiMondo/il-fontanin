import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import { showToast } from '../components/Toast.jsx'
import ToastContainer from '../components/Toast.jsx'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(r => setEvent(r.data))
      .finally(() => setLoading(false))
  }, [id])

  async function handleRegister() {
    setRegistering(true)
    try {
      const r = await api.post(`/events/${id}/register`)
      showToast(r.data.message, 'success')
      setRegistered(true)
      setEvent(prev => ({ ...prev, iscritti: (prev.iscritti || 0) + 1 }))
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Errore nell\'iscrizione')
    } finally {
      setRegistering(false)
    }
  }

  async function handleQr() {
    try {
      const r = await api.get(`/events/${id}/qr`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      setQr(url)
    } catch {
      showToast('QR non disponibile — iscrizione confermata richiesta')
    }
  }

  const canRegister = user?.ruolo === 'socio' || user?.ruolo === 'admin'

  return (
    <div className="app-shell">
      <ToastContainer />
      <AppHeader title={event?.titolo || 'Evento'} showBack />

      <div className="scroll-content px-4 py-4 space-y-4">
        {loading ? <LoadingSpinner /> : !event ? (
          <p className="text-center text-stone-500 py-8">Evento non trovato</p>
        ) : (
          <>
            {/* Header evento */}
            <div className="stone-card overflow-hidden">
              <div className="bg-noce -mx-3.5 -mt-3.5 mb-4 px-4 py-3">
                <h2 className="text-oro font-medium text-base">{event.titolo}</h2>
              </div>

              {event.descrizione && (
                <p className="text-sm text-stone-600 leading-relaxed mb-4">{event.descrizione}</p>
              )}

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-oro-dark mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-stone-500">Inizio</p>
                    <p className="text-sm text-stone-700">{formatDate(event.starts_at)}</p>
                  </div>
                </div>

                {event.luogo && (
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-oro-dark mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-stone-500">Luogo</p>
                      <p className="text-sm text-stone-700">{event.luogo}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-oro-dark flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-stone-700">{event.iscritti} iscritti
                    {event.max_partecipanti && ` / ${event.max_partecipanti} posti`}
                  </span>
                </div>
              </div>
            </div>

            {/* Azioni */}
            {canRegister && !registered && (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="w-full bg-noce text-oro py-3.5 rounded-2xl font-medium text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {registering ? 'Iscrizione in corso…' : 'Iscriviti a questo evento'}
              </button>
            )}

            {!user && (
              <div className="bg-noce-light rounded-2xl p-4 text-center border border-oro/20">
                <p className="text-oro font-medium text-sm mb-1.5">Vuoi partecipare a questo evento?</p>
                <p className="text-xs text-oro-dark mb-4">L'iscrizione e il check-in con QR code sono riservati ai membri.</p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-oro text-noce py-3 rounded-xl font-semibold text-xs uppercase tracking-wider active:scale-95 transition-transform"
                >
                  Accedi con Google
                </button>
              </div>
            )}

            {registered && (
              <div className="bg-muschio/10 border border-muschio/30 rounded-2xl p-4 text-center">
                <p className="text-muschio font-medium text-sm">Iscrizione confermata!</p>
              </div>
            )}

            {/* QR check-in */}
            {canRegister && (
              <div className="stone-card">
                <p className="text-sm font-medium text-stone-700 mb-2">QR check-in</p>
                <p className="text-xs text-stone-500 mb-3">Mostra questo codice all'ingresso dell'evento</p>
                {qr ? (
                  <img src={qr} alt="QR check-in" className="w-48 h-48 mx-auto" />
                ) : (
                  <button
                    onClick={handleQr}
                    className="w-full border border-pietra-border rounded-xl py-2.5 text-sm text-stone-600 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Mostra QR code
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
