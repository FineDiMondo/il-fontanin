import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per le icone di Leaflet con Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

import MonumentiCristianiFields from './MonumentiCristianiFields';

const FONTANIN_DEFAULT = [45.3122, 10.8719]; // Coordinate di El Fontanin (circa Povegliano)
const MAX_UPLOAD_SIZE = 28 * 1024 * 1024; // 28MB

function LocationMarker({ position, setPosition, readOnly }) {
  const markerRef = useRef(null);

  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        }
      },
    }),
    [setPosition],
  );

  useMapEvents({
    click(e) {
      if (!readOnly) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  return position === null ? null : (
    <Marker
      draggable={!readOnly}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    ></Marker>
  );
}

export default function CatalogForm({ 
  initialData = {}, 
  categories = [], 
  onSubmit, 
  onAttachMedia,
  readOnly = false,
  isSubmitting = false
}) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    categoria_id: '',
    sottocategoria_id: '',
    nome: '',
    descrizione: '',
    cronologia_storica: '',
    evidenza_livello: '',
    evidenza_fonte: '',
    metadata_specifici: {},
    ...initialData
  });
  
  const [position, setPosition] = useState(
    initialData.lat && initialData.lng ? [initialData.lat, initialData.lng] : null
  );

  const [mediaTab, setMediaTab] = useState('upload'); // upload, drive, link
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaDriveId, setMediaDriveId] = useState('');
  const [mediaLink, setMediaLink] = useState('');
  const [mediaName, setMediaName] = useState('');
  const [mediaType, setMediaType] = useState('foto'); // foto, video, documento

  // Auto-geolocalizzazione solo in creazione (non readOnly e senza coordinate iniziali)
  useEffect(() => {
    if (!readOnly && position === null && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
          console.warn("GPS non disponibile", err);
          alert("Permesso GPS negato o non disponibile. Seleziona manualmente il punto sulla mappa.");
          setPosition(FONTANIN_DEFAULT);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else if (position === null) {
      setPosition(FONTANIN_DEFAULT);
    }
  }, [readOnly, position]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMetadataChange = (newMeta) => {
    setFormData(prev => ({ ...prev, metadata_specifici: newMeta }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_UPLOAD_SIZE) {
        alert("Il file supera la dimensione massima consentita (28 MB). Usa il tab 'Collega dal mio Drive' per file più grandi.");
        e.target.value = '';
        setMediaFile(null);
      } else {
        setMediaFile(file);
      }
    }
  };

  const handleAttachSubmit = async (e) => {
    e.preventDefault();
    if (!onAttachMedia) return;
    
    let payload = null;
    
    if (mediaTab === 'upload' && mediaFile) {
      const formData = new FormData();
      formData.append("file", mediaFile);
      formData.append("tipo", mediaType);
      if (mediaName) formData.append("descrizione", mediaName);
      payload = { type: 'upload', data: formData };
    } else if (mediaTab === 'drive' && mediaDriveId) {
      payload = {
        type: 'link',
        data: {
          tipo: mediaType,
          modalita_acquisizione: 'link_drive_personale',
          drive_file_id: mediaDriveId,
          nome_file: mediaName || "File da Drive"
        }
      };
    } else if (mediaTab === 'link' && mediaLink) {
      payload = {
        type: 'link',
        data: {
          tipo: mediaType,
          modalita_acquisizione: 'link_esterno',
          url_esterno: mediaLink,
          nome_file: mediaName || "Link Esterno"
        }
      };
    }
    
    if (payload) {
      await onAttachMedia(payload);
      // Reset form media
      setMediaFile(null);
      setMediaDriveId('');
      setMediaLink('');
      setMediaName('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!position) {
      alert("La geolocalizzazione è obbligatoria.");
      return;
    }
    
    const submitData = {
      ...formData,
      lat: position[0],
      lng: position[1],
      // Trasforma stringhe vuote in null per Pydantic
      sottocategoria_id: formData.sottocategoria_id || null,
      evidenza_livello: formData.evidenza_livello || null,
      evidenza_fonte: formData.evidenza_fonte || null
    };
    
    onSubmit(submitData);
  };

  // Determina la categoria selezionata
  const selCategory = categories.find(c => c.id === formData.categoria_id);

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* INFO BASE */}
        <div className="p-4 border border-stone-200 rounded-lg bg-white shadow-sm flex flex-col gap-4">
          <h2 className="font-serif text-lg text-oro">Dati Principali</h2>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-600">Nome Scheda *</label>
            <input required type="text" name="nome" value={formData.nome} onChange={handleChange} disabled={readOnly}
              className="border border-stone-300 rounded p-2 text-sm focus:ring-oro" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-600">Categoria *</label>
              <select required name="categoria_id" value={formData.categoria_id} onChange={handleChange} disabled={readOnly}
                className="border border-stone-300 rounded p-2 text-sm focus:ring-oro">
                <option value="">Seleziona...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-600">Sottocategoria</label>
              <select name="sottocategoria_id" value={formData.sottocategoria_id} onChange={handleChange} disabled={readOnly || !selCategory}
                className="border border-stone-300 rounded p-2 text-sm focus:ring-oro">
                <option value="">Nessuna (Generica)</option>
                {selCategory?.sottocategorie?.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-600">Descrizione</label>
            <textarea name="descrizione" value={formData.descrizione || ''} onChange={handleChange} disabled={readOnly} rows={4}
              className="border border-stone-300 rounded p-2 text-sm focus:ring-oro w-full" />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-600">Cronologia / Cenni Storici</label>
            <textarea name="cronologia_storica" value={formData.cronologia_storica || ''} onChange={handleChange} disabled={readOnly} rows={3}
              className="border border-stone-300 rounded p-2 text-sm focus:ring-oro w-full" />
          </div>
        </div>

        {/* MAPPA / POSIZIONE */}
        <div className="p-4 border border-stone-200 rounded-lg bg-white shadow-sm flex flex-col gap-4">
          <h2 className="font-serif text-lg text-oro">Posizione Geografica *</h2>
          <p className="text-xs text-stone-500">Trascina il marker per aggiustare la posizione esatta.</p>
          <div className="h-[300px] w-full rounded overflow-hidden relative z-0 touch-none">
            {position && (
              <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} readOnly={readOnly} />
              </MapContainer>
            )}
          </div>
          <div className="text-xs text-stone-500 font-mono">
            Lat: {position?.[0]?.toFixed(6)}, Lng: {position?.[1]?.toFixed(6)}
          </div>
        </div>

        {/* CAMPI SPECIFICI DINAMICI */}
        {selCategory && selCategory.codice === 'monumenti-cristiani' && (
          <MonumentiCristianiFields data={formData.metadata_specifici} onChange={handleMetadataChange} readOnly={readOnly} />
        )}

        {/* EVIDENZA E PUBBLICAZIONE */}
        <div className="p-4 border border-stone-200 rounded-lg bg-white shadow-sm flex flex-col gap-4">
          <h2 className="font-serif text-lg text-oro">Livello Evidenza e Fonti</h2>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-600">Sigla Evidenza (C/D/I/L)</label>
            <select name="evidenza_livello" value={formData.evidenza_livello || ''} onChange={handleChange} disabled={readOnly}
              className="border border-stone-300 rounded p-2 text-sm focus:ring-oro">
              <option value="">Non specificato</option>
              <option value="C">C - (Da definire)</option>
              <option value="D">D - (Da definire)</option>
              <option value="I">I - (Da definire)</option>
              <option value="L">L - Leggenda</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-600">Archivio / Fonte di Riferimento</label>
            <input type="text" name="evidenza_fonte" value={formData.evidenza_fonte || ''} onChange={handleChange} disabled={readOnly}
              className="border border-stone-300 rounded p-2 text-sm focus:ring-oro" placeholder="es. Archivio Diocesano Verona" />
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end mt-4">
            <button type="submit" disabled={isSubmitting} className="bg-oro text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50">
              {isSubmitting ? "Salvataggio in corso..." : "Salva Scheda (Bozza)"}
            </button>
          </div>
        )}
      </form>

      {/* SEZIONE ALLEGATI MEDIA (Mostrata solo se la scheda esiste già, es. in modifica o view, oppure gestibile in un secondo step) */}
      {!readOnly && onAttachMedia && initialData.id && (
        <div className="p-4 border border-stone-200 rounded-lg bg-white shadow-sm flex flex-col gap-4 mt-6">
          <h2 className="font-serif text-lg text-oro">Aggiungi Allegato (Foto/Video/Doc)</h2>
          
          <div className="flex flex-col gap-3">
            <div className="flex bg-stone-100 p-1 rounded-lg">
              <button type="button" onClick={() => setMediaTab('upload')} className={`flex-1 text-xs py-2 rounded-md font-semibold transition-colors ${mediaTab === 'upload' ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}>Scatta / Carica</button>
              <button type="button" onClick={() => setMediaTab('drive')} className={`flex-1 text-xs py-2 rounded-md font-semibold transition-colors ${mediaTab === 'drive' ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}>Da Drive</button>
              <button type="button" onClick={() => setMediaTab('link')} className={`flex-1 text-xs py-2 rounded-md font-semibold transition-colors ${mediaTab === 'link' ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}>Link (YouTube)</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-stone-600">Tipo Media</label>
                <select value={mediaType} onChange={e => setMediaType(e.target.value)} className="border border-stone-300 rounded p-2 text-sm focus:ring-oro">
                  <option value="foto">Foto Immagine</option>
                  <option value="video">Video</option>
                  <option value="documento">Documento (PDF/Testo)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-stone-600">Nome / Didascalia</label>
                <input type="text" value={mediaName} onChange={e => setMediaName(e.target.value)} className="border border-stone-300 rounded p-2 text-sm focus:ring-oro" />
              </div>
            </div>

            {mediaTab === 'upload' && (
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-xs font-semibold text-stone-600">Seleziona o Scatta dal Telefono (Max 28MB)</label>
                <input 
                  type="file" 
                  accept={mediaType === 'video' ? 'video/*' : mediaType === 'foto' ? 'image/*' : '*/*'} 
                  capture="environment"
                  onChange={handleFileChange}
                  className="border border-stone-300 rounded p-2 text-sm w-full bg-stone-50 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-oro file:text-white"
                />
              </div>
            )}

            {mediaTab === 'drive' && (
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-xs font-semibold text-stone-600">ID File Google Drive</label>
                <input type="text" value={mediaDriveId} onChange={e => setMediaDriveId(e.target.value)} placeholder="es. 1B2a3c4d5e6f7g8h9i0j..." className="border border-stone-300 rounded p-2 text-sm focus:ring-oro" />
              </div>
            )}

            {mediaTab === 'link' && (
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-xs font-semibold text-stone-600">URL Pubblico (es. Link YouTube)</label>
                <input type="url" value={mediaLink} onChange={e => setMediaLink(e.target.value)} placeholder="https://..." className="border border-stone-300 rounded p-2 text-sm focus:ring-oro" />
              </div>
            )}

            <button type="button" onClick={handleAttachSubmit} disabled={isSubmitting || (mediaTab==='upload' && !mediaFile) || (mediaTab==='drive' && !mediaDriveId) || (mediaTab==='link' && !mediaLink)} className="bg-stone-800 text-white px-4 py-2 rounded font-bold hover:bg-stone-700 disabled:opacity-50 mt-2">
              Allega Media
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
