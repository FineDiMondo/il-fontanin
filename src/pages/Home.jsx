import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTranslation } from 'react-i18next'

const REGNI = [
  { codice: 'asgard', nome: 'Asgard', subtitle: 'Il regno degli Dèi', bg: 'bg-[#1e3a8a]' },
  { codice: 'vanaheim', nome: 'Vanaheim', subtitle: 'Il regno della Natura', bg: 'bg-[#064e3b]' },
  { codice: 'alfheim', nome: 'Álfheim', subtitle: 'Luce e Cultura', bg: 'bg-[#0f766e]' },
  { codice: 'midgard', nome: 'Midgard', subtitle: 'Il regno degli Uomini', bg: 'bg-[#334155]' },
  { codice: 'jotunheim', nome: 'Jötunheim', subtitle: 'Il regno dei Giganti', bg: 'bg-[#1e40af]' },
  { codice: 'svartalfheim', nome: 'Svartálfheim', subtitle: 'Nani e Lavoro', bg: 'bg-[#374151]' },
  { codice: 'niflheim', nome: 'Niflheim', subtitle: 'Ghiaccio e Acqua', bg: 'bg-[#0369a1]' },
  { codice: 'muspelheim', nome: 'Muspelheim', subtitle: 'Il regno del Fuoco', bg: 'bg-[#581c87]' },
  { codice: 'helheim', nome: 'Helheim', subtitle: 'Morti e Memoria', bg: 'bg-[#0f172a]' }
]

export default function Home() {
  const { user: authUser, logout } = useAuth()
  const user = authUser || { nome: 'daniel', ruolo: 'admin', id: 'mock-123' }
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 font-sans selection:bg-stone-800">
      
      {/* Header Spartano */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-white relative">
        <div className="text-white font-semibold text-lg tracking-tight">
          Il Fontanin
        </div>
        
        {/* Lingua (Centro) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-white">
          <button onClick={() => i18n.changeLanguage('it')} className={`uppercase ${i18n.language === 'it' ? 'font-bold text-white' : 'text-stone-400 hover:text-white'}`}>IT</button>
          <span className="text-stone-600">/</span>
          <button onClick={() => i18n.changeLanguage('en')} className={`uppercase ${i18n.language === 'en' ? 'font-bold text-white' : 'text-stone-400 hover:text-white'}`}>EN</button>
        </div>

        {/* Auth (Destra) */}
        <div className="flex items-center gap-4 text-sm text-white">
          {authUser ? (
            <>
              <span className="font-medium">{user.nome}</span>
              <button onClick={logout} className="text-stone-400 hover:text-white">esci</button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="font-medium text-white hover:text-stone-300">accedi</button>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-0">
        {/* 9 Regni Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {REGNI.map((regno, idx) => (
            <button
              key={regno.codice}
              onClick={() => navigate(`/regno/${regno.codice}`)}
              className={`group text-left px-6 py-12 border-r border-b border-white ${regno.bg} hover:brightness-110 transition-all flex flex-col justify-center items-center min-h-[160px] md:min-h-[220px]`}
            >
              <div className="text-white font-semibold text-2xl mb-2 group-hover:scale-105 transition-transform text-center">
                {regno.nome}
              </div>
              <div className="text-white/80 text-sm text-center font-medium">
                {regno.subtitle}
              </div>
            </button>
          ))}
        </div>

        {/* Yggdrasil Accesso */}
        <div className="mt-8 px-6 flex justify-center pb-12">
          <button
            onClick={() => navigate('/yggdrasil')}
            className="w-full md:w-1/3 py-6 border border-white bg-transparent hover:bg-stone-900 transition-colors text-white text-lg font-medium tracking-wide flex flex-col items-center justify-center"
          >
            <span className="mb-1 uppercase tracking-widest text-sm text-stone-400">Esplora l'albero del mondo</span>
            Yggdrasil
          </button>
        </div>

      </main>
    </div>
  )
}
