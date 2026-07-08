import React from 'react';
import { useTranslation } from 'react-i18next';

// AT-ADD-02 §4.3 — renderer generico dei campi specifici da metadata_schema.
// Sostituisce i componenti hardcoded per categoria (es. MonumentiCristianiFields).
// Formato schema: { campi: [{ chiave, tipo: testo|numero|scelta|booleano, opzioni?, obbligatorio }] }
// Etichette: catalogo.campi.<chiave> / opzioni: catalogo.opzioni.<valore>, con fallback umanizzato.

function umanizza(chiave) {
  return chiave.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
}

export default function MetadataFields({ schema, categoriaNome, data, onChange, readOnly }) {
  const { t } = useTranslation();
  const campi = schema?.campi || [];
  if (campi.length === 0) return null;

  const valori = data || {};

  const setCampo = (chiave, valore) => {
    onChange({ ...valori, [chiave]: valore });
  };

  const inputCls = 'border border-stone-300 rounded p-2 text-sm focus:ring-oro focus:border-oro disabled:bg-stone-100';

  return (
    <div className="flex flex-col gap-4 mt-4 p-4 border rounded-lg bg-stone-50 border-stone-200">
      <h3 className="font-semibold text-stone-700 text-sm">
        {t('catalogo.campi_specifici', 'Dati Specifici')}{categoriaNome ? `: ${categoriaNome}` : ''}
      </h3>

      {campi.map(campo => {
        const label = t(`catalogo.campi.${campo.chiave}`, umanizza(campo.chiave));
        const req = !!campo.obbligatorio;

        if (campo.tipo === 'booleano') {
          return (
            <label key={campo.chiave} className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={!!valori[campo.chiave]}
                onChange={e => setCampo(campo.chiave, e.target.checked)}
                disabled={readOnly}
                className="rounded border-stone-300 text-oro focus:ring-oro"
              />
              <span className="font-semibold text-xs text-stone-600">{label}{req ? ' *' : ''}</span>
            </label>
          );
        }

        return (
          <div key={campo.chiave} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-600">{label}{req ? ' *' : ''}</label>

            {campo.tipo === 'scelta' ? (
              <select
                value={valori[campo.chiave] ?? ''}
                onChange={e => setCampo(campo.chiave, e.target.value)}
                disabled={readOnly}
                required={req}
                className={inputCls}
              >
                <option value="" disabled={req}>{t('catalogo.seleziona', 'Seleziona...')}</option>
                {(campo.opzioni || []).map(opt => (
                  <option key={opt} value={opt}>{t(`catalogo.opzioni.${opt}`, umanizza(opt))}</option>
                ))}
              </select>
            ) : campo.tipo === 'numero' ? (
              <input
                type="number"
                value={valori[campo.chiave] ?? ''}
                onChange={e => setCampo(campo.chiave, e.target.value === '' ? null : Number(e.target.value))}
                disabled={readOnly}
                required={req}
                className={inputCls}
              />
            ) : (
              <input
                type="text"
                value={valori[campo.chiave] ?? ''}
                onChange={e => setCampo(campo.chiave, e.target.value)}
                disabled={readOnly}
                required={req}
                className={inputCls}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
