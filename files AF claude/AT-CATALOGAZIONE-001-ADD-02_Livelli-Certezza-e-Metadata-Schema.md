# AT-CATALOGAZIONE-001-ADD-02 — Livelli di Certezza C/D/I/L e Metadata Schema delle 6 Categorie

**Stato:** BOZZA — implementabile solo DOPO conferma di Daniel su AF-CATALOGAZIONE-001-ADD-02 (checklist Parte 3)
**Data:** 2026-07-08 · **Autore:** Claude (Fable) · **Implementa:** AF-CATALOGAZIONE-001-ADD-02
**Verificato contro il codice reale** di `D:\Progetti GCloud\fontanin` (HEAD `7cd1555`).

---

## 1. Stato attuale del codice (verificato)

| Elemento | Dove | Stato |
|---|---|---|
| `evidenza_livello` | `community_models.py:505` — `String(1)`, commento `'C'\|'D'\|'I'\|'L'` | Esiste, nessun vincolo sui valori |
| Select C/D/I/L | `src/components/catalogo/CatalogForm.jsx:274-282` | Esiste, etichette "(Da definire)" per C/D/I |
| Obbligo livello alla pubblicazione | `community_module/api/catalogo.py:327-329` (`valida_scheda`) | **GIÀ IMPLEMENTATO** — 422 se `evidenza_livello` assente all'approvazione |
| Obbligo fonte per C/D | — | NON esiste |
| `metadata_schema` 6 categorie | `create_catalogo_tables.py:38-43` | Seed con `{"campi": []}` vuoti |
| Renderer generico da `metadata_schema` | — | NON esiste: `CatalogForm.jsx:265-267` monta `MonumentiCristianiFields` hardcoded solo per `codice === 'monumenti-cristiani'` |
| Vincolo Pydantic sui valori | `schemas.py:516,531` — `evidenza_livello: Optional[str]` | Nessun vincolo, accetta qualsiasi stringa |

## 2. Interventi backend

### 2.1 Vincolo valori (schemas.py)
In `CatalogoSchedaBase` e `CatalogoSchedaUpdate` sostituire `Optional[str]` con:

```python
from typing import Literal
evidenza_livello: Optional[Literal["C", "D", "I", "L"]] = None
```

### 2.2 Fonte obbligatoria per C/D alla validazione (catalogo.py)
In `valida_scheda`, dopo il check esistente su `evidenza_livello` (riga 328):

```python
if payload.approvata:
    if not scheda.evidenza_livello:
        raise HTTPException(status_code=422, detail="evidenza_livello obbligatorio per approvare")
    if scheda.evidenza_livello in ("C", "D") and not (scheda.evidenza_fonte or "").strip():
        raise HTTPException(status_code=422, detail="evidenza_fonte obbligatoria per livelli C e D")
```

Nessuna modifica a `create_scheda`/`update_scheda`: in bozza tutto resta facoltativo (AF §1.3.4).

### 2.3 Nessuna migrazione Alembic necessaria
Nessuna colonna nuova. I `metadata_schema` sono dati, non schema: si aggiornano con lo script §3.

## 3. Aggiornamento dati: `update_catalogo_schemas.py` (nuovo, root repo)

`create_catalogo_tables.py` salta le categorie esistenti, quindi NON aggiorna il DB di produzione. Serve uno script di UPDATE idempotente:

```python
# Aggiorna metadata_schema delle categorie esistenti (idempotente, ri-eseguibile).
# I 6 JSON sono in AF-CATALOGAZIONE-001-ADD-02 §2.3 — copiarli qui letteralmente.
SCHEMA_UPDATES = { "idrico": {...}, "naturale": {...}, "storico": {...},
                   "culturale": {...}, "economico": {...}, "militare": {...} }

for codice, schema in SCHEMA_UPDATES.items():
    cat = session.query(CatalogoCategoria).filter_by(codice=codice).first()
    if cat:
        cat.metadata_schema = schema
        print(f"Aggiornata {codice}")
session.commit()
```

Allineare anche `SEED_CATEGORIE` in `create_catalogo_tables.py` con gli stessi JSON (per installazioni da zero e per la CI). **Fonte unica:** i JSON di AF-ADD-02 §2.3; i due file devono restare identici.

## 4. Interventi frontend

### 4.1 Select C/D/I/L (`CatalogForm.jsx:277-281`)
Sostituire le opzioni con etichette da i18n (vedi §5): `C - Certo`, `D - Documentato`, `I - Indiretto`, `L - Leggenda`. Sotto la select, testo di aiuto con il "test pratico" del livello selezionato (AF §1.2, chiavi i18n `catalogo.evidenza.help.C|D|I|L`).

