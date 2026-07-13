import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client.js'
import { useTranslation } from 'react-i18next'

export default function EventForm({ initialData, onSubmit, loading }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    titolo: initialData?.titolo || '',
    descrizione: initialData?.descrizione || '',
    luogo: initialData?.luogo || '',
    luogo_online: initialData?.luogo_online || '',
    starts_at: initialData?.starts_at ? new Date(initialData.starts_at).toISOString().slice(0,16) : '',
    ends_at: initialData?.ends_at ? new Date(initialData.ends_at).toISOString().slice(0,16) : '',
    max_partecipanti: initialData?.max_partecipanti || '',
    pubblico: initialData?.pubblico ?? true,
    schede_ids: initialData?.schede_ids || [],
  })

  const [schedeOptions, setSchedeOptions] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    // Carica le schede del catalogo per il selettore
    api.get('/catalogo/schede?stato=pubblicato')
      .then(r => setSchedeOptions(r.data))
      .catch(e => console.error("Errore caricamento schede:", e))
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSchedaToggle = (schedaId) => {
    setFormData(prev => {
      const isSelected = prev.schede_ids.includes(schedaId)
      if (isSelected) {
        return { ...prev, schede_ids: prev.schede_ids.filter(id => id !== schedaId) }
      } else {
        return { ...prev, schede_ids: [...prev.schede_ids, schedaId] }
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    
    if (formData.schede_ids.length === 0) {
      setError("Devi selezionare almeno una scheda dal catalogo.")
      return
    }
    if (!formData.titolo || !formData.starts_at) {
      setError("Titolo e data di inizio sono obbligatori.")
      return
    }

    const payload = {
      ...formData,
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      max_partecipanti: formData.max_partecipanti ? parseInt(formData.max_partecipanti) : null
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">{t('events.titolo', 'Titolo *')}</label>
        <input 
          type="text" name="titolo" value={formData.titolo} onChange={handleChange} 
          className="w-full px-3 py-2 border border-pietra-border rounded-lg bg-pietra-bg" required 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">{t('events.descrizione', 'Descrizione')}</label>
        <textarea 
          name="descrizione" value={formData.descrizione} onChange={handleChange} rows={3}
          className="w-full px-3 py-2 border border-pietra-border rounded-lg bg-pietra-bg" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">{t('events.luogo', 'Luogo')}</label>
        <input 
          type="text" name="luogo" value={formData.luogo} onChange={handleChange} 
          className="w-full px-3 py-2 border border-pietra-border rounded-lg bg-pietra-bg" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">{t('events.luogo_online', 'Link Online')}</label>
        <input 
          type="url" name="luogo_online" value={formData.luogo_online} onChange={handleChange} 
          className="w-full px-3 py-2 border border-pietra-border rounded-lg bg-pietra-bg" 
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">{t('events.starts_at', 'Inizio *')}</label>
          <input 
            type="datetime-local" name="starts_at" value={formData.starts_at} onChange={handleChange} 
            className="w-full px-3 py-2 border border-pietra-border rounded-lg bg-pietra-bg text-sm" required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">{t('events.ends_at', 'Fine')}</label>
          <input 
            type="datetime-local" name="ends_at" value={formData.ends_at} onChange={handleChange} 
            className="w-full px-3 py-2 border border-pietra-border rounded-lg bg-pietra-bg text-sm" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">{t('events.max_partecipanti', 'Max Partecipanti')}</label>
          <input 
            type="number" name="max_partecipanti" value={formData.max_partecipanti} onChange={handleChange} min="1"
            className="w-full px-3 py-2 border border-pietra-border rounded-lg bg-pietra-bg" 
          />
        </div>
        <div className="flex items-center mt-6">
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700 cursor-pointer">
            <input 
              type="checkbox" name="pubblico" checked={formData.pubblico} onChange={handleChange} 
              className="w-4 h-4 text-muschio rounded border-pietra-border" 
            />
            {t('events.pubblico', 'Evento Pubblico')}
          </label>
        </div>
      </div>

      {/* Selettore Schede (obbligatorio) */}
      <div className="pt-2">
        <label className="block text-sm font-medium text-stone-700 mb-2">
          {t('events.schede_collegate', 'Luoghi / Schede collegate (min 1) *')}
        </label>
        <div className="max-h-48 overflow-y-auto border border-pietra-border rounded-lg bg-pietra-bg p-2 space-y-1">
          {schedeOptions.length === 0 ? (
            <p className="text-sm text-stone-500 p-2">Caricamento schede...</p>
          ) : (
            schedeOptions.map(s => (
              <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-stone-100 rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.schede_ids.includes(s.id)} 
                  onChange={() => handleSchedaToggle(s.id)}
                  className="w-4 h-4 text-muschio rounded border-pietra-border"
                />
                <span className="text-sm text-stone-700 truncate">{s.nome}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 pb-8">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-muschio text-white py-3 rounded-lg font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading ? t('common.loading', 'Salvataggio...') : t('events.salva', 'Salva Evento (Bozza)')}
        </button>
      </div>
    </form>
  )
}
