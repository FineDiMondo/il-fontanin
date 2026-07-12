import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import UserAvatar from '../components/UserAvatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import { useTranslation } from 'react-i18next'

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://freedomrun-491323.ey.r.appspot.com'
const WS_BASE = BASE.replace('https://', 'wss://').replace('http://', 'ws://')

function timeShort(iso, locale) {
  return new Date(iso).toLocaleTimeString(locale || 'it-IT', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatRoom() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [status, setStatus] = useState(t('chat.connecting'))
  const [usersOnline, setUsersOnline] = useState([])
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    // Carica storico messaggi
    api.get(`/chat/rooms/${slug}/messages?limit=50`).then(r => {
      setMessages(r.data)
      setTimeout(() => bottomRef.current?.scrollIntoView(), 100)
    }).catch(err => {
      console.error("Errore caricamento storico:", err)
      // Se c'è un errore 500 dal backend a causa del missing user relationship,
      // la chat continuerà a funzionare solo per i messaggi in tempo reale.
    })
  }, [slug])

  useEffect(() => {
    const token = localStorage.getItem('fdm_token')
    if (!token) return

    const ws = new WebSocket(`${WS_BASE}/community/chat/ws/${slug}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => setStatus(t('chat.connected'))
    ws.onclose = () => setStatus(t('chat.disconnected'))
    ws.onerror = () => setStatus(t('chat.error'))

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.tipo === 'messaggio') {
        setMessages(prev => [...prev, {
          id: data.id,
          testo: data.testo,
          created_at: data.timestamp,
          user: { id: data.user_id, nome: data.nome },
        }])
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else if (data.tipo === 'stato_iniziale') {
        setUsersOnline(data.utenti_online || [])
      } else if (data.tipo === 'utente_entrato') {
        setUsersOnline(prev => {
          if (!prev.find(u => u.user_id === data.user_id)) {
            return [...prev, { user_id: data.user_id, nome: data.nome }]
          }
          return prev
        })
      } else if (data.tipo === 'utente_uscito') {
        setUsersOnline(prev => prev.filter(u => u.user_id !== data.user_id))
      }
    }

    return () => ws.close()
  }, [slug])

  function send(e) {
    e.preventDefault()
    if (!text.trim() || wsRef.current?.readyState !== 1) return
    wsRef.current.send(JSON.stringify({ tipo: 'messaggio', testo: text.trim() }))
    setText('')
  }

  const myId = user?.user_id || user?.id

  return (
    <div className="app-shell bg-[#0a0a0a]">
      <AppHeader
        title={slug}
        showBack
        rightSlot={
          <span className="text-[9px] text-white uppercase tracking-widest bg-transparent px-2 py-1 border border-stone-600">
            {status}
          </span>
        }
      />

      {usersOnline.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-stone-800">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest">
            {t('chat.online')}: <span className="text-white font-bold">{usersOnline.map(u => u.nome).join(', ')}</span>
          </p>
        </div>
      )}

      <div className="scroll-content px-4 py-4 space-y-4">
        {messages.map((msg, i) => {
          const isMe = msg.user?.id === myId
          return (
            <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="font-bold text-white">{msg.user?.nome || 'Utente'}</span>
                <span className="text-stone-600">{timeShort(msg.created_at, i18n.language)}</span>
              </div>
              <div className={`px-4 py-3 text-sm leading-relaxed max-w-[85%] border ${
                isMe
                  ? 'border-white text-white bg-transparent'
                  : 'border-stone-600 text-stone-300 bg-transparent'
              }`}>
                {msg.testo}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex-shrink-0 border-t border-white bg-[#0a0a0a] px-4 py-3 flex gap-3 items-center">
        <input
          className="flex-1 text-sm border border-stone-600 px-4 py-3 bg-transparent text-white focus:outline-none focus:border-white transition-colors"
          placeholder={t('chat.message_ph')}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(e)}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="border border-white text-black bg-white uppercase font-bold tracking-widest px-6 py-3 hover:bg-transparent hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
        >
          {t('chat.send', 'INVIA')}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}
