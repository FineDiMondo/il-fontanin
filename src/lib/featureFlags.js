// Feature flags configuration
export const FEATURE_FLAGS = {
  MEDIA_PERSONAL_PHOTOS: {
    name: 'media_personal_photos',
    label: 'Personal Media Upload',
    description: 'Link photos/videos from Google Drive',
    enabled: import.meta.env.VITE_ENABLE_MEDIA_FEATURE === 'true',
    rolloutPercentage: 100 // 0-100, gradual rollout
  },
  MEDIA_COMMUNITY_LIBRARY: {
    name: 'media_community_library',
    label: 'Community Media Library',
    description: 'Upload media to shared Fontanin Drive',
    enabled: import.meta.env.VITE_ENABLE_MEDIA_FEATURE === 'true',
    rolloutPercentage: 100
  },
  COMPETENZE: {
    name: 'ff_competenze',
    label: 'Modulo Competenze',
    description: 'Gestione domini di competenza e questionari validazione',
    enabled: import.meta.env.VITE_ENABLE_COMPETENZE_FEATURE === 'true',
    rolloutPercentage: 100
  }
}

export function isFeatureEnabled(flagName, userId) {
  const flag = FEATURE_FLAGS[flagName]
  if (!flag) return false
  
  if (!flag.enabled) return false
  
  // Gradual rollout: hash user ID to determine if included
  if (flag.rolloutPercentage < 100 && userId) {
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return (hash % 100) < flag.rolloutPercentage
  }
  
  return true
}
