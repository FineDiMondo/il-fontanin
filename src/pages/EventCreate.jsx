import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import EventForm from '../components/events/EventForm.jsx'
import api from '../api/client.js'
import { useTranslation } from 'react-i18next'

export default function EventCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (payload) => {
    setLoading(true)
    try {
      await api.post('/events', payload)
      // Redirige alla lista eventi (o al dettaglio)
      navigate('/events')
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.detail || "Errore durante il salvataggio")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <AppHeader title={t('events.nuovo_evento', 'Nuovo Evento')} showBack />

      <div className="scroll-content px-4 py-4">
        <p className="text-sm text-stone-500 mb-4">
          Crea un nuovo evento. Il tuo evento sarà salvato in stato <strong>bozza</strong> e non sarà visibile nel calendario pubblico finché un amministratore non lo avrà approvato.
        </p>

        <EventForm onSubmit={handleSubmit} loading={loading} />
      </div>

      <BottomNav />
    </div>
  )
}
