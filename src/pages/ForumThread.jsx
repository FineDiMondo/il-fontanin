import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import UserAvatar from '../components/UserAvatar.jsx'
import { SkeletonCard } from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import { showToast } from '../components/Toast.jsx'
import ToastContainer from '../components/Toast.jsx'

function PostCard({ post, threadId }) {
  const [likes, setLikes] = useState(post.likes ?? 0)
  const [liked, setLiked] = useState(false)

  async function handleLike() {
    if (liked) return
    setLikes(l => l + 1)
    setLiked(true)
    try {
      await api.post(`/forum/posts/${post.id}/like`)
    } catch {
      setLikes(l => l - 1)
      setLiked(false)
    }
  }

  return (
    <div className="stone-card">
      <div className="flex items-start gap-2.5 mb-2">
        <UserAvatar name={post.user?.nome} size="sm" avatarUrl={post.user?.avatar_url} />
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-stone-700">{post.user?.nome}</span>
            <span className="text-[10px] text-oro-dark">{timeAgo(post.created_at)}</span>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed mt-1">{post.corpo}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-1 ml-10">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-[11px] transition-colors ${liked ? 'text-red-400' : 'text-stone-400'}`}
        >
          <svg className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likes}
        </button>
      </div>
    </div>
  )
}

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60) return 'ora'
  if (s < 3600) return `${Math.floor(s/60)} min fa`
  if (s < 86400) return `${Math.floor(s/3600)} ore fa`
  return `${Math.floor(s/86400)} giorni fa`
}

export default function ForumThread() {
  const { id } = useParams()
  const { user } = useAuth()
  const [thread, setThread] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.get(`/forum/threads/${id}`),
      api.get(`/forum/threads/${id}/posts`),
    ]).then(([t, p]) => {
      setThread(t.data)
      setPosts(p.data)
    }).catch(() => showToast('Errore nel caricamento'))
    .finally(() => setLoading(false))
  }, [id])

  async function sendReply(e) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      const r = await api.post(`/forum/threads/${id}/posts`, { corpo: reply })
      setPosts(prev => [...prev, r.data])
      setReply('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Errore nell\'invio')
    } finally {
      setSending(false)
    }
  }

  const canReply = user?.ruolo === 'socio' || user?.ruolo === 'admin'

  return (
    <div className="app-shell">
      <ToastContainer />
      <AppHeader title={thread?.titolo || 'Thread'} showBack />

      <div className="scroll-content px-4 py-4 space-y-3 pb-4">
        {loading ? (
          [1,2].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            {/* Post originale */}
            {thread && (
              <div className="stone-card">
                <div className="flex items-start gap-2.5 mb-3">
                  <UserAvatar name={thread.user?.nome} avatarUrl={thread.user?.avatar_url} />
                  <div>
                    <p className="text-sm font-medium text-stone-800">{thread.user?.nome}</p>
                    <p className="text-[11px] text-oro-dark">{timeAgo(thread.created_at)}</p>
                  </div>
                </div>
                <h2 className="text-base font-medium text-stone-800 mb-2">{thread.titolo}</h2>
                <p className="text-sm text-stone-600 leading-relaxed">{thread.corpo}</p>
              </div>
            )}

            {/* Risposte */}
            {posts.map(post => (
              <PostCard key={post.id} post={post} threadId={id} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input risposta */}
      {canReply && !thread?.locked && (
        <form onSubmit={sendReply} className="flex-shrink-0 border-t border-pietra-border bg-pietra-pale px-3 py-2 flex gap-2 items-end">
          <textarea
            className="flex-1 text-sm border border-pietra-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-oro-muted resize-none"
            rows={2}
            placeholder="Scrivi una risposta…"
            value={reply}
            onChange={e => setReply(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="touch-target bg-noce text-oro rounded-xl px-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      )}

      <BottomNav />
    </div>
  )
}
