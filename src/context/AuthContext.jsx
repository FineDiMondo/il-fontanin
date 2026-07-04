import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase.js'
import api from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fdm_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true) // true finché non controlliamo il redirect
  const [error, setError] = useState(null)

  // Gestisce il reindirizzamento immediato alla CLI se l'utente è già autenticato
  useEffect(() => {
    if (user) {
      const cliPort = sessionStorage.getItem('fdm_cli_port') || new URLSearchParams(window.location.search).get('cli_port')
      if (cliPort) {
        sessionStorage.removeItem('fdm_cli_port')
        if (auth.currentUser) {
          auth.currentUser.getIdToken().then((idToken) => {
            window.location.href = `http://localhost:${cliPort}/?token=${idToken}`
          })
        }
      }
    }
  }, [user])

  // Gestisce il risultato del redirect Google al ritorno sulla pagina
  useEffect(() => {
    // Controlla se c'è una porta CLI nei parametri di query e la memorizza temporaneamente
    const searchParams = new URLSearchParams(window.location.search)
    const qPort = searchParams.get('cli_port')
    if (qPort) {
      sessionStorage.setItem('fdm_cli_port', qPort)
    }

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const idToken = await result.user.getIdToken()
          
          // Se c'è una porta CLI memorizzata, effettua il reindirizzamento loopback
          const cliPort = sessionStorage.getItem('fdm_cli_port')
          if (cliPort) {
            sessionStorage.removeItem('fdm_cli_port')
            window.location.href = `http://localhost:${cliPort}/?token=${idToken}`
            return
          }

          const { data } = await api.post('/auth/google-login', { id_token: idToken })
          localStorage.setItem('fdm_token', data.access_token)
          localStorage.setItem('fdm_user', JSON.stringify(data))
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

  // Avvia il redirect verso Google (non apre popup)
  async function loginWithGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signInWithRedirect(auth, googleProvider)
      // La pagina verrà reindirizzata — il codice sotto non viene mai eseguito
    } catch (err) {
      console.error('[Auth] signInWithRedirect error:', err.code, err.message)
      setError(err.code || err.message)
      setLoading(false)
      throw err
    }
  }

  async function logout() {
    await firebaseSignOut(auth)
    localStorage.removeItem('fdm_token')
    localStorage.removeItem('fdm_user')
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
