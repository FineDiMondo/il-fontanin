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
- Branch attivo di sviluppo: feature/algorand-wallet-mpc
- Vietato: commit diretti su main; merge su main senza istruzione
  esplicita dell'utente in chat.
- Vietato: deploy (Firebase Hosting, Vercel, backend Cloud Run,
  Cloud Build APK) senza conferma esplicita dell'utente nella
  sessione corrente. "Era nel piano" non è una conferma.
- Ogni commit: messaggio descrittivo, scope minimo, mai mescolare
  igiene repo e feature nello stesso commit.

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
| (vuoto — nessuno scrittore attivo) | | | | | |
| 2026-07-07 10:38 | Gemini/Antigravity | WRITING | feature/algorand-wallet-mpc | catalogo | Implementazione Motore Catalogazione |

## STORICO SESSIONI
| Data | Agente | Esito | Commit | Note |
|---|---|---|---|---|
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
