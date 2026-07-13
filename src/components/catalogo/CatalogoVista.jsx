import React from 'react';
import { useNavigate } from 'react-router-dom';
import EvidenzaBadge from './EvidenzaBadge';

export default function CatalogoVista({ schede, categorie }) {
  const navigate = useNavigate();

  if (!schede || schede.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500 stone-card border-dashed">
        Nessuna scheda trovata in questa sezione.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {schede.map(scheda => (
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
      ))}
    </div>
  );
}
