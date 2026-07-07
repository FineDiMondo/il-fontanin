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
  const renderedText = transposeText(brano.testo_accordi, delta)

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <div className="flex items-center px-4 py-3 bg-white border-b border-pietra-border sticky top-0 z-10">
        <button onClick={onBack} className="mr-3 text-stone-500 p-2 -ml-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-nobile truncate leading-tight">{brano.titolo}</h2>
          <p className="text-xs text-stone-500">{brano.autore || 'Tradizionale'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Strumenti */}
        <div className="flex items-center gap-4 mb-6 bg-white p-3 rounded-xl border border-pietra-border/50 shadow-sm print:hidden">
          <div className="flex items-center">
            <span className="text-xs text-stone-500 mr-2 uppercase tracking-wider font-medium">Tonalità</span>
            <div className="flex items-center bg-stone-100 rounded-lg p-1">
              <button 
                onClick={() => setDelta(d => d - 1)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-stone-600 font-bold"
              >-</button>
              <span className="w-8 text-center text-sm font-medium">{delta > 0 ? `+${delta}` : delta}</span>
              <button 
                onClick={() => setDelta(d => d + 1)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-stone-600 font-bold"
              >+</button>
            </div>
          </div>
          <button onClick={() => window.print()} className="ml-auto flex items-center text-oro-dark text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Stampa
          </button>
        </div>

        {/* Testo con Accordi */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-pietra-border/50 print:shadow-none print:border-none print:p-0">
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-stone-800" style={{ tabSize: 4 }}>
            {/* 
               Un parser vero convertirebbe [C] in <span class="chord">C</span>
               Qui per l'MVP facciamo un replace semplice per colorarli.
            */}
            {renderedText.split(/(\[[^\]]+\])/).map((part, i) => {
              if (part.startsWith('[') && part.endsWith(']')) {
                return <strong key={i} className="text-oro-dark">{part}</strong>
              }
              return part
            })}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function Canzoniere() {
  const [brani, setBrani] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBrano, setSelectedBrano] = useState(null)
  
  const { user } = useAuth()
  const isSocio = user && (user.ruolo === 'socio' || user.ruolo === 'admin')

  useEffect(() => {
    fetchBrani()
  }, [])

  const fetchBrani = () => {
    setLoading(true)
    api.get('/canzoniere/brani')
      .then(r => setBrani(r.data.items || []))
      .catch(e => console.error("Errore fetch brani", e))
      .finally(() => setLoading(false))
  }

  if (selectedBrano) {
    return <BranoViewer brano={selectedBrano} onBack={() => setSelectedBrano(null)} />
  }

  return (
    <div className="app-shell">
      <AppHeader title="Canzoniere" showBack />

      <div className="scroll-content bg-stone-50 p-4">
        {loading ? (
          <LoadingSpinner />
        ) : brani.length === 0 ? (
          <EmptyState 
            title="Canzoniere vuoto" 
            message="Non ci sono ancora brani nel canzoniere comunitario." 
          />
        ) : (
          <div className="space-y-3">
            {brani.map(brano => (
              <button 
                key={brano.id}
                onClick={() => setSelectedBrano(brano)}
                className="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-pietra-border/50 hover:border-oro-light transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-nobile text-[15px]">{brano.titolo}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{brano.autore || 'Tradizionale'}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider bg-stone-100 text-stone-500 px-2 py-1 rounded">
                    {brano.tipo}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {isSocio && (
          <div className="mt-8 text-center">
            {/* MVP: Niente editor complesso, solo un alert per il momento o un tasto disabilitato, l'API c'è, l'UI completa la faremo se serve */}
            <button className="btn-primary" onClick={() => alert("L'editor di inserimento manuale arriverà nella prossima build dell'MVP!")}>
              + Aggiungi Brano
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
