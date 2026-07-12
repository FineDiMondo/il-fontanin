import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'

export default function AppHeader({ title, showBack = false, rightSlot }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-white relative z-40 bg-[#0a0a0a]">
      <div className="flex items-center gap-4 flex-1">
        {showBack ? (
          <>
            <button onClick={() => navigate(-1)} className="text-white hover:text-stone-300 font-medium">
              {'< indietro'}
            </button>
            <div className="text-white font-semibold text-lg tracking-tight truncate">
              {title}
            </div>
          </>
        ) : (
          <div className="text-white font-semibold text-lg tracking-tight">
            {title || 'Il Fontanin'}
          </div>
        )}
      </div>
      
      {/* Lingua (Centro) - Solo se non c'è il back per evitare sovrapposizioni? */}
      {!showBack && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-white">
          <button onClick={() => i18n.changeLanguage('it')} className={`uppercase ${i18n.language === 'it' ? 'font-bold text-white' : 'text-stone-400 hover:text-white'}`}>IT</button>
          <span className="text-stone-600">/</span>
          <button onClick={() => i18n.changeLanguage('en')} className={`uppercase ${i18n.language === 'en' ? 'font-bold text-white' : 'text-stone-400 hover:text-white'}`}>EN</button>
        </div>
      )}

      {/* Auth / Right */}
      <div className="flex items-center gap-4 text-sm text-white justify-end flex-1">
        {rightSlot ? (
          rightSlot
        ) : (
          user ? (
            <>
              <span className="font-medium hidden sm:block">{user.nome}</span>
              <button onClick={logout} className="text-stone-400 hover:text-white">esci</button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="font-medium text-white hover:text-stone-300">accedi</button>
          )
        )}
      </div>
    </header>
  )
}
