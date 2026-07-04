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
| 2026-07-04 17:30 | Gemini/Antigravity | WRITING | feature/algorand-wallet-mpc | root, community_module, android, ios, desktop, CLI | Audit e allineamento Firebase e versioni applicative |

## STORICO SESSIONI
| Data | Agente | Esito | Commit | Note |
|---|---|---|---|---|
| 2026-07-04 | Gemini/Antigravity | DONE | 1ea21c4 | Integrazione tokens+LoginBanner+WalletCard, fix viewport, deploy FE |
| 2026-07-04 | Cowork | ABORTED | — | Gate falliti: file handoff mancanti + scrittore concorrente (corretto per R1) |
