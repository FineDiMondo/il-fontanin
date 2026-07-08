# Runbook di Rollback — Il Fontanin

**Versione:** 1.0 · **Data:** 2026-07-08 · **Owner:** Daniel Giardina
**Vincolo (AGENTS.md R3):** ogni rollback in produzione è un deploy a tutti gli effetti e richiede autorizzazione esplicita per-sessione di Daniel. Nessun agente lo esegue autonomamente.

---

## 1. Ambito e architettura

| Componente | Tecnologia | Identificatori reali |
|---|---|---|
| Backend API | Cloud Run | servizio `finedimondo-backend`, regione `europe-west1`, progetto GCP `freedomrun-491323` |
| Frontend | Firebase Hosting | progetto `el-fontanin`, sito `el-fontanin.web.app`, contenuto da `dist/` |
| DB relazionale | PostgreSQL (esterno, non gestito da Cloud Run) | db `jackass_verona`, migrazioni Alembic in `alembic/versions/` |
| DB documentale | Firestore | regole `firestore.rules`, indici `firestore.indexes.json` |

Il rollback di ciascun componente è **indipendente**: riportare indietro il backend NON riporta indietro il DB, e viceversa. Decidere sempre prima quali componenti sono coinvolti (§2).

---

## 2. Criteri di attivazione (decision matrix)

| Sintomo | Azione | Sezione |
|---|---|---|
| Regressione funzionale nel frontend (UI rotta, crash JS) | Rollback Hosting | §4 |
| Errori 5xx / regressione API dopo un deploy backend | Rollback Cloud Run | §3 |
| Regressione di **sicurezza** (es. dati esposti) | Rollback Cloud Run IMMEDIATO, poi analisi | §3 |
| Feature nuova difettosa ma isolata da feature flag | **Prima scelta: spegnere il flag**, non rollback | §6 |
| Migrazione DB errata o dati corrotti da nuova release | Alembic downgrade (con estrema cautela) | §5 |
| Regole Firestore troppo permissive/restrittive | Ripristino regole da git + `firebase deploy --only firestore:rules` | §7 |

**Regola generale:** rollback applicativo (Cloud Run/Hosting) è rapido e reversibile → soglia bassa. Rollback DB è distruttivo → soglia alta, solo dopo aver escluso alternative.

**Attenzione al caso misto:** se la release includeva una migrazione DB, il codice vecchio deve essere compatibile con lo schema nuovo. Le migrazioni finora sono solo additive (`CREATE TABLE`), quindi il rollback del solo backend è sicuro: il codice vecchio ignora le tabelle nuove. Verificare che resti così per ogni release futura prima di fare rollback del solo applicativo.

---

## 3. Rollback backend (Cloud Run)

Quasi istantaneo, nessun rebuild: Cloud Run conserva le revisioni precedenti e sposta solo il traffico.

```bash
# 1. Elencare le revisioni e identificare l'ultima funzionante
gcloud run revisions list \
  --service=finedimondo-backend \
  --region=europe-west1 \
  --project=freedomrun-491323

# 2. Spostare il 100% del traffico sulla revisione precedente
#    (esempio: finedimondo-backend-00016-xxx se la 00017 è difettosa)
gcloud run services update-traffic finedimondo-backend \
  --region=europe-west1 \
  --project=freedomrun-491323 \
  --to-revisions=<REVISIONE_PRECEDENTE>=100

# 3. Verifica
gcloud run services describe finedimondo-backend \
  --region=europe-west1 --project=freedomrun-491323 \
  --format="value(status.traffic)"
```

**Avvertenza sul tag immagine:** `cloudbuild_community.yaml` pubblica sempre lo stesso tag (`:v1-1-0`), quindi il tag NON identifica una versione. Il rollback va fatto **sempre per revisione Cloud Run**, mai ri-deployando il tag. (Debito tecnico: passare a tag `$SHORT_SHA` in Cloud Build.)

**Roll-forward (annullare il rollback):** stesso comando `update-traffic` verso la revisione più recente.

---

## 4. Rollback frontend (Firebase Hosting)

```bash
# Opzione A — rollback nativo all'ultima release precedente
firebase hosting:rollback --project el-fontanin

# Opzione B — ricostruire da un commit noto-buono
git checkout <COMMIT_BUONO> -- .   # o checkout del tag di release
npm ci --include=dev               # NB: NODE_ENV=production sul PC di Daniel
npm run build
firebase deploy --only hosting --project el-fontanin
```

Preferire l'opzione A (secondi, nessun rebuild). L'opzione B serve solo se bisogna tornare indietro di più di una release.

**Verifica:** aprire `https://el-fontanin.web.app` in finestra anonima (bypassa cache), controllare la versione/feature incriminata.

---

## 5. Rollback database (Alembic — PostgreSQL)

**⚠️ DISTRUTTIVO.** Le `downgrade()` di questo repo fanno `DROP TABLE`: eseguire un downgrade cancella i dati inseriti in quelle tabelle. Stato attuale della catena:

```
f308e9f0394c (baseline)  →  44370175c503 (Competenze: competenza_domini, competenza_utente)
```

