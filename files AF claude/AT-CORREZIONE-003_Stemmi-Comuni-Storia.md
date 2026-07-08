# AT-CORREZIONE-003 — Analisi di Correzione
## Stemmi comunali scambiati (Povegliano Veronese / Vigasio) — pagina Storia

| Campo | Valore |
|---|---|
| Documento | AT-CORREZIONE-003 |
| Tipo | Correzione contenuti + codice (non nuova feature) |
| Autore | Claude |
| Data | 2026-07-07 |
| Stato | Correzione già applicata direttamente nei file del repo — da verificare, buildare e deployare |
| Destinatario | Gemini/Antigravity |
| File coinvolti | `src/components/StemmaComune.jsx`, `src/locales/it.json`, `src/locales/en.json` |

---

## 1. Sintesi del problema

Segnalato da Daniel: nella pagina Storia (`/storia`), gli stemmi mostrati per Povegliano Veronese e Vigasio erano scambiati. Il componente che disegnava "Povegliano" mostrava in realtà lo stemma di Vigasio (gambero, radice, stelle) e viceversa il componente "Vigasio" mostrava lo stemma con le 4 libellule, che appartiene a Povegliano.

Le forme vettoriali in sé erano corrette (riproduzioni fedeli di immagini fornite in precedenza da Daniel) — l'errore era solo nell'etichettatura, cioè quale forma veniva associata a quale comune.

## 2. Verifica delle fonti (Wikipedia + fonte ufficiale)

- **Povegliano Veronese** — Wikipedia IT, voce "Povegliano Veronese": *"L'acqua, da sempre presente nel territorio, suggerì l'adozione della libellula (volgarmente chiamata cavaoci o sbusaoci) quale simbolo sullo stemma comunale attualmente in uso."* Confermato: la libellula è il simbolo civico di Povegliano, non di Vigasio.
- **Vigasio** — Wikipedia IT, voce "Vigasio", riporta il blasone ufficiale (stemma e gonfalone concessi con **DPR 21 luglio 1965**): *"Di rosso, al gambero d'oro, montante, sinistrato da una radice pure di oro, fogliata di verde, con la punta rivolta in basso; il tutto accompagnato da cinque stelle (5) d'argento, disposte due in capo e tre in punta dello scudo."* Nessuna croce, nessuna libellula, nessun azzurro: campo rosso, gambero, radice, 5 stelle (non 6).

Fonti:
- [Povegliano Veronese – Wikipedia](https://it.wikipedia.org/wiki/Povegliano_Veronese)
- [Vigasio – Wikipedia](https://it.wikipedia.org/wiki/Vigasio)

## 3. Causa radice

In `StemmaComune.jsx` le due funzioni componente (disegno SVG) erano assegnate al comune sbagliato nella mappa `FIGURE`. Lo stesso errore si propagava nel testo narrativo di `it.json` ed `en.json`: la scheda di Vigasio conteneva la frase "le libellule dello stemma raccontano le sue acque", un'affermazione fattualmente errata attribuita al comune sbagliato. Inoltre lo stemma di Vigasio nel codice aveva 6 stelle disposte in 3 coppie simmetriche, mentre il blasone ufficiale ne prevede 5 (2 in capo, 3 in punta).

## 4. Correzione già applicata

**`src/components/StemmaComune.jsx`**
- La funzione che disegna croce d'argento + 4 libellule (campo azzurro) è ora chiamata `Povegliano()` ed è mappata a `FIGURE.povegliano`.
- La funzione che disegna gambero + radice + stelle (campo rosso) è ora chiamata `Vigasio()` ed è mappata a `FIGURE.vigasio`.
- Le stelle sono state corrette da 6 (3 coppie) a 5, disposte 2 in capo e 3 in punta, come da blasone ufficiale DPR 1965.
- Il commento JSDoc in testa al file è stato aggiornato con i blasoni corretti e una nota che spiega la correzione, per evitare che l'errore si ripeta in futuro.

**`src/locales/it.json` e `src/locales/en.json`** (chiave `storia.comuni`)
- Scheda di Povegliano: aggiunta la frase corretta sul legame tra le libellule dello stemma e le risorgive del paese.
- Scheda di Vigasio: rimossa la frase errata sulle libellule, sostituita con una menzione corretta dello stemma reale (gambero d'oro e cinque stelle d'argento); il tag `ruolo` di Vigasio è stato semplificato da "Acque e statuti antichi" a "Statuti antichi" per non veicolare più il riferimento acqua/libellule non pertinente.

Nessuna altra lingua (`ar`, `es`, `hi`, `pt`, `ur`, `ne`) contiene una scheda per Vigasio nella sezione Storia — solo `it` ed `en` hanno la sezione estesa a 5 comuni — quindi non richiedevano correzione.

## 5. Aggiunta richiesta da Daniel: nuovi comuni "da completare"

Aggiunte in `it.json` ed `en.json`, sezione `storia.comuni`, tre nuove voci con `"stemma": null` (placeholder già gestito da `Storia.jsx`: se `stemma` è `null` viene renderizzato un riquadro vuoto invece dell'icona, comportamento esistente, nessuna modifica al componente necessaria):
- **Erbè** — ruolo "Da completare"
- **Trevenzuolo** — ruolo "Da completare"
- **Nogara** — ruolo "Da completare"

Nessuno stemma né sintesi storica dettagliata: solo un segnaposto in coda alla lista comuni, coerente con la voce "Valeggio sul Mincio" già presente con `stemma: null`.

## 6. Cosa deve fare Gemini/Antigravity

1. `git pull`/verifica diff sui tre file elencati in Sez. 4-5 prima di procedere
2. `npm run build` (o equivalente) per assicurarsi che non ci siano errori di sintassi JSX/JSON introdotti dalle modifiche
3. Verifica visiva della pagina `/storia` in locale: Povegliano deve mostrare croce+libellule su campo azzurro, Vigasio deve mostrare gambero+radice+5 stelle su campo rosso; le tre nuove voci (Erbè, Trevenzuolo, Nogara) devono comparire in fondo alla lista con il riquadro placeholder vuoto, senza icona
4. Controllo incrociato lingua `it` vs `en`: stessa struttura, stesso numero di comuni (8), stesso ordine
5. Deploy su Firebase Hosting (`firebase deploy --only hosting --project el-fontanin`) solo dopo verifica visiva positiva

## 7. Punti aperti (non risolti da questo documento, decisione di Daniel)

- Le altre 6 lingue (`ar`, `es`, `hi`, `pt`, `ur`, `ne`) non hanno mai avuto la scheda Vigasio né i comuni estesi: se Daniel vuole portarle alla pari con `it`/`en` (compresi i tre nuovi comuni "da completare"), è un lavoro di traduzione aggiuntivo, non incluso qui
- Le tre nuove voci sono segnaposto puri: se Daniel vuole già ora un contenuto storico minimo per Erbè/Trevenzuolo/Nogara invece di "da completare", va fornito il materiale (nessuna fonte è stata cercata per questi tre comuni in questa sessione)
