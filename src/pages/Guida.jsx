import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'

export default function Guida() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sections = t('guide.sections', { returnObjects: true })

  return (
    <div className="app-shell">
      <AppHeader title={t('common.guide')} showBack />
      <div className="scroll-content px-4 py-4 space-y-3">
        <p className="text-sm text-stone-400 mb-2">{t('guide.intro')}</p>

        <div className="flex gap-2 mb-1">
          <button
            onClick={() => navigate('/mappa')}
            className="flex-1 stone-card flex flex-col items-center gap-1.5 py-3 active:scale-[0.97] transition-transform"
          >
            <svg className="w-5 h-5 text-oro-dark" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-[11px] text-stone-600 font-medium">{t('mappa.title')}</span>
          </button>
          <button
            onClick={() => navigate('/numeri-utili')}
            className="flex-1 stone-card flex flex-col items-center gap-1.5 py-3 active:scale-[0.97] transition-transform"
          >
            <svg className="w-5 h-5 text-oro-dark" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-[11px] text-stone-600 font-medium">{t('numeri.title')}</span>
          </button>
        </div>

        <div className="flex gap-2 mb-1">
          <button
            onClick={() => navigate('/storia')}
            className="flex-1 stone-card flex flex-col items-center gap-1.5 py-3 active:scale-[0.97] transition-transform"
          >
            <svg className="w-5 h-5 text-oro-dark" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] text-stone-600 font-medium">{t('storia.title')}</span>
          </button>
          <button
            onClick={() => navigate('/geologia')}
            className="flex-1 stone-card flex flex-col items-center gap-1.5 py-3 active:scale-[0.97] transition-transform"
          >
            <svg className="w-5 h-5 text-oro-dark" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v9m0-9L4 7.5m8 4.5l8-4.5" />
            </svg>
            <span className="text-[11px] text-stone-600 font-medium">{t('geologia.title')}</span>
          </button>
          <button
            onClick={() => navigate('/analisi-acqua')}
            className="flex-1 stone-card flex flex-col items-center gap-1.5 py-3 active:scale-[0.97] transition-transform"
          >
            <svg className="w-5 h-5 text-oro-dark" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.32 0L12 2.69z" />
            </svg>
            <span className="text-[11px] text-stone-600 font-medium">{t('acqua.title')}</span>
          </button>
        </div>

        {Array.isArray(sections) && sections.map((s, i) => (
          <div key={i} className="stone-card p-4">
            <h2 className="font-medium text-oro-dark mb-1">{s.title}</h2>
            <p className="text-sm text-stone-300">{s.body}</p>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
