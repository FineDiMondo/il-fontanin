import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
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
import EventCreate from './pages/EventCreate.jsx'
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
import Yggdrasil from './pages/Yggdrasil.jsx';
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

import { useLocation } from 'react-router-dom'

function RedirectLegacy({ toBase, fromBase }) {
  const location = useLocation()
  // Sostituisce l'inizio del pathname con la nuova base
  const newPath = location.pathname.replace(new RegExp(`^${fromBase}`), toBase)
  return <Navigate to={newPath + location.search + location.hash} replace />
}

export function RegnoSectionRouter() {
  const { codice } = useParams()
  
  return (
    <Routes>
      {/* Route di contenuto migrate */}
      <Route path="storia" element={<Storia />} />
      <Route path="research" element={<Research />} />
      <Route path="forum" element={<Forum />} />
      <Route path="forum/:slug" element={<ForumCategory />} />
      <Route path="forum/thread/:id" element={<ForumThread />} />
      <Route path="chat" element={<SocioRoute><Chat /></SocioRoute>} />
      <Route path="chat/:slug" element={<SocioRoute><ChatRoom /></SocioRoute>} />
      <Route path="events" element={<Events />} />
      <Route path="events/nuovo" element={<SocioRoute><EventCreate /></SocioRoute>} />
      <Route path="events/:id" element={<EventDetail />} />
      <Route path="mappa" element={<Mappa />} />
      <Route path="geologia" element={<Geologia />} />
      <Route path="analisi-acqua" element={<AnalisiAcqua />} />
      <Route path="lavori" element={<LavoriProgetto />} />
      <Route path="media" element={<Media />} />
      <Route path="canzoniere" element={<Canzoniere />} />
      <Route path="ricettario" element={<Ricettario />} />
      <Route path="bar" element={<Bar />} />
      <Route path="dona" element={<Dona />} />
      <Route path="guida" element={<Guida />} />
      <Route path="numeri-utili" element={<NumeriUtili />} />
      {import.meta.env.VITE_ENABLE_COMPETENZE_FEATURE === 'true' && (
        <Route path="profilo" element={<SocioRoute><Profilo /></SocioRoute>} />
      )}
      
      {/* Fallback per sezioni inesistenti */}
      <Route path="*" element={<Navigate to={`/regno/${codice}`} replace />} />
    </Routes>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      {/* Redirect storici (Step 5) con preservazione path (P1.2) e regni corretti (P1.1) */}
      <Route path="/storia/*" element={<RedirectLegacy fromBase="/storia" toBase="/regno/helheim/storia" />} />
      <Route path="/research/*" element={<RedirectLegacy fromBase="/research" toBase="/regno/helheim/research" />} />
      <Route path="/forum/*" element={<RedirectLegacy fromBase="/forum" toBase="/regno/midgard/forum" />} />
      <Route path="/chat/*" element={<RedirectLegacy fromBase="/chat" toBase="/regno/midgard/chat" />} />
      <Route path="/events/*" element={<RedirectLegacy fromBase="/events" toBase="/regno/midgard/events" />} />
      <Route path="/mappa/*" element={<RedirectLegacy fromBase="/mappa" toBase="/regno/alfheim/mappa" />} />
      <Route path="/geologia/*" element={<RedirectLegacy fromBase="/geologia" toBase="/regno/vanaheim/geologia" />} />
      <Route path="/analisi-acqua/*" element={<RedirectLegacy fromBase="/analisi-acqua" toBase="/regno/niflheim/analisi-acqua" />} />
      <Route path="/lavori/*" element={<RedirectLegacy fromBase="/lavori" toBase="/regno/jotunheim/lavori" />} />
      <Route path="/canzoniere/*" element={<RedirectLegacy fromBase="/canzoniere" toBase="/regno/alfheim/canzoniere" />} />
      <Route path="/ricettario/*" element={<RedirectLegacy fromBase="/ricettario" toBase="/regno/muspelheim/ricettario" />} />
      <Route path="/bar/*" element={<RedirectLegacy fromBase="/bar" toBase="/regno/muspelheim/bar" />} />
      <Route path="/dona/*" element={<RedirectLegacy fromBase="/dona" toBase="/regno/midgard/dona" />} />
      <Route path="/numeri-utili/*" element={<RedirectLegacy fromBase="/numeri-utili" toBase="/regno/midgard/numeri-utili" />} />
      <Route path="/guida/*" element={<RedirectLegacy fromBase="/guida" toBase="/regno/asgard/guida" />} />
      <Route path="/profilo/*" element={<RedirectLegacy fromBase="/profilo" toBase="/regno/asgard/profilo" />} />

      {/* Pagine root che restano (Home, Login, utility trasversali) */}
      
      {/* Rotte Catalogo Territoriale (P1.1: invariata) */}
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/catalogo/nuovo" element={<SocioRoute><CatalogoNuovo /></SocioRoute>} />
      <Route path="/catalogo/validazione" element={<SocioRoute><CatalogoValidazione /></SocioRoute>} />
      <Route path="/catalogo/scheda/:id" element={<CatalogoDettaglio />} />

      {/* Regni & Yggdrasil */}
      <Route path="/regno/:codice" element={<RegnoDashboard />} />
      <Route path="/regno/:codice/*" element={<RegnoSectionRouter />} />
      <Route path="/yggdrasil" element={<Yggdrasil />} />

      {/* Utilities trasversali invariate (AT §9) */}
      <Route path="/media" element={<Media />} />

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
