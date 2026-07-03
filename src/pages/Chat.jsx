import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import api from '../api/client.js'

export default function Chat() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/chat/rooms')
      .then(r => setRooms(r.data))
      .finally(() => setLoading(false))
  }, [])

  const TIPO_LABEL = { pubblica: 'Pubblica', privata: 'Privata', evento: 'Evento' }

  return (
    <div className="app-shell">
      <AppHeader title="Chat" showBack={false} />
      <div className="scroll-content px-4 py-4 space-y-3">
        {loading ? <LoadingSpinner /> : rooms.length === 0 ? (
          <EmptyState message="Nessuna stanza disponibile" />
        ) : (
          rooms.map(room => (
            <button
              key={room.id}
              onClick={() => navigate(`/chat/${room.slug}`)}
              className="stone-card w-full text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="bg-noce rounded-xl p-2.5 flex-shrink-0">
                <svg className="w-5 h-5 text-oro" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800">{room.nome}</p>
                {room.descrizione && <p className="text-xs text-stone-500 truncate">{room.descrizione}</p>}
              </div>
              <span className="text-[10px] text-oro-dark bg-oro/10 px-2 py-0.5 rounded-full border border-pietra-border flex-shrink-0">
                {TIPO_LABEL[room.tipo] || room.tipo}
              </span>
              <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  )
}
