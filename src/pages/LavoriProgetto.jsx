import { useState, useEffect } from 'react'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import { useTranslation } from 'react-i18next'

export default function LavoriProgetto() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [lavori, setLavori] = useState([])
  const [filtroTipo, setFiltroTipo] = useState(null)
  const [filtroStato, setFiltroStato] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titolo: '',
    descrizione: '',
    tipo: 'scaletta',
    lat: '',
    lng: '',
    note: '',
    video_url: '',
  })

  useEffect(() => {
    loadLavori()
  }, [filtroTipo, filtroStato])

  async function loadLavori() {
    try {
      const params = new URLSearchParams()
      if (filtroTipo) params.append('tipo', filtroTipo)
      if (filtroStato) params.append('stato', filtroStato)
      const res = await api.get(`/lavori/progetti?${params}`)
      setLavori(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.post('/lavori/progetti', form)
      setForm({ titolo: '', descrizione: '', tipo: 'scaletta', lat: '', lng: '', note: '', video_url: '' })
      setShowForm(false)
      loadLavori()
    } catch (e) {
      alert('Errore: ' + e.message)
    }
  }

  const canCreate = user?.ruolo === 'socio' || user?.ruolo === 'admin'

  return (
    <div className="app-shell">
      <AppHeader title="Lavori: Argini & Scalette" showBack={false} />

      <div className="scroll-content px-4 py-4 space-y-3">
        {/* Filtri */}
        <div className="flex gap-2 flex-wrap">
          <select
            className="text-xs px-2 py-1 rounded border border-pietra-border"
            value={filtroTipo || ''}
            onChange={e => setFiltroTipo(e.target.value || null)}
          >
            <option value="">Tutti i tipi</option>
            <option value="scaletta">Scalette</option>
            <option value="argine">Argini</option>
            <option value="piscinetta">Piscinetta</option>
          </select>
          <select
            className="text-xs px-2 py-1 rounded border border-pietra-border"
            value={filtroStato || ''}
            onChange={e => setFiltroStato(e.target.value || null)}
          >
            <option value="">Tutti gli stati</option>
            <option value="pianificato">Pianificato</option>
            <option value="in_corso">In corso</option>
            <option value="completato">Completato</option>
          </select>
        </div>

        {/* Form creazione (soci only) */}
        {canCreate && (
          <>
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-noce text-oro py-2 rounded-lg text-sm font-medium"
            >
              {showForm ? 'Annulla' : '+ Nuovo lavoro'}
            </button>

            {showForm && (
              <form onSubmit={handleCreate} className="stone-card space-y-2">
                <input
                  type="text"
                  placeholder="Titolo"
                  className="w-full text-sm border border-pietra-border rounded px-2 py-1"
                  value={form.titolo}
                  onChange={e => setForm({ ...form, titolo: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Descrizione"
                  className="w-full text-sm border border-pietra-border rounded px-2 py-1"
                  rows={2}
                  value={form.descrizione}
                  onChange={e => setForm({ ...form, descrizione: e.target.value })}
                />
                <select
                  className="w-full text-sm border border-pietra-border rounded px-2 py-1"
                  value={form.tipo}
                  onChange={e => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="scaletta">Scaletta</option>
                  <option value="argine">Argine</option>
                  <option value="piscinetta">Piscinetta</option>
                </select>
                <input
                  type="text"
                  placeholder="Lat (es: 45.123)"
                  className="w-full text-xs border border-pietra-border rounded px-2 py-1"
                  value={form.lat}
                  onChange={e => setForm({ ...form, lat: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Lng (es: 12.456)"
                  className="w-full text-xs border border-pietra-border rounded px-2 py-1"
                  value={form.lng}
                  onChange={e => setForm({ ...form, lng: e.target.value })}
                />
                <input
                  type="url"
                  placeholder="URL video YouTube/TikTok"
                  className="w-full text-xs border border-pietra-border rounded px-2 py-1"
                  value={form.video_url}
                  onChange={e => setForm({ ...form, video_url: e.target.value })}
                />
                <textarea
                  placeholder="Note / attrezzi utilizzati"
                  className="w-full text-xs border border-pietra-border rounded px-2 py-1"
                  rows={2}
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                />
                <button
                  type="submit"
                  className="w-full bg-oro text-noce py-1 rounded text-sm font-medium"
                >
                  Crea
                </button>
              </form>
            )}
          </>
        )}

        {/* Lista lavori */}
        {loading ? (
          <LoadingSpinner />
        ) : lavori.length === 0 ? (
          <p className="text-center text-stone-500 text-sm py-4">Nessun lavoro al momento</p>
        ) : (
          <div className="space-y-2">
            {lavori.map(lavoro => (
              <div key={lavoro.id} className="stone-card">
                <div className="flex items-start gap-2 justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-stone-800">{lavoro.titolo}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{lavoro.descrizione}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] bg-oro/10 text-oro-dark px-1.5 py-0.5 rounded">
                        {lavoro.tipo}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        lavoro.stato === 'completato' ? 'bg-green-100 text-green-700' :
                        lavoro.stato === 'in_corso' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {lavoro.stato}
                      </span>
                    </div>
                    {lavoro.video_url && (
                      <a href={lavoro.video_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-oro mt-1 underline block">
                        🎥 Video
                      </a>
                    )}
                  </div>
                  {lavoro.lat && lavoro.lng && (
                    <div className="text-[10px] text-stone-400 whitespace-nowrap">
                      📍 {lavoro.lat}, {lavoro.lng}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
