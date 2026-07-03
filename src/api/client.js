import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://freedomrun-491323.ey.r.appspot.com'

const api = axios.create({
  baseURL: `${BASE}/community`,
  timeout: 15000,
})

// Aggiungi JWT ad ogni richiesta
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fdm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Gestione errori globale
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fdm_token')
      localStorage.removeItem('fdm_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
