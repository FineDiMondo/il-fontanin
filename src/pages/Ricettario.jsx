import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import api from '../api/client.js'
import { scaleIngredient } from '../utils/recipeScaler.js'
import { useAuth } from '../context/AuthContext.jsx'

function RicettaViewer({ ricetta, onBack }) {
  const [porzioni, setPorzioni] = useState(ricetta.porzioni_base || 4)

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <div className="flex items-center px-4 py-3 bg-white border-b border-pietra-border sticky top-0 z-10">
        <button onClick={onBack} className="mr-3 text-stone-500 p-2 -ml-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-nobile truncate leading-tight">{ricetta.nome}</h2>
          <p className="text-xs text-stone-500">{ricetta.categoria || 'Generale'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Info Box */}
        <div className="flex items-center justify-around bg-white p-4 rounded-xl border border-pietra-border/50 shadow-sm print:shadow-none print:border-stone-300">
          <div className="text-center">
            <span className="block text-xs text-stone-400 uppercase tracking-wider mb-1">Prep</span>
            <strong className="text-nobile">{ricetta.tempo_prep_min || '?'}m</strong>
          </div>
          <div className="w-px h-8 bg-stone-100"></div>
          <div className="text-center">
            <span className="block text-xs text-stone-400 uppercase tracking-wider mb-1">Cottura</span>
            <strong className="text-nobile">{ricetta.tempo_cottura_min || '?'}m</strong>
          </div>
          <div className="w-px h-8 bg-stone-100"></div>
          <div className="text-center">
            <span className="block text-xs text-stone-400 uppercase tracking-wider mb-1">Difficoltà</span>
            <strong className="text-nobile text-sm">{ricetta.difficolta || '-'}</strong>
          </div>
        </div>

        {/* Scaler Porzioni */}
        <div className="flex items-center justify-between bg-white p-3 px-4 rounded-xl border border-pietra-border/50 shadow-sm print:hidden">
          <span className="text-sm font-medium text-stone-600">Porzioni</span>
          <div className="flex items-center bg-stone-100 rounded-lg p-1">
            <button 
              onClick={() => setPorzioni(p => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-stone-600 font-bold"
            >-</button>
            <span className="w-10 text-center text-sm font-medium">{porzioni}</span>
            <button 
              onClick={() => setPorzioni(p => p + 1)}
              className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-stone-600 font-bold"
            >+</button>
          </div>
        </div>

        {/* Ingredienti */}
        <div className="bg-white rounded-xl shadow-sm border border-pietra-border/50 overflow-hidden print:shadow-none print:border-none">
          <div className="bg-stone-100/50 px-4 py-2 border-b border-pietra-border">
            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-500">Ingredienti</h3>
          </div>
          <ul className="divide-y divide-stone-100">
            {(ricetta.ingredienti || []).map((ing, i) => {
              const scaled = scaleIngredient(ing.quantita, ing.unita, ricetta.porzioni_base, porzioni)
              return (
                <li key={i} className="px-4 py-3 flex items-start justify-between">
                  <div>
                    <span className="text-sm font-medium text-stone-800">{ing.nome}</span>
                    {ing.opzionale && <span className="ml-2 text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded">Opz.</span>}
                    {ing.note && <p className="text-xs text-stone-400 mt-0.5">{ing.note}</p>}
                  </div>
                  <div className="text-sm font-medium text-oro-dark whitespace-nowrap ml-4">
                    {scaled.formattato ? `${scaled.formattato} ${ing.unita || ''}` : 'q.b.'}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Procedimento */}
        <div className="bg-white rounded-xl shadow-sm border border-pietra-border/50 overflow-hidden print:shadow-none print:border-none">
          <div className="bg-stone-100/50 px-4 py-2 border-b border-pietra-border">
            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-500">Procedimento</h3>
          </div>
          <div className="p-4 space-y-4">
            {(ricetta.procedimento || []).map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-oro-light/20 text-oro-dark flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-stone-700 leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="h-8"></div>
      </div>
    </div>
  )
}

export default function Ricettario() {
  const [ricette, setRicette] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedRicetta, setSelectedRicetta] = useState(null)
  
  const { user } = useAuth()
  const isSocio = user && (user.ruolo === 'socio' || user.ruolo === 'admin')

  useEffect(() => {
    fetchRicette()
  }, [])

  const fetchRicette = () => {
    setLoading(true)
    api.get('/ricettario/ricette')
      .then(r => {
        setRicette(r.data.items || [])
        setError(false)
      })
      .catch(e => {
        console.error("Errore fetch ricette", e)
        setError(true)
      })
      .finally(() => setLoading(false))
  }

  if (selectedRicetta) {
    return <RicettaViewer ricetta={selectedRicetta} onBack={() => setSelectedRicetta(null)} />
  }

  return (
    <div className="app-shell">
      <AppHeader title="Ricettario" showBack />

      <div className="scroll-content bg-stone-50 p-4">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <EmptyState 
            title="Servizio non disponibile" 
            message="Si è verificato un errore durante il caricamento del ricettario. Riprova più tardi." 
          />
        ) : ricette.length === 0 ? (
          <EmptyState 
            title="Ricettario vuoto" 
            message="Non ci sono ancora ricette inserite." 
          />
        ) : (
          <div className="grid gap-3">
            {ricette.map(ricetta => (
              <button 
                key={ricetta.id}
                onClick={() => setSelectedRicetta(ricetta)}
                className="text-left bg-white p-4 rounded-xl shadow-sm border border-pietra-border/50 hover:border-oro-light transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-nobile text-[15px]">{ricetta.nome}</h3>
                  {ricetta.categoria && (
                    <span className="text-[10px] uppercase tracking-wider bg-stone-100 text-stone-500 px-2 py-1 rounded">
                      {ricetta.categoria}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-stone-400 gap-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {ricetta.tempo_prep_min ? `${ricetta.tempo_prep_min}m` : '-'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {ricetta.porzioni_base} porz.
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {isSocio && (
          <div className="mt-8 text-center">
            {/* MVP: Placeholder per il form */}
            <button className="btn-primary" onClick={() => alert("L'editor ricette strutturato arriverà nella prossima build dell'MVP!")}>
              + Aggiungi Ricetta
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
