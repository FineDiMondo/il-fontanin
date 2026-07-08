# Piano di Test — Riallineamento main, CI/CD, Rollback, ADD-02

**Versione:** 1.0 · **Data:** 2026-07-08 · **Autore:** Claude (Fable)
**Riferimenti:** `docs/ROLLBACK.md`, `.github/workflows/*.yml` (bozze), `files AF claude/AT-CATALOGAZIONE-001-ADD-02*.md`, `claude-files/PR-riallineamento-main.md`
**Convenzione esiti:** ogni test si chiude PASS/FAIL con evidenza (output comando o screenshot) registrata in COORDINATION.md.

---

## Fase A — Pipeline CI (prerequisito di tutto il resto)

| ID | Test | Procedura | Esito atteso |
|---|---|---|---|
| A1 | Attivazione ci.yml | Push del branch con `.github/workflows/ci.yml` | Workflow visibile e in esecuzione nella tab Actions |
| A2 | Job frontend | Automatico nel run A1 | `npm ci --include=dev` + `npm run build` verdi |
| A3 | Job backend con Postgres di servizio | Automatico nel run A1 | `create_catalogo_tables.py` crea schema+seed; `pytest tests/` verde (oggi: 40 passed 2 skipped come riferimento locale) |
| A4 | CI fallisce quando deve | Branch temporaneo con un test rotto ad arte, push, verifica rosso, cancella branch | Run FAIL — dimostra che il gate non è decorativo |
| A5 | Status check su PR | Aprire/aggiornare la PR di riallineamento | Il check CI compare sulla PR |

**Nota A3:** la CI NON usa `alembic upgrade head` — la baseline `f308e9f0394c` contiene DROP di tabelle estranee (vedi Fase C0 e ROLLBACK.md §5). Finché la baseline non è ripulita, lo schema in CI si crea con `create_catalogo_tables.py`.

## Fase B — Riallineamento main

| ID | Test | Procedura | Esito atteso |
|---|---|---|---|
| B1 | Sincronizzazione remoto | `git push origin feature/algorand-wallet-mpc` | Branch remoto = locale (`7cd1555`) |
| B2 | PR aggiornata | Incollare `claude-files/PR-riallineamento-main.md` nella draft PR | Descrizione riflette il changelog reale |
| B3 | Merge | Merge-commit (NO squash) dopo review Daniel + CI verde | `main` contiene i 31 commit |
| B4 | Tag release | `git tag v1.2.0-competenze && git push origin v1.2.0-competenze` su main post-merge | Tag presente; NON deve triggerare deploy-production finché l'Environment non è configurato (verificare!) |
| B5 | Protezione main | Configurare branch protection DOPO B3 | Push diretto su main rifiutato; PR senza CI verde non mergiabile; include administrators attivo |
| B6 | Chiusura branch | Cancellare `feature/algorand-wallet-mpc` remoto | Branch assente; lavoro futuro su `develop`/`feature/*` corti |

## Fase C — Database: baseline e rollback

### C0 — Verifica baseline Alembic (URGENTE, prima di ogni altro uso di Alembic)

| ID | Test | Procedura | Esito atteso |
|---|---|---|---|
| C0a | Stato revisione in produzione | `alembic current` contro il DB di produzione | Documentare la revisione corrente |
| C0b | Le tabelle DAW esistono ancora? | `psql: \dt` su `jackass_verona` cercando `tracks`, `clips`, `midi_notes`, `timelines`, `projects` | **Se assenti e prima esistevano**: la baseline è stata ESEGUITA (upgrade) e le ha droppate → incidente da segnalare a Daniel, valutare ripristino da backup. **Se presenti**: la baseline è stata `stamp`-ata o mai eseguita → OK, ma va ripulita prima di usarla altrove |
| C0c | Pulizia baseline | Riscrivere `f308e9f0394c` senza i DROP estranei (solo no-op o creazione schema proprio) | `alembic upgrade head` su DB vuoto funziona; prerequisito per usare Alembic in CI |

