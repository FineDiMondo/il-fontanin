# AF-CATALOGAZIONE-001-ADD-02 — Livelli di Certezza C/D/I/L e Metadata Schema delle 6 Categorie

**Stato:** PROPOSTA — richiede conferma di Daniel prima dell'implementazione
**Data:** 2026-07-08 · **Autore:** Claude (Fable) · **Aggiorna:** AF-CATALOGAZIONE-001 Sez. 4/5, ADD-01
**Prerequisito dichiarato nel GO del 2026-07-07:** questi due punti vanno chiusi prima della pubblicazione reale delle schede (non bloccano lo sviluppo del motore, già in corso).

---

## Parte 1 — Livelli di certezza C/D/I/L

### 1.1 Stato attuale nel codice

- `catalogo_schede.evidenza_livello` = `String(1)`, valori attesi `C|D|I|L`, oggi senza semantica definita.
- `CatalogForm.jsx` (righe 274-282): select con `C - (Da definire)`, `D - (Da definire)`, `I - (Da definire)`, `L - Leggenda`.
- Unica decisione già presa (Daniel, 2026-07-07): **L = Leggenda**, con colore UI distinto per gli elementi non dimostrati scientificamente.

### 1.2 Definizioni proposte

Il criterio ordinatore è la **qualità della fonte**, non la convinzione del compilatore. Il modello di riferimento è lo standard di analisi delle fonti usato in ricerca storica e genealogica (fonte primaria/secondaria, evidenza diretta/indiretta — il framework alla base del Genealogical Proof Standard), adattato a una scala a 4 valori per uso da parte di volontari non specialisti.

| Sigla | Nome | Definizione operativa | Test pratico per il compilatore |
|---|---|---|---|
| **C** | **Certo** | Fonte **primaria** verificabile: documento ufficiale, atto notarile o catastale, iscrizione datata sul manufatto, fotografia datata e attribuibile, rilievo diretto tuttora riscontrabile sul posto. | "Posso mostrare il documento o l'oggetto stesso a chi me lo chiede?" |
| **D** | **Documentato** | Fonte **secondaria** attendibile: pubblicazione storica, studio accademico, archivio di un ente (parrocchia, consorzio, comune), corroborata da **almeno una fonte indipendente**. Il fatto è riportato, non osservato direttamente. | "Qualcuno di affidabile l'ha scritto, e non è l'unico a dirlo?" |
| **I** | **Indiretto** | **Deduzione ragionevole da indizi**: tradizione orale corroborata da più testimoni indipendenti, analogia stilistica, datazione per contesto, toponomastica. Plausibile ma non provato. | "Non ho un documento, ma più indizi indipendenti puntano nella stessa direzione." |
| **L** | **Leggenda** | Tradizione popolare **senza riscontro documentale**. Ha valore culturale e va catalogata, ma dichiarata come tale. *(Già deciso da Daniel.)* | "È una storia che si racconta, e va conservata come storia." |

### 1.3 Regole di applicazione