La `downgrade()` di `44370175c503` è stata verificata: è reale (droppa le due tabelle), non uno stub vuoto. Verificare comunque questo punto per **ogni** nuova migrazione autogenerata, prima di considerarla rollback-abile.

**⚠️ ANOMALIA BASELINE (trovata 2026-07-08):** la `upgrade()` di `f308e9f0394c` ("baseline") contiene `DROP` di 13 tabelle estranee al progetto (schema DAW: `tracks`, `clips`, `midi_notes`, `timelines`, `projects`, `users`, ecc.) presenti nel DB condiviso `jackass_verona` — autogenerate ha trattato come "da rimuovere" le tabelle di un altro progetto. Conseguenze: (a) MAI eseguire `alembic downgrade` fino alla base o `upgrade` da zero senza aver prima ripulito la baseline; (b) verificare se in produzione è stato eseguito `upgrade head` (distruttivo per quelle tabelle) o `stamp`; (c) il downgrade `-1` dalla revisione Competenze resta sicuro perché tocca solo le due tabelle `competenza_*`.

Procedura obbligatoria:

```bash
# 1. SEMPRE: backup pre-downgrade
pg_dump -h <DB_HOST> -U jackass_admin -d jackass_verona -Fc \
  -f backup_pre_downgrade_$(date +%Y%m%d_%H%M).dump

# 2. Prova generale su una copia, MAI direttamente in produzione
createdb -h <HOST_TEST> jackass_verona_test
pg_restore -h <HOST_TEST> -d jackass_verona_test backup_pre_downgrade_*.dump
# puntare Alembic alla copia via JACKASS_DB_HOST/JACKASS_DB_NAME e:
alembic downgrade -1
alembic current   # deve mostrare la revisione precedente

# 3. Solo dopo esito positivo sulla copia, e con autorizzazione di Daniel:
#    ripetere il downgrade sul DB di produzione
```

Le credenziali sono lette da `.env.local`/`.env` (variabili `JACKASS_DB_*`); Alembic le usa via `community_module/models/community_models.py::get_engine()`.

**Alternativa preferita al downgrade:** se il problema è il codice e non lo schema, fare rollback del solo backend (§3) e lasciare lo schema in avanti — le migrazioni additive lo consentono.

---

## 6. Mitigazione via feature flag (prima del rollback)

La feature Competenze è dietro `VITE_ENABLE_COMPETENZE_FEATURE` (frontend). Se il difetto è confinato a una feature flaggata: rimuovere/azzerare la variabile negli env di build, rebuild + deploy hosting. Più chirurgico di un rollback completo e non tocca il backend. Usare questo pattern per ogni feature futura.

---

## 7. Firestore (regole e indici)

Le regole sono versionate in git (`firestore.rules`). Ripristino:

```bash
git checkout <COMMIT_BUONO> -- firestore.rules
firebase deploy --only firestore:rules --project el-fontanin
```

La console Firebase conserva inoltre la cronologia delle regole pubblicate (Firestore → Regole → cronologia) come riferimento. **I dati Firestore non hanno rollback nativo**: per i dati serve un export/import pianificato (da definire quando Firestore conterrà dati critici).

---

## 8. Verifica post-rollback (obbligatoria, ogni volta)

1. `GET https://<url-backend>/community/health` → 200 (endpoint reale in `community_main.py:114`).
2. Smoke test del bug che ha causato il rollback: confermare che NON si ripresenta. In particolare, dopo qualsiasi rollback backend verificare il fix sicurezza: `GET /community/catalogo/schede?stato=bozza` con utente socio non-autore/non-validatore deve restituire `[]` (vedi `tests/test_catalogo_security.py`).
3. Login + un percorso utente completo su `el-fontanin.web.app`.
4. Registrare l'evento in COORDINATION.md (data, componente, revisione da→a, motivo, esito).

**Il punto 2 è il motivo per cui i test di rollback si fanno in staging, mai in produzione:** un rollback che riporta live una versione precedente al fix sicurezza riaprirebbe il bug delle bozze visibili.

---

## 9. Escalation

| Situazione | Azione |
|---|---|
| Rollback applicativo non risolve | Verificare DB/schema (§5) e config/secrets (Secret Manager: password DB) |
| Downgrade fallisce a metà | STOP. Non ritentare. Ripristinare dal dump del passo 1 (§5) |
| Dubbio su qualsiasi passo distruttivo | Fermarsi e chiedere a Daniel — vale sempre la regola R3 |

---

## 10. Prerequisiti da completare (stato al 2026-07-08)

- [ ] Ambiente di staging (workflow `deploy-staging.yml` previsto dalla strategia CI/CD) — finché non esiste, i test di rollback restano non provati.
- [ ] Tag immagine per commit (`$SHORT_SHA`) in `cloudbuild_community.yaml` al posto del tag fisso `v1-1-0`.
- [ ] Prova pratica di `alembic downgrade -1` su copia del DB (mai eseguita finora).
- [ ] Politica di backup PostgreSQL schedulata (oggi i dump sono solo manuali).
