import { useState } from 'react'
import { useMedia } from '../context/MediaContext.jsx'
import { isFeatureEnabled } from '../lib/featureFlags.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function MediaUploader({ onClose }) {
  const { user } = useAuth()
  const { linkPersonalMedia, uploadCollectiveMedia, uploading } = useMedia()
  const [mode, setMode] = useState('collective') // collective, personal
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('public')
  
  // Collective Upload state
  const [file, setFile] = useState(null)
  
  // Personal Link state
  const [driveId, setDriveId] = useState('')
  const [fileName, setFileName] = useState('')
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [sizeBytes, setSizeBytes] = useState('')

  const handleUpload = async (e) => {
    e.preventDefault()
    try {
      if (mode === 'collective') {
        if (!file) return alert('Seleziona un file')
        await uploadCollectiveMedia(file, { visibility, description })
      } else {
        if (!driveId || !fileName) return alert('ID e nome obbligatori')
        await linkPersonalMedia({
          name: fileName,
          mimeType,
          sizeBytes: parseInt(sizeBytes) || 0,
          driveFileId: driveId,
          visibility,
          description
        })
      }
      onClose()
    } catch (err) {
      alert('Errore caricamento: ' + err.message)
    }
  }

  const personalEnabled = isFeatureEnabled('MEDIA_PERSONAL_PHOTOS', user?.id)
  const collectiveEnabled = isFeatureEnabled('MEDIA_COMMUNITY_LIBRARY', user?.id)

  return (
    <div className="stone-card space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-stone-200">
        <h3 className="text-sm font-semibold text-stone-800">Carica Foto/Video</h3>
        <button onClick={onClose} className="text-xs text-stone-500">Chiudi</button>
      </div>

      <div className="flex gap-2 text-xs">
        {collectiveEnabled && (
          <button
            onClick={() => setMode('collective')}
            className={`flex-1 py-1 rounded border ${mode === 'collective' ? 'bg-muschio text-white border-muschio' : 'border-stone-200'}`}
          >
            Carica su Drive
          </button>
        )}
        {personalEnabled && (
          <button
            onClick={() => setMode('personal')}
            className={`flex-1 py-1 rounded border ${mode === 'personal' ? 'bg-muschio text-white border-muschio' : 'border-stone-200'}`}
          >
            Collega Link Drive
          </button>
        )}
      </div>

      <form onSubmit={handleUpload} className="space-y-2 text-xs">
        {mode === 'collective' ? (
          <div>
            <label className="block mb-1 font-medium">Seleziona File (max 10MB)</label>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={e => setFile(e.target.files[0])}
              className="w-full border border-stone-200 rounded p-1"
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="block mb-1 font-medium">Nome File</label>
              <input
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder="es: foto_lavori.jpg"
                className="w-full border border-stone-200 rounded p-1"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Google Drive File ID</label>
              <input
                type="text"
                value={driveId}
                onChange={e => setDriveId(e.target.value)}
                placeholder="es: 1A2B3C4D..."
                className="w-full border border-stone-200 rounded p-1"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">MIME Type</label>
              <select
                value={mimeType}
                onChange={e => setMimeType(e.target.value)}
                className="w-full border border-stone-200 rounded p-1"
              >
                <option value="image/jpeg">Immagine (JPEG)</option>
                <option value="image/png">Immagine (PNG)</option>
                <option value="video/mp4">Video (MP4)</option>
                <option value="audio/mpeg">Audio (MP3)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Dimensione (bytes)</label>
              <input
                type="number"
                value={sizeBytes}
                onChange={e => setSizeBytes(e.target.value)}
                placeholder="es: 1048576"
                className="w-full border border-stone-200 rounded p-1"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block mb-1 font-medium">Descrizione</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Aggiungi una descrizione..."
            rows={2}
            className="w-full border border-stone-200 rounded p-1"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Visibilità</label>
          <select
            value={visibility}
            onChange={e => setVisibility(e.target.value)}
            className="w-full border border-stone-200 rounded p-1"
          >
            <option value="public">Pubblica (tutti)</option>
            <option value="private">Privata (solo soci)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-oro text-noce py-1.5 rounded font-medium disabled:opacity-60"
        >
          {uploading ? 'Caricamento in corso...' : 'Salva'}
        </button>
      </form>
    </div>
  )
}
