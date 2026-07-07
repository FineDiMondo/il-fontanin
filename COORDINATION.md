# COORDINATION — El Fontanin multi-sessione
# Aggiornato: 7 lug 2026 — sessione Cowork (finding #6 completato)

## Stato branch: feature/algorand-wallet-mpc

| Commit    | Autore                  | Contenuto                                      |
|-----------|-------------------------|------------------------------------------------|
| 48a4e37   | Antigravity             | feat: aggiunta bottoni rapidi Mappa e Numeri Utili nella Homepage |
| 2121b81   | Antigravity             | fix: rimozione overflow-hidden da AppHeader per visibilità menu lingua |
| 6007785   | Antigravity             | Adattamento layout responsive per schermi grandi (desktop) |
| 998de45   | Antigravity             | Allineamento e deploy delle versioni (1.1.0) per Firebase, Vercel redirect, OpenAPI spec |
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

Modulo Competenze (AT-COMPETENZE-002, commit f2420d3) implementato dietro feature flag `ff_competenze` (default OFF): non visibile in produzione finché il flag non viene attivato esplicitamente dopo il gate di qualità concordato con Daniel.

Il deploy di backend e frontend più recente confermato in produzione è alle 11:35 (commit c921f79) — PRECEDENTE al modulo Competenze e al fix di sicurezza #6. Il deploy che porta a945aa0 in produzione va fatto in questa sessione, con `ff_competenze` OFF.
