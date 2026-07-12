import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext';
import EvidenzaBadge from '../components/catalogo/EvidenzaBadge';
import AppHeader from '../components/AppHeader.jsx';
import BottomNav from '../components/BottomNav.jsx';

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
        api.get('/catalogo/categorie'),
        api.get(`/catalogo/schede?stato=pubblicato${selectedCategoria ? `&categoria_id=${selectedCategoria}` : ''}`)
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
    <div className="app-shell">
      <AppHeader title="Catalogo" showBack />

      <div className="scroll-content px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-white uppercase tracking-wider">Catalogo Territoriale</h1>
            <p className="text-stone-400 mt-1">Esplora i beni materiali e immateriali della nostra comunità.</p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {(user?.ruolo === 'socio' || user?.ruolo === 'admin') && (
              <button onClick={() => navigate('/catalogo/nuovo')} className="bg-transparent border border-white text-white px-4 py-2 hover:bg-white hover:text-black transition-colors uppercase tracking-widest text-xs font-bold">
                + Nuova Scheda
              </button>
            )}
            {user?.ruolo === 'admin' && (
              <button onClick={() => navigate('/catalogo/validazione')} className="bg-transparent border border-stone-500 text-stone-300 px-4 py-2 hover:bg-stone-800 transition-colors uppercase tracking-widest text-xs font-bold">
                Area Validazione
              </button>
            )}
          </div>
        </div>

        <div className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategoria('')}
            className={`whitespace-nowrap px-4 py-2 border text-xs uppercase tracking-widest font-semibold transition-colors ${!selectedCategoria ? 'border-white bg-white text-black' : 'border-stone-600 text-stone-400 hover:border-stone-400 hover:text-white'}`}
          >
            Tutti
          </button>
          {categorie.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategoria(cat.id)}
              className={`whitespace-nowrap px-4 py-2 border text-xs uppercase tracking-widest font-semibold transition-colors ${selectedCategoria === cat.id ? 'border-white bg-white text-black' : 'border-stone-600 text-stone-400 hover:border-stone-400 hover:text-white'}`}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-b-2 border-white rounded-full"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schede.length === 0 ? (
              <div className="col-span-full text-center py-12 text-stone-500 stone-card border-dashed">
                Nessuna scheda trovata.
              </div>
            ) : (
              schede.map(scheda => (
                <div key={scheda.id} className="stone-card flex flex-col h-full hover:border-stone-400 transition-colors">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-800 pb-2">
                    {categorie.find(c => c.id === scheda.categoria_id)?.nome || 'Generale'}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-xl font-serif font-bold text-white leading-tight">{scheda.nome}</h3>
                    <EvidenzaBadge livello={scheda.evidenza_livello} />
                  </div>
                  <p className="text-sm text-stone-400 line-clamp-3 flex-grow mb-6 leading-relaxed">{scheda.descrizione}</p>
                  
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-stone-800">
                    <span className="text-[10px] text-stone-600 font-mono">ID: {scheda.id.split('-')[0]}</span>
                    <button onClick={() => navigate(`/catalogo/scheda/${scheda.id}`)} className="text-white uppercase tracking-widest text-xs font-bold hover:text-stone-300 flex items-center gap-1">
                      Dettagli <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
