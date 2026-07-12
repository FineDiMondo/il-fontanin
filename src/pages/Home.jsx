import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { user: authUser, logout } = useAuth()
  const user = authUser || { nome: 'daniel', ruolo: 'admin', id: 'mock-123' }
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [stats, setStats] = useState({
    forum: 0,
    events: 0,
    catalogo: 0
  })

  useEffect(() => {
    // Simuliamo un caricamento statistiche o le omettiamo
    setStats({
      forum: 3,
      events: 1,
      catalogo: 128
    })
  }, [])

  const navItems = [
    { title: 'Storia', subtitle: '7 comuni', path: '/storia' },
    { title: 'Mappa', subtitle: 'territorio', path: '/mappa' },
    { title: 'Catalogo', subtitle: `${stats.catalogo} schede`, path: '/catalogo' },
    { title: 'Forum', subtitle: `${stats.forum} nuovi`, path: '/forum' },
    { title: 'Eventi', subtitle: 'sab 11 lug', path: '/events' },
    { title: 'Canzoniere', subtitle: '42 canti', path: '/canzoniere' },
    { title: 'Ricettario', subtitle: '18 ricette', path: '/ricettario' },
    { title: 'Guida', subtitle: '8 lingue', path: '/guida' },
    { title: 'Profilo', subtitle: 'area personale', path: '/profilo' },
    { title: 'Chat', subtitle: 'messaggi', path: '/chat' },
  ]

  const recentItems = [
    { title: "Fontanile di Sant'Andrea", meta: "idrico · C certo" },
    { title: "Corte rurale El Palazzo", meta: "storico · D documentato" },
    { title: "La dama del fosso", meta: "culturale · L leggenda" },
  ]

  const newsItems = [
    { title: "Aperta la nuova sezione geologia", meta: "12 lug · admin" },
    { title: "Completato refactoring design B&W", meta: "11 lug · system" },
    { title: "Manutenzione programmata server", meta: "09 lug · admin" },
  ]

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

      <main className="max-w-[1600px] mx-auto">
        {/* Grid Navigazione */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-b border-white">
          {navItems.map((item, idx) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className="group text-left px-6 py-8 border-r border-b lg:border-b-0 border-white hover:bg-stone-900/50 transition-colors"
            >
              <div className="text-white font-medium text-lg mb-1 group-hover:translate-x-1 transition-transform">
                {item.title}
              </div>
              <div className="text-stone-500 text-sm">
                {item.subtitle}
              </div>
            </button>
          ))}
        </div>

        {/* Sezione Liste Recenti e News */}
        <div className="px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-16 max-w-[1600px]">
          
          {/* Catalogo */}
          <div>
            <div className="text-stone-500 text-sm mb-6">
              catalogo · pubblicate
            </div>
            
            <div className="flex flex-col">
              {recentItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center py-4 border-b border-white hover:bg-stone-900/30 cursor-pointer px-2 -mx-2"
                >
                  <div className="text-white font-medium">{item.title}</div>
                  <div className="text-stone-500 text-sm">{item.meta}</div>
                </div>
              ))}
            </div>
          </div>

          {/* News */}
          <div>
            <div className="text-stone-500 text-sm mb-6">
              news · bacheca comunicazioni
            </div>
            
            <div className="flex flex-col">
              {newsItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center py-4 border-b border-stone-800/60 hover:bg-stone-900/30 cursor-pointer px-2 -mx-2"
                >
                  <div className="text-white font-medium">{item.title}</div>
                  <div className="text-stone-500 text-sm">{item.meta}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
