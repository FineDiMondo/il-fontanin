import { createContext, useContext, useState, useEffect } from 'react'
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider } from '../firebase.js'
import api from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fdm_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  async function loginWithGoogle() {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()

      const { data } = await api.post('/auth/google-login', { id_token: idToken })
      localStorage.setItem('fdm_token', data.access_token)
      localStorage.setItem('fdm_user', JSON.stringify(data))
      setUser(data)
      return data
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await firebaseSignOut(auth)
    localStorage.removeItem('fdm_token')
    localStorage.removeItem('fdm_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
