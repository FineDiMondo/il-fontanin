import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const REGNI_INFO = {
  asgard: { nome: 'Asgard', desc: 'Il regno degli Dèi', bg: 'bg-[#1e3a8a]' },
  vanaheim: { nome: 'Vanaheim', desc: 'Il regno della Natura', bg: 'bg-[#064e3b]' },
  alfheim: { nome: 'Álfheim', desc: 'Luce e Cultura', bg: 'bg-[#0f766e]' },
  midgard: { nome: 'Midgard', desc: 'Il regno degli Uomini', bg: 'bg-[#334155]' },
  jotunheim: { nome: 'Jötunheim', desc: 'Il regno dei Giganti', bg: 'bg-[#1e40af]' },
  svartalfheim: { nome: 'Svartálfheim', desc: 'Nani e Lavoro', bg: 'bg-[#374151]' },
  niflheim: { nome: 'Niflheim', desc: 'Ghiaccio e Acqua', bg: 'bg-[#0369a1]' },
  muspelheim: { nome: 'Muspelheim', desc: 'Il regno del Fuoco', bg: 'bg-[#581c87]' },
  helheim: { nome: 'Helheim', desc: 'Morti e Memoria', bg: 'bg-[#0f172a]' }
}

export default function RegnoDashboard() {
  const { codice } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  const regno = REGNI_INFO[codice]

  if (!regno) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl mb-4">Regno non trovato</h1>
        <button onClick={() => navigate('/')} className="text-stone-400 hover:text-white">
          Torna alla Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 font-sans selection:bg-stone-800">
      <header className={`flex items-center px-6 py-6 border-b border-white ${regno.bg}`}>
        <button onClick={() => navigate('/')} className="mr-4 text-white hover:text-stone-300">
          ←
        </button>
        <div>
          <h1 className="text-white font-semibold text-2xl tracking-tight">
            {regno.nome}
          </h1>
          <p className="text-stone-200 text-sm">
            {regno.desc}
          </p>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        <div className="text-stone-500 mb-8">
          Contenuto del regno in arrivo...
        </div>
      </main>
    </div>
  )
}
