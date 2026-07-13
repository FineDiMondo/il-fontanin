# WORK ORDER — AT-STRUTTURA-006 (Draft Parallelo)
## Incarico identico per 3 agenti indipendenti: Haiku/Cowork, Codex, Antigravity/Gemini

| Campo | Valore |
|---|---|
| Basato su | AF-STRUTTURA-006_Riorganizzazione-9-Regni-Yggdrasil.md (commit `6f2f7ee`, branch `develop`) |
| Peer review AF | Completa — Antigravity/Gemini APPROVATO, Codex APPROVATO CON RISERVE→RISOLTE (vedi log nel documento) |
| Modalità | 3 draft indipendenti, prodotti SENZA vedersi a vicenda, poi sintesi a cura di Claude |
| Vincolo AGENTS.md | Nessuna modifica a codice in questa fase — solo documento. Ognuno scrive esclusivamente il proprio file, nessun conflitto R1 possibile. Check-in/out comunque da registrare (R2), stato READING/WRITING sul solo file di propria competenza |

---

## Cosa produrre

Un'Analisi Tecnica completa per AF-STRUTTURA-006, seguendo lo stesso livello di dettaglio e lo stesso formato già usato in `AT-CATALOGAZIONE-001_Motore-Catalogazione-Territoriale.md` (schema dati concreto, non solo descrizione — modelli SQLAlchemy, endpoint, struttura componenti React).

**File di output**: `files AF claude/AT-STRUTTURA-006-DRAFT-<NOME-AGENTE>.md`
(es. `AT-STRUTTURA-006-DRAFT-HAIKU.md`, `AT-STRUTTURA-006-DRAFT-CODEX.md`, `AT-STRUTTURA-006-DRAFT-ANTIGRAVITY.md`)

## Baseline tecnica reale (non riprogettare da zero — verificare nel codebase)

- Stack: FastAPI + SQLAlchemy + PostgreSQL (`community_module`) — non Firestore, coerente con AT-CATALOGAZIONE-001 e AT-COMPETENZE-002
- RBAC reale a 3 valori: `guest` / `socio` / `admin` (i ruoli funzionali Visitatore/Membro/Validatore/Amministratore dell'AF vanno mappati su questi 3, non introdotti come nuovi ruoli tecnici)
- Mappa: `react-leaflet@4` già installato e in uso in `src/pages/Mappa.jsx` — riusare, non sostituire
- Catalogo esistente: 7 categorie tecniche (`idrico`, `naturale`, `storico`, `culturale`, `economico`, `militare`, `monumenti-cristiani`) in `catalogo_categorie`/`catalogo_sottocategorie`

## Perimetro da coprire (rispecchia §10 di AF-STRUTTURA-006)

1. Struttura di routing per la nuova Home (griglia 9 regni) e per il livello Yggdrasil trasversale
2. Meccanismo tecnico di filtro categoria sulla vista catalogo esistente, basato sulla mappa funzionale `regno_codice -> catalogo_categorie.codice[]` (schema di questa mappa: tabella dedicata, oppure config statica versionata — motivare la scelta)
3. Schema della relazione N:N Eventi↔Schede di catalogo (tabella di join SQLAlchemy), incluso il cambio RBAC dichiarato (Membro propone evento in bozza, Admin valida/pubblica) e la resa in mappa a marker multipli per eventi multi-scheda
4. Piano di redirect per le route esistenti (Step 5 della migrazione a step): elenco vecchia-route → nuova-route, meccanismo tecnico (redirect client-side React Router vs lato server)
5. Elenco esplicito di ogni punto che l'AT non può risolvere autonomamente e che richiede decisione di Daniel

## Cosa NON fare in questo step

- Nessuna modifica di codice, nessun commit su `develop` oltre al proprio file di draft
- Nessuna assunzione silenziosa sui punti aperti della sezione 9 dell'AF: se un punto resta aperto, va segnalato esplicitamente nel draft, non deciso autonomamente
- Non guardare gli altri due draft prima di consegnare il proprio (indipendenza dei tre draft è il punto del metodo)

## Dopo i 3 draft

Claude/Cowork legge i tre `AT-STRUTTURA-006-DRAFT-*.md`, sintetizza il meglio di ciascuno in `AT-STRUTTURA-006.md` (finale), segnala a Daniel eventuali contraddizioni tra i tre draft che richiedono una decisione, poi procede secondo il processo standard (validazione Claude → sviluppo Gemini/Antigravity).
