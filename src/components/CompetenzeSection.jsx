import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/client.js'
import LoadingSpinner from './LoadingSpinner.jsx'

export default function CompetenzeSection() {
  const { t } = useTranslation()
  const [domini, setDomini] = useState([])
  const [competenze, setCompetenze] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Stampa editor per un dominio
  const [editingDominio, setEditingDominio] = useState(null)
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [dominiRes, compRes] = await Promise.all([
          api.get('/community/competenze/domini'),
          api.get('/community/competenze/me')
        ])
        
        setDomini(dominiRes.data || [])
        setCompetenze(compRes.data || [])
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.detail || err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div className="p-4 flex justify-center"><LoadingSpinner /></div>
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-xl">{error}</div>

  if (editingDominio) {
    return (
      <CompetenzaEditor 
        dominio={editingDominio}
        competenza={competenze.find(c => c.dominio_id === editingDominio.id)}
        onClose={() => setEditingDominio(null)}
        onSaved={(nuovaComp) => {
          setCompetenze(prev => {
            const exists = prev.find(p => p.dominio_id === editingDominio.id)
            if (exists) return prev.map(p => p.dominio_id === editingDominio.id ? nuovaComp : p)
            return [...prev, nuovaComp]
          })
          setEditingDominio(null)
        }}
      />
    )
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
        <h3 className="text-lg font-cinzel font-semibold text-stone-900">
          Competenze e Qualifiche
        </h3>
        <p className="text-sm text-stone-500 mt-1">
          Dichiara le tue competenze per validare i contenuti del catalogo.
        </p>
      </div>
      
      <div className="divide-y divide-stone-100">
        {domini.map(dominio => {
          const comp = competenze.find(c => c.dominio_id === dominio.id)
          const validata = comp?.livello_validato
          return (
            <div key={dominio.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <h4 className="font-medium text-stone-900">{dominio.nome}</h4>
                <p className="text-sm text-stone-500 mt-1">{dominio.descrizione}</p>
                {comp && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700">
                      Dichiarata: {comp.livello_dichiarato}
                    </span>
                    {validata ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Validata: {comp.livello_validato}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        In attesa di validazione
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={() => setEditingDominio(dominio)}
                className="shrink-0 px-4 py-2 bg-white border border-oro/30 text-oro hover:bg-oro/5 rounded-lg text-sm font-medium transition-colors"
              >
                {comp ? 'Modifica' : 'Dichiara'}
              </button>
            </div>
          )
        })}
        
        {domini.length === 0 && (
          <div className="p-8 text-center text-stone-500 text-sm">
            Nessun dominio di competenza attivo al momento.
          </div>
        )}
      </div>
    </section>
  )
}

function CompetenzaEditor({ dominio, competenza, onClose, onSaved }) {
  const [livello, setLivello] = useState(competenza?.livello_dichiarato || 'nessuna')
  const [fonte, setFonte] = useState(competenza?.fonte || '')
  const [risposte, setRisposte] = useState(competenza?.risposte_json || {})
  const [saving, setSaving] = useState(false)

  const livelli = ['nessuna', 'base', 'intermedia', 'esperta']

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        livello_dichiarato: livello,
        fonte,
        risposte_json: risposte
      }
      const { data } = await api.put(`/community/competenze/me/${dominio.id}`, payload)
      onSaved(data)
    } catch (err) {
      alert('Errore: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-cinzel font-semibold text-stone-900">
            {dominio.nome}
          </h3>
          <p className="text-sm text-stone-500 mt-1">Compila il questionario per dichiarare le tue competenze</p>
        </div>
        <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Livello di competenza</label>
          <select 
            value={livello} 
            onChange={e => setLivello(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-oro focus:border-oro outline-none bg-white text-stone-900"
          >
            {livelli.map(l => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Fonte della competenza (titolo di studio, professione, etc.)</label>
          <input 
            type="text" 
            value={fonte} 
            onChange={e => setFonte(e.target.value)}
            placeholder="es. Storico dell'arte, Appassionato..."
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-oro focus:border-oro outline-none text-stone-900"
          />
        </div>

        {dominio.domande_json && dominio.domande_json.length > 0 && (
          <div className="pt-4 border-t border-stone-100">
            <h4 className="font-medium text-stone-900 mb-4">Questionario di valutazione</h4>
            <div className="space-y-4">
              {dominio.domande_json.map(domanda => (
                <div key={domanda.id}>
                  <label className="block text-sm font-medium text-stone-700 mb-1">{domanda.testo}</label>
                  {domanda.tipo === 'testo' && (
                    <textarea 
                      value={risposte[domanda.id] || ''}
                      onChange={e => setRisposte({...risposte, [domanda.id]: e.target.value})}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-oro focus:border-oro outline-none text-stone-900 min-h-[80px]"
                    />
                  )}
                  {domanda.tipo === 'scelta_singola' && (
                    <select 
                      value={risposte[domanda.id] || ''}
                      onChange={e => setRisposte({...risposte, [domanda.id]: e.target.value})}
                      className="w-full sm:max-w-md px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-oro focus:border-oro outline-none bg-white text-stone-900"
                    >
                      <option value="">Seleziona...</option>
                      {domanda.opzioni?.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  )}
                  {/* Si possono aggiungere altri tipi: scelta_multipla, scala */}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-stone-600 font-medium hover:bg-stone-100 rounded-lg transition-colors"
          disabled={saving}
        >
          Annulla
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-oro hover:bg-oro-dark text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvataggio...' : 'Salva Dichiarazione'}
        </button>
      </div>
    </section>
  )
}
