import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { loginWithGoogle, loading, error: authError } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [error, setError] = useState('')

  useEffect(() => {
    if (authError) {
      setError(authError)
    }
  }, [authError])

  async function handleGoogle() {
    setError('')
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (e) {
      const firebaseCode = e?.code
      const backendDetail = e?.response?.data?.detail
      const msg = firebaseCode
        ? `Errore Firebase: ${firebaseCode}`
        : backendDetail || e?.message || 'Accesso non riuscito. Riprova.'
      console.error('[Login] Auth error:', e?.code, e?.message)
      setError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 font-sans selection:bg-stone-800 flex flex-col">
      
      {/* Header Brutalista */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-white relative z-40">
        <div className="text-white font-semibold text-lg tracking-tight">
          Il Fontanin
        </div>
        
        {/* Lingua (Centro) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-white">
          <button onClick={() => i18n.changeLanguage('it')} className={`uppercase ${i18n.language === 'it' ? 'font-bold text-white' : 'text-stone-400 hover:text-white'}`}>IT</button>
          <span className="text-stone-600">/</span>
          <button onClick={() => i18n.changeLanguage('en')} className={`uppercase ${i18n.language === 'en' ? 'font-bold text-white' : 'text-stone-400 hover:text-white'}`}>EN</button>
        </div>

        {/* Vuoto a destra per bilanciare */}
        <div className="w-16"></div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
        <h1 className="text-white text-3xl font-bold text-center mb-2 tracking-wide uppercase">
          Il Fontanin
        </h1>
        <p className="text-stone-500 text-xs uppercase tracking-[3px] text-center mb-2">
          Fine di Mondo APS
        </p>
        <p className="text-stone-400 text-sm text-center max-w-[260px] leading-relaxed mt-3">
          {t('login.tagline')}
        </p>

        {/* Separatore */}
        <div className="w-16 h-px bg-stone-800 my-8"></div>

        {/* Google button Brutalista */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full max-w-[280px] bg-transparent border border-white py-3.5 px-5 flex items-center gap-3 hover:bg-stone-900/50 active:scale-[0.99] transition-transform disabled:opacity-60"
        >
          {/* Google G in B&W */}
          <svg width="20" height="20" viewBox="0 0 24 24" className="grayscale">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ccc"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#999"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#666"/>
          </svg>
          <span className="flex-1 text-center text-sm font-medium text-white">
            {loading ? t('login.google_loading') : t('login.google_button')}
          </span>
        </button>

        {error && (
          <p className="text-red-400 text-xs text-center mt-4 max-w-[280px]">{error}</p>
        )}

        <p className="text-stone-600 text-[11px] text-center mt-8 max-w-[260px] leading-relaxed">
          {t('login.disclaimer')}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-stone-800/60 mt-auto">
        <p className="text-stone-600 text-[10px] uppercase tracking-widest">{t('login.footer')}</p>
      </div>
    </div>
  )
}
