import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import api from '../api/client.js'
import { useTranslation } from 'react-i18next'

export default function Forum() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    api.get('/forum/categories')
      .then(r => setCategories(r.data))
      .catch(err => {
        console.error("Errore recupero categorie forum:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  const ICONS = {
    generale: 'M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10',
    storia: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    eventi: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    default: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  }

  return (
    <div className="app-shell">
      <AppHeader title={t('forum.title')} showBack={false} />

      <div className="scroll-content px-4 py-6 space-y-4">
        <h1 className="font-serif text-3xl font-bold text-white uppercase tracking-wider mb-6">Forum</h1>
        
        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium border-b border-stone-800 pb-2">{t('forum.categories')}</p>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-b-2 border-white rounded-full"></div></div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-stone-500 stone-card border-dashed">
            {t('forum.empty_categories')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/forum/${cat.slug}`)}
                className="stone-card w-full text-left flex items-center gap-4 hover:border-stone-400 transition-colors"
              >
                <div className="border border-stone-600 rounded-none p-3 flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[cat.slug] || ICONS.default} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-serif font-bold text-white">{cat.nome}</p>
                  {cat.descrizione && (
                    <p className="text-xs text-stone-400 truncate mt-1">{cat.descrizione}</p>
                  )}
                </div>
                {!cat.pubblica && (
                  <span className="text-[9px] border border-stone-600 text-stone-300 px-2 py-0.5 uppercase tracking-widest flex-shrink-0">
                    {t('common.members_only')}
                  </span>
                )}
                <span className="text-white ml-2">&rarr;</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
