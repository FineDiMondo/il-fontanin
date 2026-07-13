import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import CatalogoVista from '../components/catalogo/CatalogoVista.jsx';
import AppHeader from '../components/AppHeader.jsx';
import BottomNav from '../components/BottomNav.jsx';

export default function Yggdrasil() {
  const navigate = useNavigate();
  
  const [schede, setSchede] = useState([]);
  const [categorie, setCategorie] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedeRes, catRes] = await Promise.all([
        // Yggdrasil mostra tutto il catalogo
        api.get('/catalogo/schede?stato=pubblicato'),
        api.get('/catalogo/categorie')
      ]);
      setSchede(schedeRes.data);
      setCategorie(catRes.data);
    } catch (err) {
      console.error("Errore recupero Yggdrasil:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen bg-[#0a0a0a]">
      <header className="flex items-center px-6 py-6 border-b border-white bg-stone-900">
        <button onClick={() => navigate('/')} className="mr-4 text-white hover:text-stone-300">
          ←
        </button>
        <div>
          <h1 className="text-white font-semibold text-2xl tracking-tight">
            Yggdrasil
          </h1>
          <p className="text-stone-400 text-sm">
            L'albero del mondo, catalogo globale
          </p>
        </div>
      </header>

      <div className="scroll-content px-6 py-6 max-w-[1600px] mx-auto">
        <div className="mb-6">
          <p className="text-stone-300 leading-relaxed">
            Esplora l'intero patrimonio materiale e immateriale dei 9 regni di Villafranca.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-b-2 border-white rounded-full"></div></div>
        ) : (
          <CatalogoVista schede={schede} categorie={categorie} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
