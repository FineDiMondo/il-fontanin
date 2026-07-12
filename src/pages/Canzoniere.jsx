import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import api from '../api/client.js'
import { transposeText } from '../utils/chordTransposer.js'
import { useAuth } from '../context/AuthContext.jsx'

function BranoViewer({ brano, onBack }) {
  const [delta, setDelta] = useState(0)

  // Renderizza il testo processato
  const renderedText = transposeText(brano.testo_accordi || '', delta)

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex items-center px-4 py-3 bg-[#0a0a0a] border-b border-white sticky top-0 z-10">
        <button onClick={onBack} className="mr-3 text-white p-2 -ml-2 hover:bg-stone-900 transition-colors rounded-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white truncate leading-tight font-serif uppercase tracking-wider">{brano.titolo}</h2>
          <p className="text-xs text-stone-400 uppercase tracking-widest">{brano.autore || 'Tradizionale'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Strumenti */}
        <div className="flex items-center gap-4 mb-6 border border-white p-3 shadow-sm print:hidden bg-transparent">
          <div className="flex items-center">
            <span className="text-xs text-stone-400 mr-2 uppercase tracking-wider font-medium">Tonalità</span>
            <div className="flex items-center border border-white p-1">
              <button 
                onClick={() => setDelta(d => d - 1)}
                className="w-8 h-8 flex items-center justify-center bg-transparent border border-white text-white font-bold hover:bg-white hover:text-black transition-colors"
              >-</button>
              <span className="w-8 text-center text-sm font-medium text-white">{delta > 0 ? `+${delta}` : delta}</span>
              <button 
                onClick={() => setDelta(d => d + 1)}
                className="w-8 h-8 flex items-center justify-center bg-transparent border border-white text-white font-bold hover:bg-white hover:text-black transition-colors"
              >+</button>
            </div>
          </div>
          <button onClick={() => window.print()} className="ml-auto flex items-center text-white text-sm font-medium uppercase tracking-widest border border-white px-3 py-1.5 hover:bg-white hover:text-black transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Stampa
          </button>
        </div>

        {/* Testo con Accordi */}
        <div className="p-4 border border-white print:shadow-none print:border-none print:p-0">
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-stone-300" style={{ tabSize: 4 }}>
            {renderedText.split(/(\[[^\]]+\])/).map((part, i) => {
              if (part.startsWith('[') && part.endsWith(']')) {
                return <strong key={i} className="text-white bg-stone-900 px-0.5 border border-stone-700">{part}</strong>
              }
              return part
            })}
          </pre>
        </div>
      </div>
    </div>
  )
}

