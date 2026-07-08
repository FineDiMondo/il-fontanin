# AGENTS.md — Protocollo di coordinamento multi-agente
Repository: fontanin (El Fontanin — Fine di Mondo APS)
Posizione: root del repository (D:\Progetti GCloud\fontanin\AGENTS.md)
Autorità: questo file è la fonte di verità sul coordinamento.
In caso di conflitto tra un prompt di sessione e questo file, vince
il più restrittivo dei due.

OGNI AGENTE (Cowork, Gemini/Antigravity, Claude, altri) DEVE:
1. Leggere questo file PRIMA di qualsiasi lettura/scrittura sul repo.
2. Registrarsi nella sezione SESSIONI ATTIVE prima di scrivere.
3. Aggiornare la sezione all'uscita (check-out), anche in caso di errore.

---

## R1 — REGOLA DEL SINGOLO SCRITTORE
- Un solo agente in scrittura sul repository alla volta.
- Prima di scrivere: verificare che SESSIONI ATTIVE non contenga
  altri agenti in stato WRITING. Se ne contiene: FERMARSI e segnalare
  all'utente. Non esistono eccezioni, nemmeno su file "diversi":
  package.json, lockfile e .git sono risorse condivise.
- La lettura è sempre consentita (stato READING, registrazione facoltativa).

## R2 — CHECK-IN / CHECK-OUT (obbligatorio per la scrittura)
Al check-in, aggiungere una riga alla tabella SESSIONI ATTIVE:
  data/ora | agente | stato WRITING | branch | moduli toccati | incarico
Al check-out:
  - portare lo stato a DONE (o ABORTED, con motivo)
  - committare o stashare TUTTE le proprie modifiche: vietato lasciare
    il working tree sporco per la sessione successiva
  - spostare la riga in STORICO SESSIONI

## R3 — POLICY DI BRANCH E DEPLOY
- Branch attivo di sviluppo: develop (main protetto, merge solo via PR)
- Vietato: commit diretti su main; merge su main senza istruzione
  esplicita dell'utente in chat.
