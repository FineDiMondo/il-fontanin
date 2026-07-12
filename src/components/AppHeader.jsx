import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import UserAvatar from './UserAvatar.jsx'
import LanguageSelector from './LanguageSelector.jsx'
import { isFeatureEnabled } from '../lib/featureFlags.js'

export default function AppHeader({ title, showBack = false, rightSlot }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const competenzeEnabled = isFeatureEnabled('COMPETENZE', user?.id)

  const headerRight = rightSlot || (
    <div className="flex items-center gap-2">
      {user ? (
        <div className="flex items-center gap-2">
          {competenzeEnabled ? (
            <Link to="/profilo" className="touch-target transition-transform active:scale-95" aria-label={t('common.profile', 'Profilo')}>
              <UserAvatar name={`${user.nome} ${user.cognome || ''}`} size="sm" />
            </Link>
          ) : (
            <UserAvatar name={`${user.nome} ${user.cognome || ''}`} size="sm" />
          )}
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
    <header className="bg-sp-white border-b border-sp-pietra/20 sticky top-0 z-40 flex-shrink-0">
      <div className="flex items-center justify-between gap-4 max-w-screen-xl mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="touch-target text-sp-pietra hover:text-sp-oro transition-colors"
            aria-label={t('common.back')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {!showBack && (
          <div className="w-8 h-8 rounded-sp-md bg-sp-oro flex items-center justify-center flex-shrink-0">
            <span className="text-sp-white font-sp-bold text-sp-font-size-sm">F</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {showBack ? (
            <h1 className="text-sp-dark font-sp-semibold text-sp-font-size-base truncate">{title}</h1>
          ) : (
            <>
              <h1 className="hidden sm:block text-sp-dark font-sp-semibold text-sp-font-size-lg leading-tight">
                {t('app.name', 'Il Fontanin')}
              </h1>
              <p className="hidden md:block text-sp-pietra text-sp-font-size-xs uppercase tracking-wider">
                {t('app.org', 'Fine di Mondo APS')}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {headerRight}
          {!showBack && (
            <Link
              to="/guida"
              className="touch-target text-sp-pietra hover:text-sp-oro transition-colors"
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
