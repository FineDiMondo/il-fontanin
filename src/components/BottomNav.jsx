import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',         icon: 'M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10',  label: 'Home' },
  { to: '/forum',    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Forum' },
  { to: '/chat',     icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', label: 'Chat' },
  { to: '/events',   icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Eventi' },
  { to: '/bar',      icon: 'M5 11h14l-1.3 8.2A2 2 0 0115.72 21H8.28a2 2 0 01-1.98-1.8L5 11zM5 11L4 6h16l-1 5M9 3h6', label: 'Bar' },
  { to: '/research', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', label: 'Ricerca' },
]

export default function BottomNav() {
  return (
    <nav className="bg-noce border-t border-noce-light flex-shrink-0">
      <div className="flex">
        {tabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
                isActive ? 'text-oro' : 'text-stone-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <svg
                  className={`w-5 h-5 ${isActive ? 'text-oro' : 'text-stone-500'}`}
                  fill="none" stroke="currentColor" strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span className={`text-[9px] uppercase tracking-wide font-medium ${isActive ? 'text-oro' : 'text-stone-500'}`}>
                  {label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-oro" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
