import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import FeedCard from '../components/FeedCard.jsx'
import { SkeletonCard } from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import { showToast } from '../components/Toast.jsx'
import ToastContainer from '../components/Toast.jsx'

export default function ForumCategory() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ titolo: '', corpo: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/forum/categories/${slug}/threads`)
      .then(r => setThreads(r.data))
      .catch(() => showToast('Errore nel caricamento'))
      .finally(() => setLoading(false))
  }, [slug])

  async function submitThread(e) {
    e.preventDefault()
    if (!form.titolo.trim() || !form.corpo.trim()) return
    setSubmitting(true)
    try {
      const r = await api.post(`/forum/categories/${slug}/threads`, {
        category_id: null,
        titolo: form.titolo,
        corpo: form.corpo,
      })
      setThreads(prev => [r.data, ...prev])
      setShowNew(false)
      setForm({ titolo: '', corpo: '' })
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Errore nella pubblicazione')
    } finally {
      setSubmitting(false)
    }
  }

  const canPost = user?.ruolo === 'socio' || user?.ruolo === 'admin'

  return (
    <div className="app-shell">
      <ToastContainer />
      <AppHeader title={slug.charAt(0).toUpperCase() + slug.slice(1)} showBack />

      <div className="scroll-content">
        {showNew && (
          <form onSubmit={submitThread} className="mx-4 mt-4 stone-card space-y-3">
            <input
              className="w-full text-sm border border-pietra-border rounded-xl px-3 py-2.5 bg-pietra-pale focus:outline-none focus:ring-1 focus:ring-oro-muted"
              placeholder="Titolo del thread…"
              value={form.titolo}
              onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))}
              maxLength={300}
            />
            <textarea
              className="w-full text-sm border border-pietra-border rounded-xl px-3 py-2.5 bg-pietra-pale focus:outline-none focus:ring-1 focus:ring-oro-muted resize-none"
              rows={4}
              placeholder="Scrivi qui…"
              value={form.corpo}
              onChange={e => setForm(f => ({ ...f, corpo: e.target.value }))}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowNew(false)}
                className="flex-1 py-2 text-sm text-stone-500 border border-pietra-border rounded-xl">
                Annulla
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2 text-sm font-medium bg-noce text-oro rounded-xl disabled:opacity-60">
                {submitting ? 'Pubblicando…' : 'Pubblica'}
              </button>
            </div>
          </form>
        )}

        <div className="px-4 pt-4 pb-6 space-y-3">
          {loading ? (
            [1,2,3].map(i => <SkeletonCard key={i} />)
          ) : threads.length === 0 ? (
            <EmptyState message="Nessun thread ancora" sub={canPost ? 'Inizia la conversazione' : ''} />
          ) : (
            threads.map(t => <FeedCard key={t.id} thread={t} />)
          )}
        </div>
      </div>

      {canPost && !showNew && (
        <button
          onClick={() => setShowNew(true)}
          className="absolute bottom-20 right-4 w-12 h-12 bg-noce text-oro rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Nuovo thread"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      <BottomNav />
    </div>
  )
}
