/**
 * Utilità per la trasposizione di accordi in formato testuale.
 * Riconosce gli accordi in formato ChordPro (es: [C], [Am], [F#m7]) e li traspone.
 */

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Mappatura enarmonica per facilitare la normalizzazione
const ENHARMONICS = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
};

/**
 * Normalizza una nota (es. Bb diventa A#) per facilitare il calcolo.
 */
function normalizeNote(note) {
  return ENHARMONICS[note] || note;
}

/**
 * Traspone una singola nota (es. 'C' -> +2 -> 'D')
 */
function transposeNote(note, delta) {
  const normalized = normalizeNote(note);
  const index = NOTES.indexOf(normalized);
  if (index === -1) return note; // Non è una nota standard, ritorna intatta

  let newIndex = (index + delta) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return NOTES[newIndex];
}

/**
 * Traspone un accordo completo (es. 'F#m7' -> +2 -> 'G#m7')
 */
function transposeChord(chord, delta) {
  if (delta === 0) return chord;
  
  // Trova la nota base dell'accordo (es. F#, Bb, C)
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  
  const root = match[1];
  const suffix = match[2];
  
  const newRoot = transposeNote(root, delta);
  
  // Se c'è un basso alternato (es. /C#), traspone anche quello
  let newSuffix = suffix;
  if (suffix.includes('/')) {
    const parts = suffix.split('/');
    if (parts.length === 2 && parts[1].match(/^[A-G][#b]?$/)) {
      const bass = parts[1];
      const newBass = transposeNote(bass, delta);
      newSuffix = `${parts[0]}/${newBass}`;
    }
  }
  
  return `${newRoot}${newSuffix}`;
}

/**
 * Scansiona un testo (es. con markup [Chord]) e traspone tutti gli accordi trovati.
 */
export function transposeText(text, delta) {
  if (!text || delta === 0) return text;
  
  // Cerca stringhe racchiuse tra [] che assomigliano ad accordi.
  // Es: [C], [Am], [F#m7], [G/B]
  return text.replace(/\[([A-G][#b]?[^\]]*)\]/g, (match, chord) => {
    return `[${transposeChord(chord, delta)}]`;
  });
}
