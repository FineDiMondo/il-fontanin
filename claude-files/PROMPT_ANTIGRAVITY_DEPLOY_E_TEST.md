# Prompt per Gemini/Antigravity — Fase di deploy e test (riallineamento main + CI/CD + rollback + baseline)

> Da incollare ad Antigravity a inizio sessione. Preparato da Claude (Fable) il 2026-07-08.

---

Sei nella repo `D:\Progetti GCloud\fontanin`. In questa sessione esegui la fase di deploy e test del riallineamento. Tutto il lavoro di analisi è già fatto e committabile — tu esegui, verifichi e registri gli esiti.

## Regole vincolanti

1. **AGENTS.md R3**: ogni deploy (Cloud Run, Firebase Hosting, esecuzione script sul DB di produzione) richiede autorizzazione esplicita di Daniel NELLA SESSIONE. Fermati e chiedi prima di ciascuno.
2. **Registra ogni esito** (PASS/FAIL + evidenza) in COORDINATION.md, riga di check-out come da convenzione.
3. Il piano di test completo è `docs/TEST_PLAN_RIALLINEAMENTO_E_ADD-02.md` — usa gli ID (A1, C0b, ecc.) per riferirti ai test. Il runbook di rollback è `docs/ROLLBACK.md`.
4. **NON eseguire MAI `alembic upgrade` o `downgrade` sul DB di produzione in questa sessione** (vedi step 2 — la baseline è sospetta).

## Step 0 — Commit del lavoro preparatorio (nessun deploy)

Verifica `git status`: dovresti trovare non committati i file preparati da Fable:
`docs/ROLLBACK.md`, `docs/TEST_PLAN_RIALLINEAMENTO_E_ADD-02.md`, `.github/workflows/ci.yml`, `.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-production.yml`, `claude-files/PR-riallineamento-main.md`, `claude-files/PROMPT_ANTIGRAVITY_DEPLOY_E_TEST.md`, `files AF claude/AF-CATALOGAZIONE-001-ADD-02_*.md`, `files AF claude/AT-CATALOGAZIONE-001-ADD-02_*.md`.

Leggili prima di committare (in particolare i tre workflow — sei tu che li eseguirai). Se trovi errori, correggili e annotalo. Poi un commit per gruppo logico:
- `docs: runbook rollback + piano di test riallineamento`
- `ci: bozze workflow ci/deploy-staging/deploy-production (non attivi, vedi commenti)`
- `docs(AF/AT): ADD-02 livelli certezza C/D/I/L e metadata_schema (PROPOSTA, attende conferma Daniel)`

## Step 1 — URGENTE: verifica baseline Alembic (test C0, nessuna modifica al DB)

La `upgrade()` di `alembic/versions/f308e9f0394c_baseline.py` contiene `DROP` di 13 tabelle estranee al progetto (schema DAW: `tracks`, `clips`, `midi_notes`, `timelines`, `projects`, `users`, `effects`, `automations`, `color_grades`, `change_log`, `daw_sync_metadata`, `daw_id_mapping`, `ai_analysis_log`) che convivono in `jackass_verona`.

a. `alembic current` contro produzione → annota la revisione (C0a).
b. Con psql/query di sola lettura: verifica se le tabelle DAW esistono ancora (C0b).
c. **Se sono sparite**: incidente — fermati, riporta a Daniel, valutate insieme il ripristino da backup. **Se ci sono**: la migrazione Competenze è probabilmente stata applicata con `stamp`+SQL manuale o le tabelle create in altro modo — documenta come, e proponi la pulizia della baseline (C0c) come issue separata, NON eseguirla ora.

## Step 2 — Sincronizzazione e CI (test A, B1)

a. `git push origin feature/algorand-wallet-mpc` (B1).
b. Il push attiva `ci.yml` → verifica Actions: job frontend e backend verdi (A1-A3). Il job backend usa Postgres di servizio e crea lo schema con `create_catalogo_tables.py` — NON con Alembic, motivo nei commenti del file.
c. Test del fallimento (A4): branch usa-e-getta con un assert rotto, push, verifica FAIL, cancella il branch.
d. Se la CI fallisce per problemi d'ambiente (versioni, dipendenze mancanti in `requirements_community.txt`, ecc.): correggi nel workflow o nei requirements, commit, ri-push. Annota ogni correzione.

## Step 3 — PR di riallineamento (test B2-B3)

a. Apri/aggiorna la draft PR `feature/algorand-wallet-mpc` → `main` incollando il testo di `claude-files/PR-riallineamento-main.md` (B2).
b. Verifica che il check CI compaia sulla PR (A5).
c. **CHECKPOINT DANIEL**: review e merge sono suoi. Merge con **merge-commit, NON squash**. (B3)
d. Dopo il merge: tag `v1.2.0-competenze` su main e push del tag (B4). ⚠️ Prima verifica che l'Environment "production" NON sia ancora configurato o che `deploy-production.yml` non parta — il tag NON deve produrre un deploy in questa fase; se il workflow parte, cancellane il run e annota.

## Step 4 — Protezione main e igiene branch (test B5-B6)

Solo DOPO il merge: branch protection su `main` (PR obbligatoria, 1 review, status check CI richiesto, branch aggiornato, include administrators, no force-push, no delete). Verifica con un push diretto di prova → deve essere rifiutato (B5). Poi cancella `feature/algorand-wallet-mpc` remoto (B6) e crea `develop` da `main`.

## Step 5 — Staging e test di rollback (test C1) — richiede autorizzazione Daniel

a. Crea il servizio staging `finedimondo-backend-staging` (stessa immagine, min-instances=0) e/o attiva `deploy-staging.yml` dopo aver configurato i secrets WIF. Se WIF non è pronto, staging manuale via `gcloud` è accettabile per questa sessione.
b. Copia del DB: `pg_dump` produzione → restore su DB di test (C1a). Mai lavorare sul DB di produzione.
c. Esegui C1b-C1c (downgrade/upgrade Alembic SULLA COPIA) e C1d-C1f (rollback Cloud Run e Hosting su staging), procedure esatte in `docs/ROLLBACK.md` §3-§5.
d. Il test C1f è il più importante: dopo un rollback backend, `GET /community/catalogo/schede?stato=bozza` con socio non-autore deve restituire `[]` — un rollback non deve mai riaprire il bug di sicurezza.

## Step 6 — Vercel (solo verifica, nessuna cancellazione)

COORDINATION.md dice che il redirect permanente da Vercel è attivo. Verifica cosa fa oggi quel redirect (quale dominio, verso dove, se ha traffico). NON cancellare nulla: riporta i fatti a Daniel, la rimozione è una sessione separata.

## Step 7 — ADD-02: NON implementare

`files AF claude/AF-CATALOGAZIONE-001-ADD-02` e la relativa AT sono in stato PROPOSTA: attendono la conferma di Daniel sulla checklist (AF, Parte 3). Non toccare seed, form o schemi in questa sessione.

## Report finale richiesto

Tabella con: ID test → PASS/FAIL/SKIPPED → evidenza. Più: esito verifica baseline (step 1), correzioni fatte ai workflow, stato secrets/WIF mancanti, e la riga di check-out in COORDINATION.md.