function BranoEditor({ onBack, onSaved }) {
  const [formData, setFormData] = useState({
    titolo: '',
    autore: '',
    testo_accordi: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.titolo || formData.titolo.length < 2) {
      setError('Il titolo deve avere almeno 2 caratteri.')
      return
    }
    if (!formData.testo_accordi || formData.testo_accordi.length < 10) {
      setError('Il testo del brano è troppo corto.')
      return
    }
    
    setError('')
    setSaving(true)
    try {
      await api.post('/canzoniere/brani', {
        titolo: formData.titolo,
        autore: formData.autore || 'Tradizionale',
        tipo: 'canto',
        testo_accordi: formData.testo_accordi,
        fonte: 'manuale'
      })
      onSaved()
    } catch (err) {
      console.error(err)
      setError('Errore durante il salvataggio. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex items-center px-4 py-3 bg-[#0a0a0a] border-b border-white sticky top-0 z-10">
        <button onClick={onBack} className="mr-3 text-white p-2 -ml-2 hover:bg-stone-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white uppercase tracking-widest font-serif">Aggiungi Brano</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 border border-red-500 text-red-500 p-3 text-sm font-bold uppercase">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs text-stone-400 uppercase tracking-widest font-bold mb-2">Titolo</label>
            <input 
              type="text" 
              className="w-full bg-transparent border border-white text-white p-3 focus:outline-none focus:ring-1 focus:ring-white"
              value={formData.titolo}
              onChange={e => setFormData({...formData, titolo: e.target.value})}
              placeholder="Es: Il cielo d'Irlanda"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-400 uppercase tracking-widest font-bold mb-2">Autore (Opzionale)</label>
            <input 
              type="text" 
              className="w-full bg-transparent border border-white text-white p-3 focus:outline-none focus:ring-1 focus:ring-white"
              value={formData.autore}
              onChange={e => setFormData({...formData, autore: e.target.value})}
              placeholder="Es: Massimo Bubola"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-400 uppercase tracking-widest font-bold mb-2">Testo e Accordi</label>
            <p className="text-[10px] text-stone-500 mb-2">Usa le parentesi quadre per gli accordi. Es: [Do]Nel mezzo del cam[Sol]min</p>
            <textarea 
              className="w-full bg-transparent border border-white text-white p-3 font-mono text-sm min-h-[300px] focus:outline-none focus:ring-1 focus:ring-white"
              value={formData.testo_accordi}
              onChange={e => setFormData({...formData, testo_accordi: e.target.value})}
              placeholder="Inserisci qui il testo con gli accordi..."
            />
          </div>
          <div className="pt-4 border-t border-stone-800">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full border border-white text-black bg-white uppercase tracking-widest font-bold py-4 hover:bg-transparent hover:text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva Brano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Canzoniere() {
  const [brani, setBrani] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedBrano, setSelectedBrano] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  
  const { user } = useAuth()
  const isSocio = user && (user.ruolo === 'socio' || user.ruolo === 'admin')

  useEffect(() => {
    fetchBrani()
  }, [])

  const fetchBrani = () => {
    setLoading(true)
    api.get('/canzoniere/brani')
      .then(r => {
        setBrani(r.data.items || [])
        setError(false)
      })
      .catch(e => {
        console.error("Errore fetch brani", e)
        setError(true)
      })
      .finally(() => setLoading(false))
  }

  if (selectedBrano) {
    return <BranoViewer brano={selectedBrano} onBack={() => setSelectedBrano(null)} />
  }

  if (isAdding) {
    return <BranoEditor onBack={() => setIsAdding(false)} onSaved={() => {
      setIsAdding(false)
      fetchBrani()
    }} />
  }

  return (
    <div className="app-shell bg-[#0a0a0a]">
      <AppHeader title="Canzoniere" showBack />

      <div className="scroll-content p-4 space-y-4">
        <h1 className="font-serif text-3xl font-bold text-white uppercase tracking-wider mb-6 border-b border-stone-800 pb-4">Canzoniere</h1>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-b-2 border-white rounded-full"></div></div>
        ) : error ? (
          <div className="text-center py-12 text-stone-500 border border-dashed border-stone-600 p-4">
            <h3 className="font-bold text-white uppercase mb-2">Servizio non disponibile</h3>
            <p>Si è verificato un errore durante il caricamento del canzoniere. Riprova più tardi.</p>
          </div>
        ) : brani.length === 0 ? (
          <div className="text-center py-12 text-stone-500 border border-dashed border-stone-600 p-4">
            <h3 className="font-bold text-white uppercase mb-2">Canzoniere vuoto</h3>
            <p>Non ci sono ancora brani nel canzoniere comunitario.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {brani.map(brano => (
              <button 
                key={brano.id}
                onClick={() => setSelectedBrano(brano)}
                className="w-full text-left bg-transparent p-4 border border-stone-600 hover:border-white transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold font-serif text-white text-lg tracking-wider uppercase">{brano.titolo}</h3>
                    <p className="text-xs text-stone-400 mt-1 tracking-widest uppercase">{brano.autore || 'Tradizionale'}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest border border-stone-600 text-stone-400 px-2 py-1">
                    {brano.tipo}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {isSocio && (
          <div className="mt-8 pt-6 border-t border-stone-800">
            <button 
              className="w-full border border-white text-white uppercase font-bold tracking-widest py-4 hover:bg-white hover:text-black transition-colors" 
              onClick={() => setIsAdding(true)}
            >
              + Aggiungi Brano
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
