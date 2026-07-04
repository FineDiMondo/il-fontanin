import { useTranslation } from 'react-i18next'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function AnalisiAcqua() {
  const { t } = useTranslation()

  return (
    <div className="app-shell">
      <AppHeader title={t('acqua.title')} showBack />

      <div className="scroll-content px-4 py-4 space-y-4">
        <p className="text-sm text-stone-400">{t('acqua.intro')}</p>

        <div className="stone-card">
          <EmptyState message={t('acqua.empty_title')} sub={t('acqua.empty_sub')} />
        </div>

        <div className="stone-card p-4">
          <h2 className="font-medium text-oro-dark mb-1.5">{t('acqua.propose_title')}</h2>
          <p className="text-sm text-stone-500 leading-relaxed">{t('acqua.propose_body')}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
