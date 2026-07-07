import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext';

export default function Catalogo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [categorie, setCategorie] = useState([]);
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoria, setSelectedCategoria] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedCategoria]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, schedeRes] = await Promise.all([
        api.get('/community/catalogo/categorie'),
        api.get(`/community/catalogo/schede?stato=pubblicato${selectedCategoria ? `&categoria_id=${selectedCategoria}` : ''}`)
      ]);
      setCategorie(catRes.data);
      setSchede(schedeRes.data);
    } catch (err) {
      console.error("Errore recupero catalogo:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-oro">Catalogo Territoriale</h1>
          <p className="text-stone-600 mt-1">Esplora i beni materiali e immateriali della nostra comunità.</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {(user?.ruolo === 'socio' || user?.ruolo === 'admin') && (
            <button onClick={() => navigate('/catalogo/nuovo')} className="bg-oro text-white px-4 py-2 rounded font-bold hover:bg-yellow-600 shadow-sm">
              + Nuova Scheda
            </button>
          )}
          {user?.ruolo === 'admin' && (
            <button onClick={() => navigate('/catalogo/validazione')} className="bg-stone-800 text-white px-4 py-2 rounded font-bold hover:bg-stone-700 shadow-sm">
              Area Validazione
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
        <button 
          onClick={() => setSelectedCategoria('')}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${!selectedCategoria ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}
        >
          Tutti
        </button>
        {categorie.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategoria(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedCategoria === cat.id ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}
          >
            {cat.nome}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oro"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schede.length === 0 ? (
            <div className="col-span-full text-center py-12 text-stone-500 bg-stone-50 rounded-lg">
              Nessuna scheda trovata.
            </div>
          ) : (
            schede.map(scheda => (
              <div key={scheda.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-stone-200 hover:shadow-lg transition-shadow">
                <div className="p-5 flex flex-col h-full">
                  <div className="text-xs font-bold text-oro uppercase tracking-wider mb-2">
                    {categorie.find(c => c.id === scheda.categoria_id)?.nome || 'Generale'}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-stone-800 mb-2">{scheda.nome}</h3>
                  <p className="text-sm text-stone-600 line-clamp-3 flex-grow mb-4">{scheda.descrizione}</p>
                  
                  {/* Eventuali indicatori di media */}
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-stone-100">
                    <span className="text-xs text-stone-500 font-mono">ID: {scheda.id.split('-')[0]}</span>
                    <button onClick={() => navigate(`/catalogo/scheda/${scheda.id}`)} className="text-oro font-bold text-sm hover:underline">
                      Dettagli &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