- Vietato: deploy (Firebase Hosting, backend Cloud Run,
  Cloud Build APK) senza conferma esplicita dell'utente nella
  sessione corrente. "Era nel piano" non è una conferma.
  (Vercel dismesso l'8 lug 2026 — decisione di Daniel.)
- Ogni commit: messaggio descrittivo, scope minimo, mai mescolare
  igiene repo e feature nello stesso commit.

## R7 — BRANCH DI LAVORO MULTI-LLM
- Un LLM può creare branch lavorabili per task, work order o piani
  approvati dall'utente.
- La regola del singolo scrittore vale sempre per l'intero repository,
  inclusi main, develop, feature branch, lockfile e .git.
- Non possono esistere due agenti in stato WRITING contemporaneamente,
  anche se lavorano su branch diversi.
- Ogni branch deve avere un solo agente assegnato durante una sessione
  di scrittura.
- I branch di implementazione devono rientrare via PR; vietato push o
  merge diretto su main senza istruzione esplicita dell'utente.

## R8 — STAGE REMOTI E PROMOZIONE (develop → certification → production)
- Gli stage remoti applicativi sono: `develop`, `certification`,
  `production`.
- Ogni stage remoto ha un solo agente in scrittura alla volta, perché
  R1 vale sull'intero repository e sulle risorse condivise di deploy.
- `develop` è l'ambiente di integrazione tecnica; `certification` è
  l'ambiente di validazione/release candidate; `production` è l'ambiente
  live.
- La promozione tra stage avviene tramite PR o workflow controllati:
  feature/work-order → develop → certification → production.
- `production` richiede sempre autorizzazione esplicita dell'utente nella
  sessione corrente e, se gestito via GitHub Actions, Environment
  `production` con approvazione umana. Vietato promuovere direttamente
  da un branch feature a production.

## R4 — MODULI PROTETTI (modifica solo su istruzione esplicita)
- src/context/AuthContext.jsx      (logica auth: consumare, non modificare)
- src/context/WalletContext.jsx    (logica MPC: consumare, non modificare)
- Firestore Security Rules / Custom Claims (RBAC)
- index.html meta viewport         (fix WCAG 1.4.4 già applicato: non regredire)

## R5 — DECISIONI RISERVATE ALL'UMANO (mai decidere in autonomia)
| # | Decisione | Decisore | Stato |
|---|---|---|---|
| 1 | Policy di recovery del wallet (ADR-001) | Consiglio Direttivo | PENDENTE |
| 2 | ASA ID token "f" su Mainnet | Utente (Daniel) | PENDENTE — mai hardcodare; usare VITE_F_TOKEN_ASA_ID |
| 3 | Visibilità pubblica GET /community/research/experiments | Consiglio Direttivo | PENDENTE — solo segnalare |
| 4 | Autorizzazione di ogni deploy | Utente (Daniel) | PER-SESSIONE |

## R6 — CONVENZIONI DI HANDOFF
- I deliverable in ingresso da sessioni Claude arrivano in claude-files/
  con un README_HANDOFF.md come manifest: leggerlo sempre per primo.
- Documenti architetturali (ADR) in docs/ ; l'ADR vigente sul wallet
  è ADR-001 (MPC non-custodial, Opzione B — implementata, commit 1ea21c4).
- Test Visitatore: test_visitatore.py nella root, accanto a
  test_backend.py. Contratto congelato al perimetro rilevato il
  4/7/2026; non riscrivere, estendere.
- Report di fine sessione: file modificati con motivo, log dei test
  eseguiti, punti aperti umani (vedi R5), commit prodotti.

---

## SESSIONI ATTIVE
| Data/ora | Agente | Stato | Branch | Moduli | Incarico |
|---|---|---|---|---|---|

## STORICO SESSIONI
| Data | Agente | Esito | Commit | Note |
|---|---|---|---|---|
| 2026-07-08 12:13 | Codex | DONE | d944990 | H2 2026 Wave 0 WO-01: Cloud Build parametrico per develop/certification/production, workflow remoti Accenture-style, catalogo link ambienti/DB/endpoint in docs/ENVIRONMENTS.md, runbook deploy in docs/DEPLOY.md; verifiche: YAML parse OK, npm build OK, pytest 25 passed 2 skipped; gcloud builds submit --dry-run non supportato dalla CLI locale, nessun deploy eseguito |
| 2026-07-08 12:06 | Codex | DONE | fbe783d | Recupero sessione stale Claude, aggiunta R7 branch multi-LLM, creato branch codex/h2-2026-plan; completato deploy ADD-02 autorizzato: pytest 25 passed 2 skipped, npm build OK, metadata_schema DB aggiornati e dry-run finale no-op, Cloud Run revision finedimondo-backend-00018-z8v, Firebase Hosting deploy OK, smoke test health/home/catalogo OK |
| 2026-07-08 12:05 | Claude/Fable (Cowork) | ABORTED | 8b7010c | Sessione interrotta per esaurimento crediti; takeover amministrativo autorizzato da Daniel; working tree verificato pulito prima del recupero |
| 2026-07-08 11:38 | Codex | DONE | — | Verificata connessione GCP/Firebase e reachability endpoint; deploy annullato su richiesta utente, nessun deploy/build eseguito |
| 2026-07-08 09:40 | Gemini/Antigravity | DONE | 3175fe7, dfc8e16 | CI/CD fix (cache-dependency-path), riallineamento PR merged su main, verificata baseline Alembic velenosa, impostata branch protection su main, feature branch eliminato |
| 2026-07-07 15:33 | Gemini/Antigravity | DONE | a39e447, d4490e0 | Verifica git status/diff OK; rimosso .git/index.lock stantio (12:00, 0 byte, nessun processo); pytest 40 passed 2 skipped; npm build OK; VITE_ENABLE_COMPETENZE_FEATURE assente in tutti gli env (ff_competenze=OFF); commit docs finding #6 (a39e447, scope minimo: AGENTS.md+COORDINATION.md+test_security_fix.py+verify_security_fix.py); PDF Villafranca spostato in docs/comuni/villafranca-verona/ (d4490e0); deploy backend Cloud Run OK (revision finedimondo-backend-00017-hmv); deploy frontend Firebase OK (el-fontanin.web.app); VERIFICA POST-DEPLOY SUPERATA: GET /schede?stato=bozza con socio non-autore non-validatore → [] HTTP 200. |
|---|---|---|---|---|
| 2026-07-07 12:20 | Claude/Cowork | ABORTED | — | Documentazione AGENTS.md/COORDINATION.md preparata (non ancora committata) ma commit interrotto: .git/index.lock occupato da altro processo (probabile Antigravity già in scrittura). Rispettato R1, nessun tentativo di sblocco forzato. File nuovi non tracciati comparsi nel frattempo: test_security_fix.py, verify_security_fix.py, Villafranca_Verona_Storia_immagini_comunita_IT_2018_x_web.pdf — origine non verificata da questa sessione. |
| 2026-07-07 11:59 | Claude/Cowork + Antigravity | DONE | a945aa0 | Fix bug sicurezza GET /schede (bozze visibili a chiunque autenticato): join SQL su CompetenzaDominio/CompetenzaUtente, autorizzazione a livello di query, bypass admin preservato (riga 71 catalogo.py, verificato). Renormalizzazione line-ending (.gitattributes text=lf, core.autocrlf false) 57→8 file. Verificato: pytest 27 passed, npm run build OK. NON ancora deployato in produzione a questa data. |
| 2026-07-07 ~11:50 | Antigravity | DONE | f2420d3 | Implementazione AT-COMPETENZE-002 (Profilo Competenze e Questionari): tabelle CompetenzaDominio/CompetenzaUtente, migrazione Alembic baseline+competenze, router /community/competenze/*, is_validatore_per_dominio, feature flag ff_competenze (default OFF), pagina Profilo.jsx dietro flag. Postgres confermato come layer di persistenza (supera assunzione Firestore in AF). |
| 2026-07-07 11:35 | Gemini/Antigravity | DONE | c921f79 | Deploy Firebase e Cloud Run con fix db password in Secret Manager; verifica post-deploy in prod superata |
| 2026-07-07 11:15 | Gemini/Antigravity | DONE | 2cc0d1f | Fix DetachedInstanceError su POST forum, update audit, fix mock data in test write_gated |
| 2026-07-07 10:51 | Gemini/Antigravity | DONE | 9bc0bc3 | Bugfix forum 500, test usabilità, manuale utente, empty state UI, fix stato richiesta_modifiche |
| 2026-07-07 10:38 | Gemini/Antigravity | DONE | 62a5dad | Implementazione Motore Catalogazione |
| 2026-07-07 10:25 | Gemini/Antigravity | DONE | 92974e8 | Implementazione Canzoniere e Ricettario (DB, API, UI) + Deploy |
| 2026-07-07 09:36 | Gemini/Antigravity | DONE | a56ef46 | Correzione stemmi Povegliano/Vigasio e testi, aggiunta placeholder Erbè/Trevenzuolo/Nogara; deploy Firebase Hosting |
| 2026-07-05 10:26 | Gemini/Antigravity | DONE | cfba7a0 | Implementazione modulo Galleria Media con integrazione Google Drive, Firestore rules e feature flags |
| 2026-07-05 10:02 | Gemini/Antigravity | DONE | d36872b | Implementazione tool experimental Lavori (Argini e Scalette) e aggiornamento thread forum |
| 2026-07-04 22:30 | Codex | DONE | d4cab15 | Fix crash homepage live su Stella/toFixed; deploy Firebase Hosting verificato |
| 2026-07-04 22:24 | Gemini/Antigravity | DONE | — | Deploy frontend Firebase Hosting |
| 2026-07-04 22:20 | Gemini/Antigravity | DONE | 18851d3 | Corretto category_id, IP client nei survey, riutilizzo engine DB, ASA ID, SocioRoute per chat e user_id Bar; rimossi .pyc e integrato Secret Manager |
| 2026-07-04 18:04 | Gemini/Antigravity | DONE | 48a4e37 | Aggiunta sezioni Mappa e Numeri Utili nella Homepage |
| 2026-07-04 18:02 | Gemini/Antigravity | DONE | 2121b81 | Risoluzione bug di overflow-hidden nel selettore lingua |
| 2026-07-04 17:45 | Gemini/Antigravity | DONE | 6007785 | Adattamento layout responsive per Desktop |
| 2026-07-04 17:40 | Gemini/Antigravity | DONE | 1927943 | Fix redirect_uri_mismatch per Google Auth |
| 2026-07-04 17:30 | Gemini/Antigravity | DONE | 998de45 | Audit e allineamento Firebase, versioni applicative (1.1.0) e OpenAPI |
| 2026-07-04 | Gemini/Antigravity | DONE | 1ea21c4 | Integrazione tokens+LoginBanner+WalletCard, fix viewport, deploy FE |
| 2026-07-04 | Cowork | ABORTED | — | Gate falliti: file handoff mancanti + scrittore concorrente (corretto per R1) |
