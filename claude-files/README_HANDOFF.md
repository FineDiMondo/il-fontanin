# HANDOFF CLAUDE → GEMINI-ANTIGRAVITY — El Fontanin
Data: 4 luglio 2026 | Origine: sessione Claude (analisi UX + test Visitatore)
Destinazione locale prevista: D:\Progetti GCloud\fontanin\handoff-gemini\

## MANIFEST

| File | Destinazione nel progetto | Stato verifica |
|---|---|---|
| fontanin-tokens.css | src/styles/fontanin-tokens.css | Contrasti WCAG AA calcolati; da importare in main.jsx PRIMA di index.css |
| WalletCard.jsx | src/components/WalletCard.jsx | Sintassi verificata (esbuild); consuma WalletContext: isConnected, connectWallet(), address |
| LoginBanner.jsx | src/components/LoginBanner.jsx | Sintassi verificata (esbuild); sostituisce i 3 banner in ForumCategory/ForumThread/EventDetail |
| test_visitatore.py | root progetto (accanto a test_backend.py) | ESEGUITO live contro Cloud Run: 26 passed, 1 xfailed (7.99s) |
| ADR-001_Fontanin_Algorand_Wallet.docx | docs/ o repo GitHub | Decisione architetturale wallet MPC non-custodial (Opzione B approvata) |

## FINDING APERTI (da non perdere nel passaggio)
1. CRITICO — index.html contiene "maximum-scale=1.0, user-scalable=no":
   blocca lo zoom, violazione WCAG 1.4.4. Rimuovere.
2. OpenAPI marca [AUTH] rotte servite pubblicamente (forum/categories,
   forum/search, events GET, research/experiments GET): allineare la spec
   dichiarando security opzionale. Il test xfail in test_visitatore.py
   passera' automaticamente dopo la correzione (rimuovere poi il decoratore).
3. GOVERNANCE — GET /community/research/experiments e' pubblico: verificare
   con il Consiglio Direttivo se la visibilita' anonima degli esperimenti
   sociali e' intenzionale.
4. GOVERNANCE — Policy di recovery del wallet (ADR-001, sez. Conseguenze):
   NON implementare autonomamente, attende delibera del Consiglio.
5. TODO nel codice — WalletCard.jsx: saldo token "f" richiede ASA ID
   Mainnet + chiamata indexer Algorand.

## VINCOLI DI ESECUZIONE
- Branch dedicato, nessun commit diretto su main.
- Non modificare la logica di AuthContext/RBAC: i componenti la consumano
  in sola lettura.
- Un solo scrittore attivo per modulo: se un altro task sta toccando
  Auth/Firestore rules, fermarsi e segnalare.
