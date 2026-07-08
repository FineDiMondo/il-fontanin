export const initTracking = () => {
  console.log('[Tracking]: Initialized')
}

export const trackEvent = (name, properties = {}) => {
  console.log(`[Event Tracked]: ${name}`, properties)
}

export const trackError = (error, context = {}) => {
  console.error('[Error Tracked]:', error, context)
}
