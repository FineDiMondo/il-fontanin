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
import Storia from './pages/Storia.jsx'
import Geologia from './pages/Geologia.jsx'
import AnalisiAcqua from './pages/AnalisiAcqua.jsx'
import LavoriProgetto from './pages/LavoriProgetto.jsx'
import Media from './pages/Media.jsx'
import Canzoniere from './pages/Canzoniere.jsx'
import Ricettario from './pages/Ricettario.jsx'
import Catalogo from './pages/Catalogo';
import CatalogoNuovo from './pages/CatalogoNuovo';
import CatalogoDettaglio from './pages/CatalogoDettaglio';
import CatalogoValidazione from './pages/CatalogoValidazione';
import Profilo from './pages/Profilo.jsx';
import RegnoDashboard from './pages/RegnoDashboard.jsx';
import { MediaProvider } from './context/MediaContext.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function SocioRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.ruolo !== 'socio' && user.ruolo !== 'admin') {
    return <Navigate to="/" replace />
  }
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
      <Route path="/chat" element={<SocioRoute><Chat /></SocioRoute>} />
      <Route path="/chat/:slug" element={<SocioRoute><ChatRoom /></SocioRoute>} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/research" element={<Research />} />
      <Route path="/bar" element={<Bar />} />
      <Route path="/dona" element={<Dona />} />
      <Route path="/guida" element={<Guida />} />
      <Route path="/mappa" element={<Mappa />} />
      <Route path="/numeri-utili" element={<NumeriUtili />} />
      <Route path="/storia" element={<Storia />} />
      <Route path="/geologia" element={<Geologia />} />
      <Route path="/analisi-acqua" element={<AnalisiAcqua />} />
      <Route path="/lavori" element={<LavoriProgetto />} />
      <Route path="/media" element={<Media />} />
      <Route path="/canzoniere" element={<Canzoniere />} />
      <Route path="/ricettario" element={<Ricettario />} />
      
      {/* Rotte Catalogo Territoriale */}
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/catalogo/nuovo" element={<SocioRoute><CatalogoNuovo /></SocioRoute>} />
      <Route path="/catalogo/validazione" element={<SocioRoute><CatalogoValidazione /></SocioRoute>} />
      <Route path="/catalogo/scheda/:id" element={<CatalogoDettaglio />} />

      {/* Regni & Yggdrasil */}
      <Route path="/regno/:codice" element={<RegnoDashboard />} />
      <Route path="/yggdrasil" element={<div className="text-white p-6">Yggdrasil - In arrivo</div>} />

      {import.meta.env.VITE_ENABLE_COMPETENZE_FEATURE === 'true' && (
        <Route path="/profilo" element={<SocioRoute><Profilo /></SocioRoute>} />
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <MediaProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </MediaProvider>
      </WalletProvider>
    </AuthProvider>
  )
}
