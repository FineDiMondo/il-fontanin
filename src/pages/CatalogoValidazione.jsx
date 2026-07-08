import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext';

export default function CatalogoValidazione() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.ruolo === 'admin') {
      fetchBozze();
    } else {
      navigate('/catalogo');
    }
  }, [user]);

  const fetchBozze = async () => {
    try {
      const res = await api.get('/catalogo/schede?stato=bozza');
      setSchede(res.data);
    } catch (err) {
      console.error(err);
      alert("Errore fetch bozze");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Caricamento...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <button onClick={() => navigate('/catalogo')} className="text-stone-500 hover:text-stone-800 text-sm font-bold flex items-center mb-4">
          &larr; Torna al Catalogo
        </button>
        <h1 className="font-serif text-3xl font-bold text-oro">Area Validazione</h1>
        <p className="text-stone-600 mt-1">Schede in attesa di validazione e pubblicazione.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
        {schede.length === 0 ? (
          <div className="p-8 text-center text-stone-500">Nessuna scheda in coda di validazione.</div>
        ) : (
          <table className="min-w-full divide-y divide-stone-200 text-left">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Data Modifica</th>
                <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {schede.map(scheda => (
                <tr key={scheda.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-mono">
                    {scheda.id.split('-')[0]}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-stone-800">
                    {scheda.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {scheda.stato}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    {new Date(scheda.updated_at || scheda.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => navigate(`/catalogo/scheda/${scheda.id}`)} className="text-oro hover:text-yellow-600 font-bold">
                      Esamina &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
