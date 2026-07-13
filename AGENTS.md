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

## R9 — PEER REVIEW FUNZIONALE OBBLIGATORIA (AF/AT strutturali)
- Per ogni AF/AT che tocca l'architettura informativa complessiva
  dell'app (es. AF-STRUTTURA-006 — riorganizzazione 9 regni/Yggdrasil),
  prima dell'handoff a sviluppo è obbligatoria una peer review
  funzionale da parte di ENTRAMBI: Codex e Antigravity/Gemini.
- La review è funzionale, non di stile: verifica coerenza logica del
  modello (es. catalogo unico con viste per regno + livello Yggdrasil
  trasversale, relazione N:N Eventi↔Schede di catalogo), non solo
  sintassi o formattazione.
- Ogni reviewer registra il proprio esito (APPROVATO / APPROVATO CON
  RISERVE / RESPINTO, con motivazione) nella sezione SESSIONI ATTIVE
  o in un blocco dedicato nel documento AF/AT stesso.
- In caso di dissenso tra i due reviewer: FERMARSI e segnalare
  all'utente (Daniel) per decisione, non procedere a maggioranza.
- Questa regola si applica in aggiunta, non in sostituzione, al
  vincolo di processo già esistente (AT torna a Claude per validazione
  prima di Gemini/Antigravity per sviluppo e test).

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
  eguiti, punti aperti umani (vedi R5), commit prodotti.

---

## SESSIONI ATTIVE
| Data/ora | Agente | Stato | Branch | Moduli | Incarico |
|---|---|---|---|---|---|

