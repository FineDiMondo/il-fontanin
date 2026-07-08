import React from 'react';
import { useTranslation } from 'react-i18next';

// AT-ADD-02 §4.2 — colori confermati da Daniel il 2026-07-08.
// L (Leggenda) è volutamente "altra cosa" (viola), non un gradino della stessa scala.
const STILI = {
  C: 'bg-green-100 text-green-800 border-green-300',
  D: 'bg-sky-100 text-sky-800 border-sky-300',
  I: 'bg-amber-100 text-amber-800 border-amber-300',
  L: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function EvidenzaBadge({ livello, className = '' }) {
  const { t } = useTranslation();
  if (!livello || !STILI[livello]) return null;

  return (
    <span
      title={t(`catalogo.evidenza.help.${livello}`, '')}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${STILI[livello]} ${className}`}
    >
      <span>{livello}</span>
      <span className="font-semibold">{t(`catalogo.evidenza.${livello}`, livello)}</span>
    </span>
  );
}
