import React from 'react';
import { useTranslation } from 'react-i18next';

export default function MonumentiCristianiFields({ data, onChange, readOnly }) {
  const { t } = useTranslation();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="flex flex-col gap-4 mt-4 p-4 border rounded-lg bg-stone-50 border-stone-200">
      <h3 className="font-semibold text-stone-700 text-sm">Dati Specifici: Monumenti Cristiani</h3>
      
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-stone-600">Dedicazione</label>
        <input 
          type="text" 
          name="dedicazione"
          value={data?.dedicazione || ''}
          onChange={handleChange}
          disabled={readOnly}
          className="border border-stone-300 rounded p-2 text-sm focus:ring-oro focus:border-oro disabled:bg-stone-100"
          placeholder="es. San Zeno, Santa Maria..."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-stone-600">Stato di Conservazione *</label>
        <select
          name="stato_conservazione"
          value={data?.stato_conservazione || ''}
          onChange={handleChange}
          disabled={readOnly}
          className="border border-stone-300 rounded p-2 text-sm focus:ring-oro focus:border-oro disabled:bg-stone-100"
          required
        >
          <option value="" disabled>Seleziona uno stato...</option>
          <option value="buono">Buono</option>
          <option value="discreto">Discreto</option>
          <option value="degradato">Degradato</option>
        </select>
      </div>
    </div>
  );
}
