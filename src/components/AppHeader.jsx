import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import UserAvatar from './UserAvatar.jsx'
import LanguageSelector from './LanguageSelector.jsx'

export default function AppHeader({ title, showBack = false, rightSlot }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  const headerRight = rightSlot || (
    <div className="flex items-center gap-2">
      {user ? (
        <div className="flex items-center gap-2">
          <UserAvatar name={`${user.nome} ${user.cognome || ''}`} size="sm" />
          <button
            className="touch-target text-oro-muted hover:text-oro transition-colors"
            onClick={logout}
            aria-label={t('common.logout')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="text-oro border border-oro/30 bg-gradient-to-r from-oro/10 to-oro/20 hover:from-oro/20 hover:to-oro/30 hover:border-oro/50 transition-all text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-[0.96] shadow-sm"
        >
          {t('common.login', 'Accedi')}
        </Link>
      )}
    </div>
  )

  return (
    <header className="bg-noce flex-shrink-0 relative overflow-hidden">
      {/* texture pietra */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
          backgroundSize: '10px 10px',
        }}
      />
      <div className="relative flex items-center px-4 py-3 gap-3 max-w-screen-xl mx-auto w-full">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="touch-target text-oro-muted hover:text-oro transition-colors"
            aria-label={t('common.back')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {!showBack && (
          <div className="droplet-animate">
            <svg width="22" height="28" viewBox="0 0 22 28" fill="none">
              <path d="M11 1C11 1 2 13 2 18C2 22.9 6.1 27 11 27C15.9 27 20 22.9 20 18C20 13 11 1 11 1Z"
                fill="#e8c87a" opacity="0.4"/>
              <path d="M11 4C11 4 4 14 4 18.5C4 22 7.1 25 11 25"
                stroke="#e8c87a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {showBack ? (
            <h1 className="text-oro font-medium text-base truncate">{title}</h1>
          ) : (
            <>
              <h1 className="text-oro font-cinzel font-medium text-lg leading-tight">{t('app.name')}</h1>
              <p className="text-oro-dark text-[10px] uppercase tracking-widest">{t('app.org')}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {headerRight}
          {!showBack && (
            <Link
              to="/guida"
              className="touch-target text-oro-muted hover:text-oro transition-colors"
              aria-label={t('common.guide')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 115 .5c0 1.5-2 1.7-2 3.3M12 17h.01" />
              </svg>
            </Link>
          )}
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
