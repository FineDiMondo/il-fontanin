import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import UserAvatar from './UserAvatar.jsx'

function timeAgo(dateStr, t) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return t('time.now')
  if (diff < 3600) return t('time.min_ago', { count: Math.floor(diff / 60) })
  if (diff < 86400) return t('time.hours_ago', { count: Math.floor(diff / 3600) })
  return t('time.days_ago', { count: Math.floor(diff / 86400) })
}

export default function FeedCard({ thread }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <button
      className="stone-card w-full text-left active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/forum/thread/${thread.id}`)}
    >
      <div className="flex items-start gap-2.5">
        <UserAvatar name={thread.user?.nome} size="sm" avatarUrl={thread.user?.avatar_url} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-stone-700">{thread.user?.nome}</span>
            <span className="text-[10px] text-oro-dark">{timeAgo(thread.created_at, t)}</span>
          </div>
          <h3 className="text-sm font-medium text-stone-800 mt-0.5 leading-snug line-clamp-2">
            {thread.titolo}
          </h3>
          {thread.corpo && (
            <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {thread.corpo}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-pietra flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {thread.replies_count}
            </span>
            <span className="text-[10px] text-pietra flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {thread.views}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
