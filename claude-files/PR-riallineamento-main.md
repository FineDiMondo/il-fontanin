# Descrizione PR di riallineamento — `feature/algorand-wallet-mpc` → `main`

> Testo pronto da incollare nella draft PR esistente su GitHub. Aggiornato al 2026-07-08 (HEAD = `7cd1555`, 31 commit avanti rispetto a `main`).

---

## Titolo proposto

`Riallineamento main: moduli Catalogazione/Competenze/Canzoniere/Ricettario, fix sicurezza catalogo, infrastruttura Alembic`

## Descrizione

### Perché questa PR

`main` non riflette più la produzione: il deploy live (backend Cloud Run `finedimondo-backend` rev. `00017-hmv`, frontend `el-fontanin.web.app`) è fatto da questo branch, avanti di 31 commit. Questa PR riporta `main` allo stato reale e chiude il ciclo: dopo il merge, `main` va protetto e il branch chiuso (vedi "Dopo il merge").

### Moduli nuovi

- **Motore di Catalogazione Territoriale** (`62a5dad`, AT-CATALOGAZIONE-001): tabelle Postgres `catalogo_categorie/sottocategorie/schede/media`, router FastAPI `/community/catalogo/*`, `CatalogForm.jsx` + mappa, seed 7 categorie (Monumenti Cristiani + 6 nuove con schema da definire).
- **Sistema Competenze** (`f2420d3`, AT-COMPETENZE-002): tabelle `competenza_domini`/`competenza_utente`, endpoint `/community/competenze/*`, sezione profilo frontend. Feature flag `VITE_ENABLE_COMPETENZE_FEATURE` = OFF in tutti gli env.
- **Canzoniere e Ricettario** (`92974e8`, AT-CANZONIERE-003 / AT-RICETTARIO-004): DB + API + UI (editor frontend ancora placeholder).
- **Galleria Media** (`cfba7a0`): integrazione Google Drive, Firestore rules, feature flags.
- **Tool experimental Lavori** (`d36872b`): Argini e Scalette.

### Sicurezza

- **Fix GET /schede** (`a945aa0`): le bozze erano visibili a qualunque utente autenticato; ora autorizzazione a livello di query SQL (autore/validatore/admin). Verifica post-deploy in produzione superata il 07/07.
- **Test di regressione reale** (`7cd1555`): `tests/test_catalogo_security.py` esercita l'endpoint via TestClient; sostituisce `verify_security_fix.py` (grep travestito da test, rimosso).

### Infrastruttura e fix

- **Alembic** introdotto: baseline `f308e9f0394c` + migrazione Competenze `44370175c503` (downgrade verificata reale). ⚠️ Vedi nota sotto sulla baseline.
- **Line endings normalizzati** (`a945aa0`): `.gitattributes` `text=lf`, `core.autocrlf false`.
- **Secret Manager** per la password DB in Cloud Build (`18851d3`, `c921f79`).
- **Config allineate** (`42c7644`): ASA ID, user_id Bar, SocioRoute Chat, category_id forum.
- Fix vari: crash homepage stemmi (`d4cab15`), DetachedInstanceError forum (`2cc0d1f`), usabilità forum/catalogo/i18n (`9bc0bc3`), stemmi comuni (`a56ef46`), aggiornamento firebase v12.15.0 (`b044ee5`).

### Documentazione

- AF/AT del ciclo Catalogazione/Competenze + addendum acquisizione mobile (`bad7ee9`), documentazione Comune di Villafranca (`d4490e0`), aggiornamenti AGENTS.md/COORDINATION.md (check-out di sessione).

### ⚠️ Nota per i reviewer — baseline Alembic da ispezionare

La `upgrade()` di `f308e9f0394c` ("baseline") **droppa 13 tabelle estranee al progetto** (schema DAW: `tracks`, `clips`, `midi_notes`, `timelines`, `projects`, `users`, ecc.) presenti nel DB condiviso `jackass_verona`. Da chiarire prima del merge: (1) in produzione è stato eseguito `upgrade head` o `stamp`? (2) quelle tabelle esistono ancora? (3) la baseline va ripulita in modo che crei/registri solo lo schema di questo progetto. Non è un blocker per il riallineamento del codice, ma va tracciato come issue.

## Strategia di merge

**Merge commit, NON squash**: i commit sono già scoped (uno per finding/modulo) e vanno preservati per audit futuro. Dopo il merge, tag `v1.2.0-competenze` su `main` per marcare ufficialmente ciò che è già live.

## Checklist

- [ ] CI verde (quando `ci.yml` sarà attivo — bozza in questa PR o in PR successiva)
- [ ] Chiarita la questione baseline Alembic (issue aperta)
- [ ] Review di Daniel
- [ ] Merge con merge-commit
- [ ] Tag `v1.2.0-competenze` su main
- [ ] Cancellazione branch `feature/algorand-wallet-mpc`
- [ ] Attivazione protezione `main` (PR obbligatoria, 1 review, status check, no force-push, include administrators)

## Dopo il merge

Modello a tre livelli: `main` (protetto) → `develop` (integrazione) → `feature/*` (branch corti, uno per modulo, cancellati dopo il merge).
