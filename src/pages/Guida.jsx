import { useTranslation } from 'react-i18next'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'

export default function Guida() {
  const { t } = useTranslation()
  const sections = t('guide.sections', { returnObjects: true })

  return (
    <div className="app-shell">
      <AppHeader title={t('common.guide')} showBack />
      <div className="scroll-content px-4 py-4 space-y-3">
        <p className="text-sm text-stone-400 mb-2">{t('guide.intro')}</p>
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
