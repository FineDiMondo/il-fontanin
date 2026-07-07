import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import CatalogForm from '../components/catalogo/CatalogForm';
import { useAuth } from '../context/AuthContext';

export default function CatalogoDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [scheda, setScheda] = useState(null);
  const [categorie, setCategorie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notaValidazione, setNotaValidazione] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [schRes, catRes] = await Promise.all([
        api.get(`/catalogo/schede/${id}`),
        api.get('/catalogo/categorie')
      ]);
      setScheda(schRes.data);
      setCategorie(catRes.data);
    } catch (err) {
      console.error(err);
      alert("Errore o permesso negato.");
      navigate('/catalogo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await api.patch(`/catalogo/schede/${id}`, formData);
      alert("Scheda aggiornata");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Errore aggiornamento");
    }
  };

  const handleAttachMedia = async (payload) => {
    try {
      if (payload.type === 'upload') {
        await api.post(`/catalogo/schede/${id}/media`, payload.data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/catalogo/schede/${id}/media/link`, payload.data);
      }
      alert("Media allegato con successo!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Errore allegato");
    }
  };

  const handleValidation = async (approvata) => {
    try {
      await api.post(`/catalogo/schede/${id}/valida`, {
        approvata,
        nota_validazione: notaValidazione || "Nessuna nota"
      });
      alert(approvata ? "Scheda Pubblicata!" : "Scheda Respinta/Rimandata in Bozza");
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Errore di validazione");
    }
  };

  if (loading || !scheda) return <div className="p-8 text-center">Caricamento...</div>;

  const isCreatorOrAdmin = user?.ruolo === 'admin' || scheda.creato_da === user?.user_id;
  const canEdit = scheda.stato === 'bozza' && isCreatorOrAdmin;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <button onClick={() => navigate('/catalogo')} className="text-stone-500 hover:text-stone-800 text-sm font-bold flex items-center mb-2">
            &larr; Torna al Catalogo
          </button>
          <h1 className="font-serif text-3xl font-bold text-oro">{scheda.nome}</h1>
          <div className="flex gap-2 mt-2">
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
              scheda.stato === 'pubblicato' ? 'bg-green-100 text-green-800' : 
              scheda.stato === 'bozza' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}>
              Stato: {scheda.stato.toUpperCase()}
            </span>
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-stone-100 text-stone-600">
              ID: {scheda.id.split('-')[0]}
            </span>
          </div>
        </div>
      </div>

      {scheda.nota_validazione && scheda.stato === 'in_validazione' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <strong>Nota Validatore:</strong> {scheda.nota_validazione}
        </div>
      )}

      {/* ADMIN VALIDATOR ACTIONS */}
      {user?.ruolo === 'admin' && scheda.stato === 'bozza' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col gap-3">
          <h3 className="font-bold text-blue-900">Azioni Validatore</h3>
          <textarea 
            placeholder="Nota di validazione (obbligatoria se si respinge)" 
            className="p-2 border rounded text-sm w-full"
            value={notaValidazione}
            onChange={e => setNotaValidazione(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={() => handleValidation(true)} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-green-700">Approva e Pubblica</button>
            <button onClick={() => handleValidation(false)} className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700">Respingi in Revisione</button>
          </div>
        </div>
      )}

      <CatalogForm 
        initialData={scheda}
        categories={categorie}
        readOnly={!canEdit}
        onSubmit={canEdit ? handleUpdate : undefined}
        onAttachMedia={isCreatorOrAdmin ? handleAttachMedia : undefined}
      />

      {/* LISTA MEDIA ALLEGATI */}
      {scheda.media && scheda.media.length > 0 && (
        <div className="mt-8 p-4 border border-stone-200 rounded-lg bg-white shadow-sm flex flex-col gap-4">
          <h2 className="font-serif text-lg text-oro">Media Allegati</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheda.media.map(m => (
              <div key={m.id} className="border border-stone-200 rounded p-3 bg-stone-50 flex flex-col gap-2">
                <div className="font-bold text-sm">{m.nome_file || 'Media'} <span className="text-stone-500 font-normal">({m.tipo})</span></div>
                {m.descrizione && <div className="text-xs text-stone-600">{m.descrizione}</div>}
                
                {m.modalita_acquisizione === 'link_esterno' && (
                  <a href={m.url_esterno} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs mt-2">Apri Link Esterno</a>
                )}
                {m.modalita_acquisizione === 'link_drive_personale' && (
                  <a href={`https://drive.google.com/file/d/${m.drive_file_id}/view`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs mt-2">Apri in Drive</a>
                )}
                {m.modalita_acquisizione === 'upload_server' && (
                  <div className="text-xs text-green-600 mt-2 font-semibold">File caricato su Cloud Storage</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
