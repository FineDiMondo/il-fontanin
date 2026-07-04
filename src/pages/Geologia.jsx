import { useTranslation } from 'react-i18next'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'

export default function Geologia() {
  const { t } = useTranslation()
  const sections = t('geologia.sections', { returnObjects: true })

  return (
    <div className="app-shell">
      <AppHeader title={t('geologia.title')} showBack />

      <div className="scroll-content px-4 py-4 space-y-3">
        <p className="text-sm text-stone-400">{t('geologia.intro')}</p>

        {Array.isArray(sections) && sections.map((s, i) => (
          <div key={i} className="stone-card p-4">
            <h2 className="font-medium text-oro-dark mb-1.5">{s.title}</h2>
            <p className="text-sm text-stone-500 leading-relaxed">{s.body}</p>
          </div>
        ))}

        <p className="text-[10px] text-stone-400 leading-relaxed pt-1">
          {t('geologia.disclaimer')}
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
