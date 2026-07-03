import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { loginWithGoogle, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  async function handleGoogle() {
    setError('')
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Accesso non riuscito. Riprova.')
    }
  }

  return (
    <div className="min-h-dvh bg-noce flex flex-col">
      {/* Texture pietra */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
          backgroundSize: '12px 12px',
        }}
      />

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
        {/* Droplet logo */}
        <div className="mb-6 droplet-animate">
          <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
            <path d="M32 4C32 4 6 36 6 52C6 67 18 78 32 78C46 78 58 67 58 52C58 36 32 4 32 4Z"
              fill="#e8c87a" opacity="0.25"/>
            <path d="M32 10C32 10 10 40 10 52C10 64.2 20 74 32 74C44 74 54 64.2 54 52C54 40 32 10 32 10Z"
              fill="#c9a96e" opacity="0.15"/>
            <path d="M32 14C32 14 13 42 13 52.5C13 62.8 21.6 71 32 71"
              stroke="#e8c87a" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="26" cy="46" r="3" fill="#e8c87a" opacity="0.4"/>
          </svg>
        </div>

        <h1 className="font-cinzel text-oro text-3xl font-medium text-center mb-2 tracking-wide">
          Il Fontanin
        </h1>
        <p className="text-oro-dark text-xs uppercase tracking-[3px] text-center mb-2">
          Fine di Mondo APS
        </p>
        <p className="text-stone-400 text-sm text-center max-w-[260px] leading-relaxed mt-3">
          La comunità del fontanin storico — un luogo, una storia, persone vere.
        </p>

        {/* Separatore ornamentale */}
        <div className="flex items-center gap-3 my-8 w-full max-w-[280px]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-noce-light" />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" fill="#c9a96e" opacity="0.5"/>
            <circle cx="8" cy="8" r="1.5" fill="#e8c87a"/>
          </svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-noce-light" />
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full max-w-[280px] bg-pietra-pale border border-pietra-border rounded-2xl py-3.5 px-5 flex items-center gap-3 active:scale-[0.97] transition-transform disabled:opacity-60"
        >
          {/* Google G */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="flex-1 text-center text-sm font-medium text-stone-700">
            {loading ? 'Accesso in corso…' : 'Accedi con Google'}
          </span>
        </button>

        {error && (
          <p className="text-red-400 text-xs text-center mt-4 max-w-[280px]">{error}</p>
        )}

        <p className="text-stone-600 text-[11px] text-center mt-8 max-w-[260px] leading-relaxed">
          Accedendo accetti di far parte della community sperimentale di Fine di Mondo APS
        </p>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-stone-700 text-[10px] uppercase tracking-widest">Fine di Mondo APS · CF 04729370231</p>
      </div>
    </div>
  )
}
