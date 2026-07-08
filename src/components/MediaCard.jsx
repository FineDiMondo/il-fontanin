import { useAuth } from '../context/AuthContext.jsx'

export default function MediaCard({ media, onDelete }) {
  const { user } = useAuth()
  
  const isOwner = user && (user.id === media.owner_id || user.ruolo === 'admin')
  const formattedDate = media.created_at ? new Date(media.created_at).toLocaleDateString() : 'N/A'
  
  const isImage = media.mime_type?.startsWith('image/')
  const isVideo = media.mime_type?.startsWith('video/')
  const isAudio = media.mime_type?.startsWith('audio/')
  
  // File URL: Use GCS cached URL or direct drive link
  const mediaUrl = media.cache_gcs_url || (media.drive_file_id ? `https://drive.google.com/uc?export=view&id=${media.drive_file_id}` : '')

  return (
    <div className="stone-card flex flex-col justify-between overflow-hidden h-full">
      <div>
        {/* Media Preview */}
        <div className="bg-stone-100 aspect-video rounded-lg overflow-hidden flex items-center justify-center relative mb-2">
          {isImage && mediaUrl ? (
            <img src={mediaUrl} alt={media.name} className="w-full h-full object-cover" onError={(e) => {
              // fallback if Google Drive direct image block occurs
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/600x400?text=Anteprima+Drive';
            }} />
          ) : isVideo && mediaUrl ? (
            <video src={mediaUrl} controls className="w-full h-full object-cover" />
          ) : isAudio && mediaUrl ? (
            <audio src={mediaUrl} controls className="w-full max-w-full px-2" />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-stone-400">
              <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-[10px] text-center line-clamp-1">{media.name}</span>
            </div>
          )}
          
          {/* Visibility badge */}
          <span className={`absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full ${
            media.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {media.visibility}
          </span>
        </div>

        {/* Content */}
        <h4 className="text-xs font-semibold text-stone-800 line-clamp-1">{media.name}</h4>
        {media.description && (
          <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">{media.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
        <span className="text-[9px] text-stone-400 font-mono">{formattedDate}</span>
        
        {isOwner && (
          <button
            onClick={() => onDelete(media.id)}
            className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Elimina
          </button>
        )}
      </div>
    </div>
  )
}