### C1 — Test rollback (SOLO su staging/copia, MAI produzione)

| ID | Test | Procedura | Esito atteso |
|---|---|---|---|
| C1a | Copia DB | `pg_dump` produzione → restore su DB di test (ROLLBACK.md §5 passi 1-2) | Restore senza errori |
| C1b | Downgrade Competenze | Su copia: `alembic downgrade -1` → `alembic current` | Revisione = `f308e9f0394c`; tabelle `competenza_*` assenti; TUTTE le altre tabelle intatte |
| C1c | Re-upgrade | Su copia: `alembic upgrade head` | Tabelle `competenza_*` ricreate vuote |
| C1d | Rollback Cloud Run | Su servizio staging: deploy revisione nuova → `update-traffic` alla precedente (ROLLBACK.md §3) | Traffico 100% su revisione precedente in <1 min; `/community/health` → 200 |
| C1e | Rollback Hosting | Su canale staging: deploy → `firebase hosting:rollback` (o rideploy canale precedente) | Versione precedente servita |
| C1f | Sicurezza post-rollback | Dopo C1d: `GET /community/catalogo/schede?stato=bozza` con socio non-autore | `[]` HTTP 200 — il rollback non deve riaprire il bug delle bozze (ROLLBACK.md §8.2) |

## Fase D — ADD-02 (solo dopo conferma Daniel su AF-ADD-02 Parte 3)

### D1 — Backend (`tests/test_catalogo_evidenza.py`, automatici in CI)

| ID | Test | Esito atteso |
|---|---|---|
| D1a | Approvazione senza `evidenza_livello` | 422 (regressione — già implementato in `catalogo.py:328`) |
| D1b | Approvazione livello C senza `evidenza_fonte` | 422 |
| D1c | Approvazione livello C con fonte | 200, stato `pubblicato` |
| D1d | Approvazione livello L senza fonte | 200 (fonte non richiesta per L) |
| D1e | `evidenza_livello: "X"` in create/update | 422 (vincolo Literal) |
| D1f | `update_catalogo_schemas.py` eseguito 2 volte | Idempotente: secondo run senza errori, schemi identici |

### D2 — Frontend (checklist manuale, staging)

| ID | Test | Esito atteso |
|---|---|---|
| D2a | Select livelli | Etichette "C - Certo / D - Documentato / I - Indiretto / L - Leggenda", testo aiuto contestuale |
| D2b | Renderer generico: categoria Idrico | 4 campi da schema; `tipo_elemento` e `acqua_presente` obbligatori bloccano il submit se vuoti |
| D2c | Renderer: tutti i 4 tipi campo | testo→input, numero→input numerico, scelta→select con opzioni, booleano→checkbox |
| D2d | Parità Monumenti Cristiani | Stessi campi di prima (dedicazione, stato_conservazione) ora via renderer generico |
| D2e | Badge colore | C verde, D azzurro, I ambra, L viola — visibili su scheda, lista, popup mappa |
| D2f | RTL | Form e badge corretti in ar e ur |
| D2g | Scheda esistente riaperta | `metadata_specifici` vecchi non conformi non rompono il form; chiavi coincidenti ripopolate |

## Fase E — Verifica post-deploy produzione (ogni release, da ROLLBACK.md §8)

1. `GET <backend>/community/health` → 200
2. `GET /community/catalogo/schede?stato=bozza` con socio non-autore/non-validatore → `[]`
3. Login + percorso utente completo su `el-fontanin.web.app` (finestra anonima)
4. Registrazione esito in COORDINATION.md (data, versione, esito, chi)

---

## Ordine di esecuzione e dipendenze

```
A (CI) ──→ B (riallineamento) ──→ B5 (protezione main)
C0 (baseline) — URGENTE, indipendente, prima di qualsiasi uso di Alembic
C1 (rollback) — richiede staging (deploy-staging.yml attivo o ambiente manuale)
D (ADD-02) — solo dopo conferma Daniel; i test D1 entrano in CI
E — a ogni deploy, per sempre
```
