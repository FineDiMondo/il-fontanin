/**
 * Utilità per ricalcolare e formattare le dosi delle ricette.
 */

/**
 * Scala una quantità di un ingrediente.
 * 
 * @param {number|null} quantita La quantità base (es. 200, 1.5, null per "q.b.")
 * @param {string|null} unita L'unità di misura (es. 'g', 'ml', 'uova', 'pezzi')
 * @param {number} porzioniBase Il numero di porzioni originali della ricetta
 * @param {number} porzioniDesiderate Il numero di porzioni per cui si vuole ricalcolare
 * @returns {object} { quantita: number|null, formattato: string }
 */
export function scaleIngredient(quantita, unita, porzioniBase, porzioniDesiderate) {
  if (quantita == null || isNaN(quantita)) {
    return { quantita: null, formattato: '' };
  }

  const factor = porzioniDesiderate / porzioniBase;
  const newQuantita = quantita * factor;

  let formattato = '';

  // Determina la logica di arrotondamento in base all'unità
  const unitaDiscrete = ['uova', 'spicchi', 'spicchio', 'pezzo', 'pezzi', 'cucchiaio', 'cucchiai', 'cucchiaino', 'cucchiaini'];
  
  const isDiscreta = unita && unitaDiscrete.includes(unita.toLowerCase());

  if (isDiscreta || !unita) {
    // Per unità discrete (es. uova, mele), manteniamo un decimale o formattiamo "1.5"
    // Arrotondiamo al mezzo punto più vicino se possibile, per evitare "1.33 uova"
    // Ma per semplicità arrotondiamo a 1 decimale se ha decimali
    if (newQuantita % 1 === 0) {
      formattato = newQuantita.toString();
    } else {
      formattato = Number(newQuantita.toFixed(1)).toString();
    }
  } else {
    // Per misure continue (g, ml, kg) si arrotonda all'intero
    formattato = Math.round(newQuantita).toString();
  }

  return {
    quantita: newQuantita,
    formattato
  };
}
