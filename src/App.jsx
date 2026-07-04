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
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/forum/:slug" element={<ForumCategory />} />
      <Route path="/forum/thread/:id" element={<ForumThread />} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:slug" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/research" element={<Research />} />
      <Route path="/bar" element={<Bar />} />
      <Route path="/dona" element={<Dona />} />
      <Route path="/guida" element={<Guida />} />
      <Route path="/mappa" element={<Mappa />} />
      <Route path="/numeri-utili" element={<NumeriUtili />} />
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
