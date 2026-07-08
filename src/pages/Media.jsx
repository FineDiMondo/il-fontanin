import { useState } from 'react'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import MediaCard from '../components/MediaCard.jsx'
import MediaUploader from '../components/MediaUploader.jsx'
import { useMedia } from '../context/MediaContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Media({ embedded = false }) {
  const { user } = useAuth()
  const { mediaList, loading, deleteMedia } = useMedia()
  const [showUpload, setShowUpload] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('all')

  const isSocio = user && (user.ruolo === 'socio' || user.ruolo === 'admin')

  // Filter list
  const filteredMedia = mediaList.filter(item => {
    if (filtroTipo === 'all') return true
    return item.mime_type?.startsWith(filtroTipo + '/')
  })

  const content = (
    <div className={`${embedded ? '' : 'px-4 py-4'} space-y-4`}>
      {/* Upload button for Soci */}
      {isSocio && (
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-stone-500 font-mono">
            {filteredMedia.length} file multimediali trovati
          </p>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-muschio text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-muschio-dark transition-colors"
          >
            {showUpload ? 'Annulla' : '+ Aggiungi Foto/Video'}
          </button>
        </div>
      )}

      {showUpload && isSocio && (
        <MediaUploader onClose={() => setShowUpload(false)} />
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltroTipo('all')}
          className={`text-xs px-2.5 py-1 rounded-full border ${filtroTipo === 'all' ? 'bg-noce text-oro border-noce' : 'border-stone-200 text-stone-600'}`}
        >
          Tutti
        </button>
        <button
          onClick={() => setFiltroTipo('image')}
          className={`text-xs px-2.5 py-1 rounded-full border ${filtroTipo === 'image' ? 'bg-noce text-oro border-noce' : 'border-stone-200 text-stone-600'}`}
        >
          Foto
        </button>
        <button
          onClick={() => setFiltroTipo('video')}
          className={`text-xs px-2.5 py-1 rounded-full border ${filtroTipo === 'video' ? 'bg-noce text-oro border-noce' : 'border-stone-200 text-stone-600'}`}
        >
          Video
        </button>
        <button
          onClick={() => setFiltroTipo('audio')}
          className={`text-xs px-2.5 py-1 rounded-full border ${filtroTipo === 'audio' ? 'bg-noce text-oro border-noce' : 'border-stone-200 text-stone-600'}`}
        >
          Audio
        </button>
      </div>

      {/* Grid list */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-8 text-stone-400 text-sm">
          Nessun file multimediale disponibile.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredMedia.map(item => (
            <MediaCard
              key={item.id}
              media={item}
              onDelete={deleteMedia}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="app-shell">
      <AppHeader title="Galleria Media" showBack={false} />
      <div className="scroll-content">
        {content}
      </div>
      <BottomNav />
    </div>
  )
}