1. **Si classifica la singola affermazione, al livello della scheda si registra il livello complessivo più rappresentativo.** Se una scheda mescola fatti certi e leggende (caso tipico), il campo `descrizione`/`cronologia_storica` può citare entrambi, ma `evidenza_livello` riflette il nucleo identificativo della scheda (esistenza, localizzazione, natura dell'oggetto). Le parti leggendarie vanno segnalate nel testo.
2. **`evidenza_fonte` obbligatoria per C e D** (a livello di validazione, non di bozza): un "Certo" senza fonte citata non è verificabile e il Validatore lo declassa o chiede integrazione. Per I è raccomandata (chi sono i testimoni/quali indizi); per L può restare vuota.
3. **Il livello è contendibile al ribasso e promuovibile al rialzo**: il Validatore può declassare (C→D→I→L) motivando in `nota_validazione`; la promozione richiede nuova fonte registrata in `evidenza_fonte`.
4. **Default della select**: resta "Non specificato" (`NULL`) in bozza; alla **pubblicazione** il livello diventa obbligatorio. (Nuova regola di validazione da aggiungere all'endpoint di pubblicazione — oggi non esiste.)

### 1.4 Implicazioni UI (da riportare nell'AT)

- Select aggiornata: `C - Certo`, `D - Documentato`, `I - Indiretto`, `L - Leggenda`, con tooltip/testo di aiuto che riporta il "test pratico" della tabella 1.2.
- Colori proposti (coerenti con la richiesta di Daniel di distinguere L): C = verde, D = azzurro, I = ambra, **L = viola** — L deve essere visivamente "altra cosa", non un gradino della stessa scala. Badge visibile su scheda, lista e popup mappa.
- Le chiavi i18n vanno aggiunte per tutte le 8 lingue (`src/locales/*`), incluse le descrizioni brevi.

---

## Parte 2 — `metadata_schema` delle 6 categorie

### 2.1 Stato attuale nel codice

- Seed in `create_catalogo_tables.py`: le 6 categorie esistono con `{"campi": []}` (vuoto); solo `monumenti-cristiani` ha campi reali. Formato consolidato: `{"campi": [{"chiave", "tipo", "opzioni"?, "obbligatorio"}]}`.
- **Gap implementativo da segnalare all'AT:** `CatalogForm.jsx` non ha un renderer generico da `metadata_schema` — i campi di monumenti-cristiani sono hardcoded (`MonumentiCristianiFields`, riga 265). Popolare gli schemi delle 6 categorie è inutile finché il renderer generico non esiste. I due lavori vanno fatti insieme.
- **Nota sul seed:** lo script salta le categorie già esistenti, quindi aggiornare i JSON nel file non aggiorna il DB di produzione — serve uno script/migrazione di UPDATE dedicato.

### 2.2 Tipi di campo

Tipi minimi per il renderer generico: `testo`, `numero`, `scelta` (con `opzioni`), `booleano`. (`testo` e `scelta` sono già usati dal seed esistente; `scelta_singola`/`scelta_multipla`/`scala` esistono nel pattern di Research/Competenze ma qui non servono per il pilot.)

### 2.3 Schemi proposti (formato seed, pronti per il copy-in)

Principio: **pochi campi, quelli che un volontario sul posto può realisticamente compilare**; tutto il resto va in `descrizione`. Obbligatorio solo ciò che identifica l'oggetto.

```python
{"codice": "idrico", "nome": "Idrico", "schema": {"campi": [
    {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["risorgiva", "fontanile", "roggia", "fosso", "pozzo", "lavatoio", "altro"], "obbligatorio": True},
    {"chiave": "acqua_presente", "tipo": "booleano", "obbligatorio": True},
    {"chiave": "uso_storico", "tipo": "testo", "obbligatorio": False},
    {"chiave": "ente_gestore", "tipo": "testo", "obbligatorio": False}
]}},
{"codice": "naturale", "nome": "Naturale", "schema": {"campi": [
    {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["albero_monumentale", "filare", "siepe_storica", "prato_stabile", "bosco", "altro"], "obbligatorio": True},
    {"chiave": "specie", "tipo": "testo", "obbligatorio": False},
    {"chiave": "eta_stimata_anni", "tipo": "numero", "obbligatorio": False},
    {"chiave": "vincolo_paesaggistico", "tipo": "booleano", "obbligatorio": False}
]}},
{"codice": "storico", "nome": "Storico", "schema": {"campi": [
    {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["corte_rurale", "villa", "castello", "cippo_confine", "manufatto", "sito", "altro"], "obbligatorio": True},
    {"chiave": "periodo_storico", "tipo": "scelta", "opzioni": ["pre_romano", "romano", "medievale", "veneziano", "ottocento", "novecento", "ignoto"], "obbligatorio": True},
    {"chiave": "evento_associato", "tipo": "testo", "obbligatorio": False},
    {"chiave": "stato_conservazione", "tipo": "scelta", "opzioni": ["buono", "discreto", "degradato", "scomparso"], "obbligatorio": False}
]}},
{"codice": "culturale", "nome": "Culturale", "schema": {"campi": [
    {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["tradizione", "festa_ricorrenza", "luogo_di_ritrovo", "gioco_tradizionale", "dialetto_toponimo", "altro"], "obbligatorio": True},
    {"chiave": "periodicita", "tipo": "scelta", "opzioni": ["annuale", "stagionale", "occasionale", "scomparsa"], "obbligatorio": False},
    {"chiave": "ancora_praticata", "tipo": "booleano", "obbligatorio": True}
]}},
{"codice": "economico", "nome": "Economico", "schema": {"campi": [
    {"chiave": "tipo_attivita", "tipo": "scelta", "opzioni": ["mulino", "filanda", "fornace", "caseificio", "bottega", "osteria", "mercato", "altro"], "obbligatorio": True},
    {"chiave": "periodo_attivita", "tipo": "testo", "obbligatorio": False},
    {"chiave": "proprieta_storica", "tipo": "testo", "obbligatorio": False},
    {"chiave": "attiva_oggi", "tipo": "booleano", "obbligatorio": True}
]}},
{"codice": "militare", "nome": "Militare", "schema": {"campi": [
    {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["fortificazione", "trincea", "caserma", "polveriera", "cippo_militare", "rifugio", "altro"], "obbligatorio": True},
    {"chiave": "conflitto_periodo", "tipo": "scelta", "opzioni": ["pre_unitario", "risorgimento", "prima_guerra", "seconda_guerra", "guerra_fredda", "ignoto"], "obbligatorio": True},
    {"chiave": "stato_conservazione", "tipo": "scelta", "opzioni": ["buono", "discreto", "degradato", "scomparso"], "obbligatorio": False}
]}},
```

Note trasversali: `tipo_elemento` obbligatorio ovunque fa da sottocategoria di fatto (le `catalogo_sottocategorie` formali possono arrivare dopo, quando l'uso reale mostrerà quali servono); i campi legati al Canzoniere (Culturale) restano un collegamento futuro, non un campo; le etichette visibili all'utente derivano dalle `chiavi` via i18n, non vanno hardcodate.

---

## Parte 3 — Checklist decisionale per Daniel

| # | Decisione | Proposta in questo documento | Confermi? |
|---|---|---|---|
| 1 | Semantica C/D/I | C=Certo (fonte primaria), D=Documentato (fonte secondaria corroborata), I=Indiretto (deduzione da indizi) | ☐ |
| 2 | Fonte obbligatoria per C e D alla validazione | Sì (§1.3.2) | ☐ |
| 3 | Livello obbligatorio alla pubblicazione, NULL ammesso in bozza | Sì (§1.3.4) | ☐ |
| 4 | Colori badge: C verde, D azzurro, I ambra, L viola | Sì (§1.4) | ☐ |
| 5 | Schemi delle 6 categorie come da §2.3 | Sì, eventualmente con tue modifiche puntuali | ☐ |
| 6 | Renderer generico da `metadata_schema` come prerequisito (al posto di componenti hardcoded per categoria) | Sì (§2.1) — da inserire nel prossimo ciclo AT→dev | ☐ |

Dopo la conferma: aggiornare il seed + script di UPDATE per il DB esistente, aggiornare `CatalogForm.jsx` (select C/D/I/L, renderer generico, badge colore), aggiungere chiavi i18n nelle 8 lingue, aggiungere la regola di validazione alla pubblicazione.
