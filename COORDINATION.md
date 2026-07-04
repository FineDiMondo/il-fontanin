# COORDINATION — El Fontanin multi-sessione
# Aggiornato: 4 lug 2026 — sessione Nuova (finding #3 completato)

## Stato branch: feature/algorand-wallet-mpc

| Commit    | Autore                  | Contenuto                                      |
|-----------|-------------------------|------------------------------------------------|
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
| #5 ASA ID WalletCard | DA FARE | Sessione FONTANIN | Indexer call + env var per ID  |

## Regola scrittori attivi

- **src/components/WalletCard.jsx** → SOLO sessione Fontanin
- **community_module/api/*.py** → SOLO sessione Cowork (già fatto)
- **docs/** → SOLO sessione Nuova (governance memo completato)
- **Nessun deploy** su main/Cloud Run senza conferma utente esplicita

## Prossimi step

Sessione Fontanin → fase 5: WalletCard.jsx ASA ID + Algorand indexer (unico finding rimasto con codice)
Sessione Nuova → in attesa di istruzioni — Finding #3 chiuso, #4 bloccato, #5 a Fontanin
