import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import CatalogForm from '../components/catalogo/CatalogForm';

export default function CatalogoNuovo() {
  const navigate = useNavigate();
  const [categorie, setCategorie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/catalogo/categorie')
      .then(res => setCategorie(res.data))
      .catch(err => console.error("Errore fetch categorie", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      // In creazione, salviamo prima la scheda
      const res = await api.post('/catalogo/schede', formData);
      const newScheda = res.data;
      alert("Scheda salvata in bozza con successo! ID: " + newScheda.id);
      navigate(`/catalogo/scheda/${newScheda.id}`); // Si può poi reindirizzare al dettaglio per aggiungere media o chiederne la validazione
    } catch (err) {
      console.error("Errore salvataggio", err);
      alert("Errore durante il salvataggio della scheda.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Caricamento in corso...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <button onClick={() => navigate('/catalogo')} className="text-stone-500 hover:text-stone-800 text-sm font-bold flex items-center mb-4">
          &larr; Torna al Catalogo
        </button>
        <h1 className="font-serif text-3xl font-bold text-oro">Nuova Scheda Catalogo</h1>
        <p className="text-stone-600 mt-1">Acquisisci un nuovo bene geolocalizzato sul territorio.</p>
      </div>

      <CatalogForm 
        categories={categorie} 
        onSubmit={handleSubmit} 
        isSubmitting={submitting}
        readOnly={false} 
      />
    </div>
  );
}
