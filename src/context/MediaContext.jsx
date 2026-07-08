import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client.js'
import { useAuth } from './AuthContext.jsx'
import { trackEvent, trackError } from '../lib/eventTracking.js'

const MediaContext = createContext()

export function MediaProvider({ children }) {
  const { user } = useAuth()
  const [mediaList, setMediaList] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const res = await api.get('/media')
      setMediaList(res.data)
      trackEvent('media_list_fetched', { count: res.data.length })
    } catch (err) {
      trackError(err, { action: 'fetch_media' })
    } finally {
      setLoading(false)
    }
  }

  const linkPersonalMedia = async ({ name, mimeType, sizeBytes, driveFileId, visibility, description }) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('mime_type', mimeType)
      formData.append('size_bytes', sizeBytes)
      formData.append('drive_file_id', driveFileId)
      formData.append('visibility', visibility || 'public')
      formData.append('description', description || '')

      const res = await api.post('/media/link-personal', formData)
      trackEvent('media_linked', { name, mimeType, visibility })
      await fetchMedia()
      return res.data
    } catch (err) {
      trackError(err, { action: 'link_personal_media' })
      throw err
    } finally {
      setUploading(false)
    }
  }

  const uploadCollectiveMedia = async (file, { visibility, description }) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('visibility', visibility || 'public')
      formData.append('description', description || '')

      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      trackEvent('media_uploaded', { name: file.name, size: file.size, visibility })
      await fetchMedia()
      return res.data
    } catch (err) {
      trackError(err, { action: 'upload_collective_media' })
      throw err
    } finally {
      setUploading(false)
    }
  }

  const deleteMedia = async (mediaId) => {
    try {
      await api.delete(`/media/${mediaId}`)
      trackEvent('media_deleted', { mediaId })
      await fetchMedia()
    } catch (err) {
      trackError(err, { action: 'delete_media', mediaId })
      throw err
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [user])

  return (
    <MediaContext.Provider value={{
      mediaList,
      loading,
      uploading,
      fetchMedia,
      linkPersonalMedia,
      uploadCollectiveMedia,
      deleteMedia
    }}>
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia() {
  const context = useContext(MediaContext)
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider')
  }
  return context
}
