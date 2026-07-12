import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, LayersControl, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useTranslation } from 'react-i18next'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import StemmaComune from '../components/StemmaComune.jsx'

// Fix icone default Leaflet rotte da Vite (i path relativi del CSS non
// vengono risolti dal bundler): reimpostiamo le immagini importate come asset.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// ---------------------------------------------------------------------------
// Dati geografici (bozza 2026-07-04, coordinate approssimative)
// Fonti: pagina Wikipedia bozza Sorgiva_Fontanin (disco D), ricerca web per
// Villa Canossa (geoview.info, 45°18'49.63"N 10°51'45.94"E) e Wikipedia
// Mozzecane. Il Fosso Nuovo nasce dal Fontanin e scorre prima a est poi a
// sud verso la campagna di Grezzano (fonte: descrizione.htm digilander).
// I confini di boschetto/villa e aree demaniali sono TRACCIATI A MANO come
// bozza indicativa: vanno verificati e corretti sul campo o su catasto.
// ---------------------------------------------------------------------------

const FONTANIN = [45.34004, 10.86285]
const VILLA_CANOSSA = [45.31379, 10.86276]

// Percorso indicativo del Fosso Nuovo: dal Fontanin verso est, poi a sud
// fino all'area di Villa Canossa a Grezzano di Mozzecane.
const FOSSO_NUOVO_PATH = [
  FONTANIN,
  [45.33500, 10.87000],
  [45.32200, 10.86800],
  VILLA_CANOSSA,
]

// Corridoio indicativo delle rive/aree di manutenzione (demanio, gestito dal
// Consorzio di Bonifica) lungo il Fosso Nuovo — bozza, non un rilievo reale.
const AREA_DEMANIO_CONSORZIO = [
  [45.34004, 10.86235], [45.33500, 10.86950], [45.32200, 10.86750], [45.31379, 10.86226],
  [45.31379, 10.86326], [45.32200, 10.86850], [45.33500, 10.87050], [45.34004, 10.86335],
]

// Area indicativa di proprietà Canossa (boschetto + villa) a Grezzano.
const AREA_CANOSSA = [
  [45.3156, 10.8603], [45.3156, 10.8653], [45.3120, 10.8653], [45.3120, 10.8603],
]

// ---------------------------------------------------------------------------
// Punti d'acqua e aree verdi protette nei dintorni (bozza 2026-07-04).
// Fonte: ricerca web su risorgive della fascia veneta, Comune di Povegliano
// Veronese (elenco ufficiale risorgive), Oasi WWF della Bora, progetto
// Cariverona "Fontanili di Povegliano: Biodiversità Bene Comune" 2025-26,
// Parco del Tione (Villafranca). Coordinate indicative/stimate.
// ---------------------------------------------------------------------------

const FOSSA_MORETTA = [45.3387, 10.8607]
const OASI_BORA = [45.3548, 10.8376]
const TIONE_SORGENTE = [45.3315, 10.8760]
const AREA_HAWK = [45.3650, 10.8150]

const AREA_OASI_BORA = [
  [45.3560, 10.8360], [45.3560, 10.8395], [45.3536, 10.8395], [45.3536, 10.8360],
]

const AREA_PARCO_TIONE = [
  [45.3520, 10.8330], [45.3520, 10.8400], [45.3495, 10.8400], [45.3495, 10.8330],
]

// ---------------------------------------------------------------------------
// Castelli, Serraglio Scaligero e monumenti storici entro ~10 km dal Fontanin
// (bozza 2026-07-04, coordinate indicative). Fonte: ricerca storica raccolta
// per la sezione Storia — Castello Scaligero di Villafranca, Castello
// Scaligero di Valeggio, Rocca di Nogarole, Serraglio Scaligero (Villafranca-
// Custoza-Valeggio, Cangrande II della Scala 1345-1354), necropoli di
// Povegliano, Pieve di Sommacampagna, Ossario di Custoza, Abbazia di Vigasio.
// ---------------------------------------------------------------------------

const CASTELLO_VILLAFRANCA = [45.3524, 10.8437]
const CASTELLO_VALEGGIO = [45.3608, 10.7319]
const ROCCA_NOGAROLE = [45.2807, 10.8103]
const NECROPOLI_POVEGLIANO = [45.3849, 10.8137]
const PIEVE_SOMMACAMPAGNA = [45.3813, 10.8324]
const OSSARIO_CUSTOZA = [45.3766, 10.7607]
const ABBAZIA_VIGASIO = [45.3312, 10.9214]

