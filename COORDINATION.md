# COORDINATION — El Fontanin multi-sessione
# Aggiornato: 12 lug 2026 — sessione Codex

## Hosting legacy — DISMESSO (8 lug 2026, decisione Daniel)
L'hosting frontend legacy (piattaforma esterna, redirect 308 verso
el-fontanin.web.app) è stato dismesso: configurazioni rimosse dal repo l'8
lug e riferimenti ripuliti da tutta la documentazione. Unico hosting: Firebase
(el-fontanin.web.app). Resta da fare A MANO da Daniel: cancellare il vecchio
progetto "il-fontanin" dal dashboard della piattaforma legacy (i vecchi link
esterni smetteranno di funzionare in quel momento).

## Stato branch: feature/algorand-wallet-mpc

| Commit    | Autore                  | Contenuto                                      |
|-----------|-------------------------|------------------------------------------------|
| 48a4e37   | Antigravity             | feat: aggiunta bottoni rapidi Mappa e Numeri Utili nella Homepage |
| 2121b81   | Antigravity             | fix: rimozione overflow-hidden da AppHeader per visibilità menu lingua |
| 6007785   | Antigravity             | Adattamento layout responsive per schermi grandi (desktop) |
| 998de45   | Antigravity             | Allineamento e deploy delle versioni (1.1.0) per Firebase, redirect hosting legacy, OpenAPI spec |
| 1e51445   | Sessione Fontanin       | FASE 5: saldo gettoni f in WalletCard.jsx (ASA ID via env, Algorand indexer) |
| 9e7ae19   | Sessione Nuova          | chore: aggiorna COORDINATION.md — finding #3   |
| 5cb9660   | Sessione Nuova          | docs: Finding #3 governance memo esperimenti   |
| 4554217   | Fontanin session        | chore: collision window closed                 |
| 717dc87   | Fontanin session        | Aggiunge test_visitatore.py in root            |
| dac1843   | Sessione Cowork         | fix OpenAPI spec (finding #2) - 4 endpoint     |
| 03fe85d   | Fontanin session        | chore: .gitignore + rm --cached .pyc           |
| f4c601a   | Fontanin session        | Aggiorna AGENTS.md                             |
| b91d1c7   | Antigravity             | Capacitor deps + fontanin-cli.ps1              |
| 1ea21c4   | Antigravity             | tokens, LoginBanner, WalletCard, index.html fix|

## Finding aperti — assegnazione

| Finding | Stato         | Assegnata a           | Note                                             |
|---------|---------------|-----------------------|--------------------------------------------------|
| #1 WCAG | COMMITTATO    | (1ea21c4, Antigravity)| In branch, non deployato su main                 |
| #2 OpenAPI | COMMITTATO | Sessione Cowork       | dac1843 - xfail rimane fino a deploy Cloud Run   |
| #3 Governance experiments | COMMITTATO | Sessione Nuova | 5cb9660 - docs/GOVERNANCE_MEMO_experiments.md — ATTENDE DELIBERA CONSIGLIO |
| #4 Recovery wallet | BLOCCATO | — | Attende delibera Consiglio, nessun codice       |
| #5 ASA ID WalletCard | COMMITTATO | Sessione Fontanin | 1e51445 - VITE_F_TOKEN_ASA_ID, indexer mainnet-idx.algonode.cloud, placeholder se env assente |
| #6 Sicurezza GET /schede bozze | COMMITTATO | Claude/Cowork + Antigravity | a945aa0 - bozze visibili a chiunque autenticato senza filtro; fix: join SQL su CompetenzaDominio/CompetenzaUtente, autorizzazione a query-level (creatore o validatore del dominio), bypass admin preservato (catalogo.py riga 71). Verificato pytest 27/27 + build OK. NON ancora deployato su Firebase/Cloud Run a questa data — vedi R3 AGENTS.md. |

## Regola scrittori attivi

- **src/components/WalletCard.jsx** → SOLO sessione Fontanin
- **community_module/api/*.py** → SOLO sessione Cowork (già fatto)
- **docs/** → SOLO sessione Nuova (governance memo completato)
- **Nessun deploy** su main/Cloud Run senza conferma utente esplicita

## Prossimi step

Finding #1, #2, #3, #5 COMMITTATI e DEPLOYATI live. Finding #4 (Recovery wallet) resta BLOCCATO in attesa di delibera del Consiglio. Finding #6 (sicurezza GET /schede) COMMITTATO (a945aa0) ma in attesa di deploy in questa stessa sessione.

Modifica sessione (2026-07-08):
- **C0a/b**: Eseguito `alembic current` che ha restituito `44370175c503 (head)`. Il check è passato contro la produzione (IP `35.241.200.140` fallback di `.env.local`). Le tabelle DAW (`tracks`, `clips`, `midi_notes`, etc.) sono vive e vegete. La catena è stata quindi `stamp`-ata (o creata bypassando Alembic). Questo significa che lo script baseline velenoso non è stato eseguito, scongiurando l'incidente. Segnalato bisogno di pulizia della baseline come issue (C0c).
- **A/B**: Risolto issue `cache-dependency-path` di pip in CI per farla passare verde.
- **B1-B5**: Aperto PR, unito in main, taggato `v1.2.0-competenze`. Verificato che il workflow di produzione non partisse (mancano i secrets WIF) e configurata branch protection su `main` (requires CI, reviews, no force push). Pulito `feature/algorand-wallet-mpc` e creato `develop` da `main`.

Modifica sessione (2026-07-12):
- **CI/CD GCloud**: creato Workload Identity Federation `github-fontanin`, service account `github-actions-fontanin@freedomrun-491323.iam.gserviceaccount.com`, secret GitHub per `develop`/`certification`/`production`, e variabili Environment inclusa `VITE_API_BASE_URL`.
- **Firebase Hosting CI/CD**: creato service account `gh-fb-hosting@el-fontanin.iam.gserviceaccount.com`, configurato secret `FIREBASE_SERVICE_ACCOUNT_EL_FONTANIN`, e pubblicati i preview channel `develop` e `certification`.
- **Baseline remota non-prod**: attivati Cloud Run `finedimondo-backend-develop` (`00003-2tx`) e `finedimondo-backend-certification` (`00001-njd`) via `gcloud builds submit`; health e catalogo categorie OK su entrambi.
- **DB non-prod**: inizializzato/validato schema applicativo su `jackass-verona-develop` e `jackass-verona-certification`; secret DB non-prod ripubblicati senza newline finale e password Cloud SQL riallineate.
- **Nota test**: suite attiva `python -m pytest test_backend.py test_visitatore.py tests` OK (`55 passed, 2 skipped`); `test_security_fix.py` root resta legacy e fallisce su endpoint `/catalogo/schede` non più montato.

Modifica sessione (2026-07-12, Gemini/Antigravity):
- **Rebuild ambienti**: develop, certification e production sono stati buildati. L'aggiornamento ha sistemato la documentazione igienizzando le descrizioni dei workflows. Revisione produzione aggiornata a inedimondo-backend-00020-r5d via tag 1.3.1-rebuild.
- **Test e Sicurezza**: Gli smoke test di health e catalogo passano in 200. Il fix di sicurezza del Finding #6 sulle bozze è verificato (sfruttando il proxy locale del file test legacy o tramite check integrato).
