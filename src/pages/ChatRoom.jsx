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
        setUsersOnline(prev => [...prev, { user_id: data.user_id, nome: data.nome }])
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

  const myId = user?.user_id

  return (
    <div className="app-shell">
      <AppHeader
        title={slug}
        showBack
        rightSlot={
          <span className="text-[10px] text-oro-dark bg-oro/10 px-2 py-1 rounded-full border border-pietra-border">
            {status}
          </span>
        }
      />

      {usersOnline.length > 0 && (
        <div className="flex-shrink-0 px-4 py-1.5 bg-noce/5 border-b border-pietra-border">
          <p className="text-[10px] text-stone-500">
            {t('chat.online')}: {usersOnline.map(u => u.nome).join(', ')}
          </p>
        </div>
      )}

      <div className="scroll-content px-4 py-3 space-y-2">
        {messages.map((msg, i) => {
          const isMe = msg.user?.id === myId
          return (
            <div key={msg.id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && <UserAvatar name={msg.user?.nome} size="sm" />}
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {!isMe && (
                  <span className="text-[10px] text-stone-500 ml-1">{msg.user?.nome}</span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-noce text-oro rounded-br-sm'
                    : 'bg-white text-stone-700 border border-pietra-border rounded-bl-sm'
                }`}>
                  {msg.testo}
                </div>
                <span className="text-[9px] text-stone-400 mx-1">{timeShort(msg.created_at, i18n.language)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex-shrink-0 border-t border-pietra-border bg-pietra-pale px-3 py-2 flex gap-2 items-center">
        <input
          className="flex-1 text-sm border border-pietra-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-oro-muted"
          placeholder={t('chat.message_ph')}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(e)}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="touch-target bg-noce text-oro rounded-xl px-3 disabled:opacity-40"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>

      <BottomNav />
    </div>
  )
}