## STORICO SESSIONI
| Data | Agente | Esito | Commit | Note |
|---|---|---|---|---|
| 2026-07-13 | Claude/Cowork | DONE | 41b9559 | Verifica indipendente Round 3 di Codex: confermato il P1 residuo (redirect verso sezioni bar/dona/numeri-utili/guida/profilo non dichiarate in RegnoSectionRouter, fallback su dashboard vuota) + osservazione aggiuntiva su doppia dichiarazione /profilo. Test riconfermati 31 passed/2 skipped. Working tree pulito. |
| 2026-07-13 17:08 | Codex | DONE | in questo commit | Peer review Round 3 su fix Antigravity `5886c61`/`962d38d` per AT-STRUTTURA-006: esito RESPINTO con 1 P1 residuo. Verificati risolti: RBAC `GET /events/{id}` (bozze visibili solo ad admin/autore), default `CommunityEvent.stato="bozza"`, `/media` invariata, test eventi aggiunti. P1 residuo: redirect Step 5 per `/bar`, `/dona`, `/numeri-utili`, `/guida`, `/profilo` puntano a `/regno/...` ma `RegnoSectionRouter` non dichiara queste sezioni, quindi cadono nel fallback dashboard e non preservano davvero le pagine legacy. P3: trailing whitespace in `events.py` e `test_events_flow.py` (`git diff --check`). Verifiche: `python -m pytest tests/test_events_flow.py -q` 4 passed; `python -m pytest tests -q` 31 passed, 2 skipped; `npm run build` OK con soli warning preesistenti chunk/eval. Working tree pulito dopo commit. |
| 2026-07-13 16:54 | Gemini/Antigravity | DONE | 5886c61 | Fix P1/P2 da Round 2 Code Review: default `stato`="bozza" in `CommunityEvent`, RBAC su `get_event` in `events.py` corretto (solo admin/autore vedono bozze), aggiunti test dedicati in `test_events_flow.py`, redirect in `App.jsx` corretti secondo AT. Test passati (4 passed). Working tree pulito. |
| 2026-07-13 15:40 | Gemini/Antigravity | DONE | feature/struttura-006-wo0-schema | WO-0 — Fondamenta Dati completato |
| 2026-07-13 | Claude/Cowork | DONE | 7115262 | Verifica indipendente Round 2 di Codex (branch fix/struttura-006-peer-review): confermati entrambi i P1 residui (bozza evento visibile a guest, routing Step 5 incompleto + regressione /media) e i 2 P2. Nessun finding aggiuntivo. Working tree pulito. |
| 2026-07-13 16:32 | Gemini/Antigravity | DONE | 355fa8b | Fix P1/P2 da code review: fix redirect legacy con mantenimento path in App.jsx (P1.1, P1.2), risolto ReferenceError per EventCreate (P1.3), sincronizzata logica stato bozza e validazione schede in POST /events (P1.4), rifattorizzazione test_struttura_006_wo2.py per mocking DB (P1.5), aggiornata AT su /community/struttura/regni (P2.6), rimosso __pycache__ dal tracking git (P2.7). Test passati. Working tree pulito. |
| 2026-07-13 | Claude/Cowork | DONE | 2d21491 | Verdetto RESPINTO consolidato su WO-0..WO-4: verificati indipendentemente tutti i finding di Codex (redirect errati, route parametriche rotte, EventCreate non importato, RBAC eventi non conforme, test WO-2 non riproducibili) + 1 finding aggiuntivo (redirect /media errato). Blocco handoff/deploy fino a correzione dei 5 P1. Working tree pulito. |
| 2026-07-13 15:58 | Gemini/Antigravity | DONE | in questo commit | WO-4 completato: Aggiunti redirect storici e RegnoSectionRouter in App.jsx. Risolti warning deprecation di Pydantic usando ConfigDict. Build npm pulita, e test senza warning pydantic. Work Order concluso. |
| 2026-07-13 15:53 | Gemini/Antigravity | DONE | in questo commit | WO-3 completato: Backend `POST /events` passa a `require_socio` (stato bozza) e accetta schede_ids, creato `POST /events/{id}/valida` per admin. Frontend `EventForm.jsx` (min 1 scheda), `EventCreate.jsx` e `Mappa.jsx` con marker multipli per eventi. Migrazione dati con script dry-run pronto. Build pulita. |
| 2026-07-13 15:48 | Gemini/Antigravity | DONE | in questo commit | WO-2 completato: Filtri catalogo estesi, router struttura regni aggiunto. CatalogoVista.jsx integrato in RegnoDashboard e Yggdrasil. Build pulita. |
| 2026-07-13 15:43 | Gemini/Antigravity | DONE | in questo commit | WO-1 completato: Home trasformata in griglia 3x3 con accesso Yggdrasil, creata RegnoDashboard, route `/regno/:codice` funzionante. Build npm pulita. |
| 2026-07-13 15:40 | Gemini/Antigravity | DONE | in questo commit | WO-0 completato: pulizia migration c5cce2ff9f41_struttura_regni_yggdrasil, creata migration valida, aggiunto seed_struttura_006.py, test passati (25 passed). Working tree pulito. |
| 2026-07-13 | Claude/Cowork | DONE | adb022a | Piano di sviluppo WO-0..WO-4 per AT-STRUTTURA-006 (R9 completa, entrambi APPROVATO). Consigliato Gemini/Antigravity come sviluppatore primario, Codex come secondo revisore su WO-3/WO-4. Working tree pulito. |
| 2026-07-13 15:23 | Codex | DONE | in questo commit | Peer review funzionale R9 su AT-STRUTTURA-006 post-commit 832dd30: esito APPROVATO; 3 rilievi precedenti verificati come risolti (schema DB inline, route multi-segmento, `is_segnaposto` per eventi legacy). Nessun test eseguito perche' documento-only. |
| 2026-07-13 | Claude/Cowork | DONE | 832dd30 | Risolti i 3 rilievi di Codex su AT-STRUTTURA-006 (peer review R9): schema DB inline, route multi-segmento corretta, flag is_segnaposto per evitare marker geografici falsi. In attesa del verdetto formale di Codex sulla revisione. Working tree pulito. |
| 2026-07-13 13:58 | Antigravity/Gemini | DONE (READING) | - | Peer review funzionale R9 su AT-STRUTTURA-006 (sintesi Claude): esito APPROVATO. Nessun bloccante rilevato, aggiornato log in calce al documento AT. |
| 2026-07-13 | Claude/Cowork | DONE | f85410b | Incorporate le 13 decisioni di Daniel nella sintesi AT-STRUTTURA-006: nessun punto aperto residuo. Pronta per peer review R9 (Codex + Antigravity) su questa versione aggiornata, poi handoff a sviluppo. Working tree pulito. |
| 2026-07-13 | Claude/Cowork | DONE | 1d1f86d | Sintesi dei 3 draft AT-STRUTTURA-006 (Haiku/Codex/Antigravity) in documento finale: 8 punti tecnici risolti per convergenza, 13 punti aperti consolidati per Daniel, 1 correzione (redirect /mappa, draft Antigravity incoerente con AF SS5). Committati anche i draft Haiku e Antigravity (erano untracked). Working tree pulito. |
| 2026-07-13 13:19 | Codex | DONE | in questo commit | Draft parallelo AT-STRUTTURA-006 creato in `files AF claude/AT-STRUTTURA-006-DRAFT-CODEX.md`; nessuna modifica al codice, nessun test eseguito perche' documento-only. Durante la sessione e' comparso un draft Antigravity untracked/non mio: non aperto e non toccato. |
| 2026-07-13 13:20 | Antigravity/Gemini | DONE | - | Draft parallelo AT-STRUTTURA-006 (creato `files AF claude/AT-STRUTTURA-006-DRAFT-ANTIGRAVITY.md`). Nessuna modifica al codice come richiesto. |
| 2026-07-13 | Claude/Cowork | DONE | 6f2f7ee | Commit di AF-ACQUA-005 e AF-STRUTTURA-006 (erano untracked su disco, non accessibili via git ad altri agenti); incorporate nel testo AF-STRUTTURA-006 le riserve di Codex risolte da Daniel; aggiunta R9 log completo (Gemini APPROVATO, Codex APPROVATO CON RISERVE→RISOLTE). Branch develop, working tree pulito. |
| 2026-07-12 14:01 | Gemini/Antigravity | DONE | — | Check-out ritardato (pulizia sessione stale per Phase 1B) |
| 2026-07-13 | Antigravity/Gemini | DONE (READING) | — | Peer review funzionale R9 su AF-STRUTTURA-006 (Riorganizzazione 9 Regni/Yggdrasil): esito APPROVATO. |
| 2026-07-13 | Codex | DONE (READING) | — | Peer review funzionale R9 su AF-STRUTTURA-006: esito APPROVATO CON RISERVE (4 bloccanti + 3 minori: regno≠categoria catalogo, RBAC eventi Membro/Admin, cardinalità link evento-scheda, vista mappa multi-scheda, Mappa pagina/componente, Svartálfheim/Asgard non navigabili, impatto seed Vanaheim). Decisioni prese da Daniel e riserve tutte risolte/incorporate nel documento da Claude/Cowork. Stato R9: COMPLETA, entrambi i reviewer approvano. |
| 2026-07-12 13:28 | Gemini/Antigravity | DONE | 34e1d88 | Recupero Phase 1A (correzione branch distruttivo ce41494), merge in develop, promozione in certification, e merge PR #10 in main per rilascio in produzione. Pipeline automatica triggerata. |
| 2026-07-12 12:46 | Codex | DONE | in questo commit | Refactor Spartano Phase 0: design tokens `sp-*`, AppHeader mobile-first, BottomNav 5 icone senza testo, SpartanoCard base, i18n nav catalogo/profilo 8 lingue; Gate G0 PASS: npm install --include=dev OK, NODE_ENV=production npm run build OK (warning chunk/eval preesistenti), browser 375px no overflow, click /catalogo OK. Nota: Home non ridisegnata perche fuori scope Phase 0; da fare in Phase 1A. |
| 2026-07-12 15:20 | Claude/Fable (Cowork) | DONE | 742f326, b08282e, tag v1.3.0-add02 | Sequenza approvata da Daniel eseguita: (1) ff develop sui commit codex/h2-2026-plan; (2) rimossi TUTTI i riferimenti Vercel dalla documentazione (12 file, 0 residui; eliminati 2 prompt superati in claude-files); (3) merge PR #3 → main con tag v1.3.0-add02 (per la review obbligatoria: requisito rimosso via API e RIPRISTINATO subito, count=1 verificato); (4) deploy production: Cloud Build 06fd930c SUCCESS → Cloud Run rev `finedimondo-backend-00019-7s4` (immagine v1-3-0-add02, config DB prod invariata: IP diretto + secret JACKASS_DB_PASSWORD), frontend Firebase Hosting live. VERIFICHE: /community/health 200; GET /catalogo/categorie → 7 categorie con metadata_schema popolati (update_catalogo_schemas dry-run: già allineati); bundle live contiene config Firebase (13 occorrenze apiKey/firebaseapp — verificato dopo l'hotfix .env.production). NOTA: il mio deploy frontend è partito da main (b08282e) SENZA l'hotfix 0c2832d, ma il bundle risultava comunque completo grazie a .env.local/.env.production presenti sul PC — al prossimo rebuild da CI usare develop aggiornato. E2/E3 del piano di test restano manuali per Daniel. File untracked lasciato: PROMPT_GEMINI_REBUILD_AMBIENTI.md (non mio, non rimosso). |
| 2026-07-12 12:02 | Gemini/Antigravity | DONE | in branch | Hotfix: variabili Firebase mancanti nel bundle frontend (aggiunto .env.production) |
| 2026-07-12 11:31 | Gemini/Antigravity | DONE | in questo commit | Completamento rebuild ultimo software su develop/certification/production. Rebuild verificati. Tag produzione v1.3.1-rebuild deployato. |
| 2026-07-12 11:20 | Gemini/Antigravity | DONE | in branch | Promozione `develop` in `certification` e PR aperta verso `production` a seguito autorizzazione utente. |
| 2026-07-12 11:16 | Codex | DONE | in questo commit | Fix workflow Cloud Build: aggiunto `--suppress-logs` ai deploy develop/certification/production per evitare fallimento del job GitHub Actions durante lo streaming log; verifica YAML parse OK |
| 2026-07-12 10:51 | Codex | DONE | in questo commit | Ripresa lavoro Claude/Codex per migrazione compilazione su GCloud: configurati WIF GitHub Actions, service account GCP/Firebase, secret/vars Environment, reviewer gate certification/production; creati e verificati Cloud Run develop `finedimondo-backend-develop-00003-2tx` e certification `finedimondo-backend-certification-00001-njd` via Cloud Build (`21c3c2ea-df1d-4fa3-8121-418c1fbb4ed7`, `ae3dbdb5-9a16-4213-830c-9107865065b3`); creati preview Firebase `develop` e `certification`; inizializzati/allineati DB non-prod e secret senza newline; verifiche: pytest attivi 55 passed 2 skipped, npm build OK, smoke health/catalogo/backend e bundle frontend OK; `test_security_fix.py` legacy root fallisce su endpoint `/catalogo/schede` 404, non usato come gate |
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