### 4.2 Badge colore livello (nuovo componente `src/components/catalogo/EvidenzaBadge.jsx`)
Mappa colori (AF §1.4): `C`=verde, `D`=azzurro, `I`=ambra, `L`=viola (visivamente distinto, richiesta esplicita di Daniel). Usarlo in: scheda dettaglio, lista schede, popup mappa. Classi Tailwind già in uso nel progetto (`bg-green-*`, `bg-sky-*`, `bg-amber-*`, `bg-purple-*`).

### 4.3 Renderer generico (nuovo componente `src/components/catalogo/MetadataFields.jsx`)
Sostituisce il montaggio condizionale hardcoded di `CatalogForm.jsx:265-267`:

```jsx
<MetadataFields
  schema={selCategory?.metadata_schema}   // arriva già da GET /categorie (CatalogoCategoriaOut.metadata_schema)
  data={formData.metadata_specifici}
  onChange={handleMetadataChange}          // già esistente in CatalogForm
  readOnly={readOnly}
/>
```

Tipi da supportare (AF §2.2): `testo` → `<input type="text">`; `numero` → `<input type="number">`; `scelta` → `<select>` con `opzioni`; `booleano` → checkbox. `obbligatorio: true` → `required` + validazione client prima del submit. Etichette: chiave i18n `catalogo.campi.<chiave>` con fallback alla chiave umanizzata (underscore→spazi).

**Migrazione di `MonumentiCristianiFields`:** i suoi 2 campi sono già nel seed di `monumenti-cristiani`, quindi il componente hardcoded si elimina e anche quella categoria passa dal renderer generico. Verificare parità visiva prima di rimuoverlo.

### 4.4 Compatibilità dati esistenti
Schede già salvate con `metadata_specifici` non conformi al nuovo schema NON vanno migrate: il renderer mostra i campi dello schema e ignora chiavi sconosciute; i valori esistenti su chiavi coincidenti si ripopolano da soli.

## 5. i18n (8 lingue: it, en, ar, pt, es, hi, ur, ne)

Nuove chiavi in `src/locales/*.json`:

```
catalogo.evidenza.C = "Certo" / "Certain" / ...
catalogo.evidenza.D = "Documentato" / "Documented" / ...
catalogo.evidenza.I = "Indiretto" / "Indirect" / ...
catalogo.evidenza.L = "Leggenda" / "Legend" / ...
catalogo.evidenza.help.C|D|I|L = test pratico (AF §1.2)
catalogo.campi.<chiave> = etichette dei campi dei 6 schemi (≈25 chiavi) + opzioni delle scelte
```

Attenzione RTL (ar, ur): il badge colore deve funzionare in entrambe le direzioni (nessun posizionamento absolute left/right hardcoded).

## 6. Test richiesti (dettaglio in TEST_SPEC-ADD-02)

Backend (`tests/test_catalogo_evidenza.py`, nuovo): approvazione senza livello → 422 (regressione, già coperto dal codice); approvazione C senza fonte → 422; approvazione C con fonte → 200 `pubblicato`; approvazione L senza fonte → 200 (fonte non richiesta per L); `evidenza_livello: "X"` in create/update → 422 (Literal). Frontend: checklist manuale in TEST_SPEC (renderer per i 4 tipi, obbligatorietà, badge, RTL).

## 7. Checklist handoff sviluppo

1. ☐ Conferma di Daniel su AF-ADD-02 Parte 3 (bloccante)
2. ☐ `schemas.py`: Literal sui valori (§2.1)
3. ☐ `catalogo.py`: fonte obbligatoria C/D in `valida_scheda` (§2.2)
4. ☐ `update_catalogo_schemas.py` + allineamento `create_catalogo_tables.py` (§3)
5. ☐ `MetadataFields.jsx` generico + rimozione `MonumentiCristianiFields` (§4.3)
6. ☐ `EvidenzaBadge.jsx` + integrazione in form/lista/mappa (§4.2)
7. ☐ Select con etichette definitive + help (§4.1)
8. ☐ Chiavi i18n nelle 8 lingue (§5)
9. ☐ `tests/test_catalogo_evidenza.py` (§6)
10. ☐ Esecuzione `update_catalogo_schemas.py` in produzione = **deploy**: richiede autorizzazione Daniel (AGENTS.md R3)

## 8. Rischi

| Rischio | Mitigazione |
|---|---|
| Schede pubblicate prima di ADD-02 con livello C/D senza fonte | Il vincolo agisce solo alla validazione futura; nessun backfill. Report una-tantum delle schede esistenti in quello stato per revisione manuale |
| Rimozione `MonumentiCristianiFields` cambia la UI del pilot | Test di parità visiva prima del merge (§4.3) |
| Traduzioni mancanti in alcune lingue | Fallback i18next su `it`; le chiavi mancanti non bloccano il rilascio |
