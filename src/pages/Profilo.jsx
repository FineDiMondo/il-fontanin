import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import AppHeader from '../components/AppHeader.jsx'
import UserAvatar from '../components/UserAvatar.jsx'
import CompetenzeSection from '../components/CompetenzeSection.jsx'
import { isFeatureEnabled } from '../lib/featureFlags.js'

export default function Profilo() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const competenzeEnabled = isFeatureEnabled('COMPETENZE', user?.id)

  if (!user) return null

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <AppHeader title={t('common.profile', 'Profilo')} showBack={true} />
      
      <main className="flex-1 max-w-screen-xl mx-auto w-full p-4 space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 flex items-start gap-4">
          <UserAvatar name={`${user.nome} ${user.cognome || ''}`} size="lg" />
          <div className="flex-1">
            <h2 className="text-xl font-cinzel text-stone-900 font-semibold">
              {user.nome} {user.cognome}
            </h2>
            <p className="text-stone-500 text-sm mt-1">{user.email}</p>
            <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-oro/10 text-oro-dark border border-oro/20">
              {user.ruolo.toUpperCase()}
            </div>
          </div>
        </section>

        {competenzeEnabled && (
          <CompetenzeSection />
        )}
      </main>
    </div>
  )
}
