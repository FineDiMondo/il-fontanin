import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const tabs = [
  { to: '/', icon: 'M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10', labelKey: 'nav.home', fallback: 'Home' },
  { to: '/forum', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', labelKey: 'nav.forum', fallback: 'Forum' },
  { to: '/catalogo', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', labelKey: 'nav.catalogo', fallback: 'Catalogo' },
  { to: '/events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', labelKey: 'nav.events', fallback: 'Eventi' },
  { to: '/profilo', icon: 'M5.121 17.804A8 8 0 0112 14a8 8 0 016.879 3.804M15 8a3 3 0 11-6 0 3 3 0 016 0z', labelKey: 'nav.profile', fallback: 'Profilo' },
]

export default function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-sp-white border-t border-sp-pietra/20 md:hidden">
      <div className="flex items-center justify-around h-16 max-w-screen-md mx-auto">
        {tabs.map(({ to, icon, labelKey, fallback }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={t(labelKey, fallback)}
            aria-label={t(labelKey, fallback)}
            className={({ isActive }) =>
              `flex-1 h-full flex flex-col items-center justify-center transition-colors border-t-2 ${
                isActive ? 'border-sp-dark text-sp-dark font-sp-bold' : 'border-transparent text-sp-pietra hover:text-sp-dark'
              }`
            }
          >
            {({ isActive }) => (
              <svg
                className={`w-6 h-6 ${isActive ? 'text-sp-dark' : 'text-sp-pietra'}`}
                fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.8}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
