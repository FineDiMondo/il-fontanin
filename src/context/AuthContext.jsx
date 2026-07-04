import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithPopup,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase.js'
import api from '../api/client.js'

const safeSessionStorage = {
  getItem(key) {
    try { return sessionStorage.getItem(key) } catch { return null }
  },
  setItem(key, val) {
    try { sessionStorage.setItem(key, val) } catch {}
  },
  removeItem(key) {
    try { sessionStorage.removeItem(key) } catch {}
  }
}

const safeLocalStorage = {
  getItem(key) {
    try { return localStorage.getItem(key) } catch { return null }
  },
  setItem(key, val) {
    try { localStorage.setItem(key, val) } catch {}
  },
  removeItem(key) {
    try { localStorage.removeItem(key) } catch {}
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = safeLocalStorage.getItem('fdm_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true) // true finché non controlliamo il redirect
  const [error, setError] = useState(null)

  // Gestisce il reindirizzamento immediato alla CLI se l'utente è già autenticato
  useEffect(() => {
    if (user) {
      const cliPort = safeSessionStorage.getItem('fdm_cli_port') || new URLSearchParams(window.location.search).get('cli_port')
      if (cliPort) {
        safeSessionStorage.removeItem('fdm_cli_port')
        if (auth.currentUser) {
          auth.currentUser.getIdToken().then((idToken) => {
            window.location.href = `http://localhost:${cliPort}/?token=${idToken}`
          })
        }
      }
    }
  }, [user])

  // Gestisce il risultato del redirect Google al ritorno sulla pagina (come fallback)
  useEffect(() => {
    // Controlla se c'è una porta CLI nei parametri di query e la memorizza temporaneamente
    const searchParams = new URLSearchParams(window.location.search)
    const qPort = searchParams.get('cli_port')
    if (qPort) {
      safeSessionStorage.setItem('fdm_cli_port', qPort)
    }

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const idToken = await result.user.getIdToken()
          
          // Se c'è una porta CLI memorizzata, effettua il reindirizzamento loopback
          const cliPort = safeSessionStorage.getItem('fdm_cli_port')
          if (cliPort) {
            safeSessionStorage.removeItem('fdm_cli_port')
            window.location.href = `http://localhost:${cliPort}/?token=${idToken}`
            return
          }

          const { data } = await api.post('/auth/google-login', { id_token: idToken })
          safeLocalStorage.setItem('fdm_token', data.access_token)
          safeLocalStorage.setItem('fdm_user', JSON.stringify(data))
          setUser(data)
          setError(null)
        }
      })
      .catch((err) => {
        console.error('[Auth] Redirect result error:', err)
        const errMsg = err.response?.data?.detail || err.code || err.message
        setError(errMsg)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Avvia il login con Google tramite Popup (estremamente robusto contro il blocco dei cookie)
  async function loginWithGoogle() {
    setLoading(true)
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      if (result.user) {
        const idToken = await result.user.getIdToken()
        
        // Se c'è una porta CLI in corso, effettua il reindirizzamento loopback
        const cliPort = safeSessionStorage.getItem('fdm_cli_port') || new URLSearchParams(window.location.search).get('cli_port')
        if (cliPort) {
          safeSessionStorage.removeItem('fdm_cli_port')
          window.location.href = `http://localhost:${cliPort}/?token=${idToken}`
          return
        }

        const { data } = await api.post('/auth/google-login', { id_token: idToken })
        safeLocalStorage.setItem('fdm_token', data.access_token)
        safeLocalStorage.setItem('fdm_user', JSON.stringify(data))
        setUser(data)
        setError(null)
      }
    } catch (err) {
      console.error('[Auth] signInWithPopup error:', err.code, err.message)
      setError(err.code || err.message)
      setLoading(false)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await firebaseSignOut(auth)
    safeLocalStorage.removeItem('fdm_token')
    safeLocalStorage.removeItem('fdm_user')
    setUser(null)
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
