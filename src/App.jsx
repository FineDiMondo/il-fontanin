import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { WalletProvider } from './context/WalletContext.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Forum from './pages/Forum.jsx'
import ForumCategory from './pages/ForumCategory.jsx'
import ForumThread from './pages/ForumThread.jsx'
import Chat from './pages/Chat.jsx'
import ChatRoom from './pages/ChatRoom.jsx'
import Events from './pages/Events.jsx'
import EventDetail from './pages/EventDetail.jsx'
import Research from './pages/Research.jsx'
import Bar from './pages/Bar.jsx'
import Dona from './pages/Dona.jsx'
import Guida from './pages/Guida.jsx'
import Mappa from './pages/Mappa.jsx'
import NumeriUtili from './pages/NumeriUtili.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  // Attende getRedirectResult prima di mostrare qualsiasi route
  if (loading) return <LoadingSpinner />
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
      <Route path="/forum/:slug" element={<ProtectedRoute><ForumCategory /></ProtectedRoute>} />
      <Route path="/forum/thread/:id" element={<ProtectedRoute><ForumThread /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:slug" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
      <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
      <Route path="/bar" element={<ProtectedRoute><Bar /></ProtectedRoute>} />
      <Route path="/dona" element={<ProtectedRoute><Dona /></ProtectedRoute>} />
      <Route path="/guida" element={<ProtectedRoute><Guida /></ProtectedRoute>} />
      <Route path="/mappa" element={<ProtectedRoute><Mappa /></ProtectedRoute>} />
      <Route path="/numeri-utili" element={<ProtectedRoute><NumeriUtili /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </WalletProvider>
    </AuthProvider>
  )
}