// Tracciato indicativo del Serraglio Scaligero: Villafranca -> Custoza -> Valeggio.
const SERRAGLIO_PATH = [CASTELLO_VILLAFRANCA, OSSARIO_CUSTOZA, CASTELLO_VALEGGIO]

// Icona "castello" (emoji) per distinguere i capisaldi del Serraglio dagli altri monumenti.
const castleIcon = L.divIcon({
  html: '<div style="font-size:20px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))">🏰</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Icona "monumento" (emoji) per gli altri riferimenti storici.
const monumentIcon = L.divIcon({
  html: '<div style="font-size:18px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))">🏛️</div>',
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export default function Mappa() {
  const { t } = useTranslation()
  const center = useMemo(() => [45.328, 10.8655], [])

  return (
    <div className="app-shell">
      <AppHeader title={t('mappa.title')} showBack />

      <div className="scroll-content">
        <p className="px-4 pt-3 pb-2 text-[11px] text-stone-500 leading-relaxed">
          {t('mappa.intro')}
        </p>

        <div className="mx-4 rounded-2xl overflow-hidden border border-pietra-border" style={{ height: '58vh' }}>
          <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <LayersControl position="topright">
              <LayersControl.BaseLayer name="Mappa">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer checked name="Satellite">
                <TileLayer
                  attribution='Tiles &copy; Esri'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <Polygon
              positions={AREA_DEMANIO_CONSORZIO}
              pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.18, weight: 1 }}
            >
              <Popup>
                <strong>{t('mappa.demanio_title')}</strong><br />{t('mappa.demanio_body')}
              </Popup>
            </Polygon>

            <Polygon
              positions={AREA_CANOSSA}
              pathOptions={{ color: '#476a8a', fillColor: '#a7c4dc', fillOpacity: 0.32, weight: 1.5 }}
            >
              <Popup>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <StemmaComune comune="mozzecane" variant="storico" size={28} />
                  <span><strong>{t('mappa.canossa_title')}</strong><br />{t('mappa.canossa_body')}</span>
                </div>
              </Popup>
            </Polygon>

            <Polyline positions={FOSSO_NUOVO_PATH} pathOptions={{ color: '#2563eb', weight: 3, dashArray: '2 6' }}>
              <Popup>{t('mappa.fosso_nuovo')}</Popup>
            </Polyline>

            <Marker position={FONTANIN}>
              <Popup>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <StemmaComune comune="villafranca" variant="pieno" size={28} />
                  <span><strong>{t('mappa.fontanin')}</strong><br />{t('mappa.fontanin_body')}</span>
                </div>
              </Popup>
            </Marker>

            <Marker position={VILLA_CANOSSA}>
              <Popup>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <StemmaComune comune="mozzecane" variant="pieno" size={28} />
                  <span><strong>{t('mappa.villa_canossa')}</strong><br />{t('mappa.villa_canossa_body')}</span>
                </div>
              </Popup>
            </Marker>

            {/* Aree verdi protette */}
            <Polygon
              positions={AREA_OASI_BORA}
              pathOptions={{ color: '#15803d', fillColor: '#4ade80', fillOpacity: 0.3, weight: 1.5 }}
            >
              <Popup>
                <strong>{t('mappa.oasi_bora_title')}</strong><br />{t('mappa.oasi_bora_body')}
              </Popup>
            </Polygon>

            <Polygon
              positions={AREA_PARCO_TIONE}
              pathOptions={{ color: '#15803d', fillColor: '#4ade80', fillOpacity: 0.22, weight: 1.5, dashArray: '4 4' }}
            >
              <Popup>
                <strong>{t('mappa.parco_tione_title')}</strong><br />{t('mappa.parco_tione_body')}
              </Popup>
            </Polygon>

            {/* Altri punti d'acqua */}
            <CircleMarker center={FOSSA_MORETTA} radius={7} pathOptions={{ color: '#0e7490', fillColor: '#22d3ee', fillOpacity: 0.9, weight: 2 }}>
              <Popup>
                <strong>{t('mappa.fossa_moretta_title')}</strong><br />{t('mappa.fossa_moretta_body')}
              </Popup>
            </CircleMarker>

            <CircleMarker center={TIONE_SORGENTE} radius={7} pathOptions={{ color: '#0e7490', fillColor: '#22d3ee', fillOpacity: 0.9, weight: 2 }}>
              <Popup>
                <strong>{t('mappa.tione_title')}</strong><br />{t('mappa.tione_body')}
              </Popup>
            </CircleMarker>

            <CircleMarker center={AREA_HAWK} radius={8} pathOptions={{ color: '#15803d', fillColor: '#86efac', fillOpacity: 0.9, weight: 2 }}>
              <Popup>
                <strong>{t('mappa.hawk_title')}</strong><br />{t('mappa.hawk_body')}
              </Popup>
            </CircleMarker>

            {/* Serraglio Scaligero: Villafranca -> Custoza -> Valeggio */}
            <Polyline positions={SERRAGLIO_PATH} pathOptions={{ color: '#334155', weight: 3, dashArray: '1 8' }}>
              <Popup>
                <strong>{t('mappa.serraglio_title')}</strong><br />{t('mappa.serraglio_body')}
              </Popup>
            </Polyline>

            {/* Castelli */}
            <Marker position={CASTELLO_VILLAFRANCA} icon={castleIcon}>
              <Popup>
                <strong>{t('mappa.castello_villafranca_title')}</strong><br />{t('mappa.castello_villafranca_body')}
              </Popup>
            </Marker>
            <Marker position={CASTELLO_VALEGGIO} icon={castleIcon}>
              <Popup>
                <strong>{t('mappa.castello_valeggio_title')}</strong><br />{t('mappa.castello_valeggio_body')}
              </Popup>
            </Marker>
            <Marker position={ROCCA_NOGAROLE} icon={castleIcon}>
              <Popup>
                <strong>{t('mappa.rocca_nogarole_title')}</strong><br />{t('mappa.rocca_nogarole_body')}
              </Popup>
            </Marker>

            {/* Altri monumenti storici entro ~10 km */}
            <Marker position={NECROPOLI_POVEGLIANO} icon={monumentIcon}>
              <Popup>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <StemmaComune comune="povegliano" variant="pieno" size={28} />
                  <span><strong>{t('mappa.necropoli_povegliano_title')}</strong><br />{t('mappa.necropoli_povegliano_body')}</span>
                </div>
              </Popup>
            </Marker>
            <Marker position={PIEVE_SOMMACAMPAGNA} icon={monumentIcon}>
              <Popup>
                <strong>{t('mappa.pieve_sommacampagna_title')}</strong><br />{t('mappa.pieve_sommacampagna_body')}
              </Popup>
            </Marker>
            <Marker position={OSSARIO_CUSTOZA} icon={monumentIcon}>
              <Popup>
                <strong>{t('mappa.ossario_custoza_title')}</strong><br />{t('mappa.ossario_custoza_body')}
              </Popup>
            </Marker>
            <Marker position={ABBAZIA_VIGASIO} icon={monumentIcon}>
              <Popup>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <StemmaComune comune="vigasio" variant="pieno" size={28} />
                  <span><strong>{t('mappa.abbazia_vigasio_title')}</strong><br />{t('mappa.abbazia_vigasio_body')}</span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Legenda */}
        <div className="mx-4 mt-3 stone-card space-y-2">
          <p className="text-[10px] text-sp-dark uppercase tracking-widest font-medium mb-1">{t('mappa.legend')}</p>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="w-3 h-3 rounded-full bg-noce flex-shrink-0" />
            {t('mappa.fontanin')} / {t('mappa.villa_canossa')}
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="w-4 h-1.5 rounded-full flex-shrink-0" style={{ background: '#2563eb' }} />
            {t('mappa.fosso_nuovo')}
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: '#a7c4dc', border: '1px solid #476a8a' }} />
            {t('mappa.canossa_title')}
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: 'rgba(59,130,246,0.3)', border: '1px solid #2563eb' }} />
            {t('mappa.demanio_title')}
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#22d3ee', border: '2px solid #0e7490' }} />
            {t('mappa.legend_water')}
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: 'rgba(74,222,128,0.35)', border: '1px solid #15803d' }} />
            {t('mappa.legend_green')}
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="text-sm flex-shrink-0">🏰 🏛️</span>
            {t('mappa.legend_storia')}
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="w-4 h-1.5 rounded-full flex-shrink-0" style={{ background: '#334155' }} />
            {t('mappa.serraglio_title')}
          </div>
        </div>

        <p className="mx-4 my-3 text-[10px] text-stone-400 leading-relaxed">
          {t('mappa.disclaimer')}
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
