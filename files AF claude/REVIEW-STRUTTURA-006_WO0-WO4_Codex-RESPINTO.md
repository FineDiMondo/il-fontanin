# Peer Review Codice — AT-STRUTTURA-006 WO-0..WO-4 (Gemini/Antigravity)
## Esito: RESPINTO — blocco handoff/deploy fino a correzione P1

| Campo | Valore |
|---|---|
| Reviewer primario | Codex |
| Verifica indipendente | Claude/Cowork (tutti i finding confermati, 1 finding aggiuntivo trovato) |
| Ambito | Commit `6491b4b`..`1277c5d` (WO-0 Fondamenta Dati → WO-4 Redirect) |
| Verdetto | RESPINTO per ora — nessun P1 può passare a WO successivi o a promozione develop→certification senza correzione |

---

## P1 — Bloccanti (confermati indipendentemente da Claude/Cowork)

1. **Redirect legacy verso il regno sbagliato** (`src/App.jsx` righe 89-105). Verificato riga per riga contro AF-STRUTTURA-006 §5 e AT-STRUTTURA-006 §3:

   | Route | Regno atteso (AF/AT) | Regno implementato | Corretto? |
   |---|---|---|---|
   | `/research` | Helheim | Midgard | NO |
   | `/events` | Midgard | Asgard | NO |
   | `/geologia` | Vanaheim | Svartalfheim | NO |
   | `/lavori` | Jötunheim | Svartalfheim | NO |
   | `/canzoniere` | Álfheim | Jotunheim | NO |
   | `/ricettario` | Muspelheim | Vanaheim | NO |
   | `/media` | Svartálfheim | Vanaheim | NO — **rilievo aggiuntivo di Claude/Cowork, non era nella lista di Codex** |
   | `/catalogo` | invariata, nessun redirect (decisione Daniel esplicita, AT §9) | redirect a `/yggdrasil` (`App.jsx` riga 114) | NO |

   Pattern: sembra una rotazione sistematica delle etichette regno tra le route, non 7 errori isolati — probabile copia-incolla della tabella con un disallineamento di riga.

2. **Route parametriche che scartano i parametri** (`App.jsx` riga 92-93, 98). `/forum/:slug`, `/forum/thread/:id`, `/events/:id` reindirizzano tutti alla pagina indice del regno, perdendo lo slug/id. Il commento nel codice stesso ("Da fixare in futuro con wildcard") conferma che lo Step 5 non è completo. Rompe bookmark, notifiche e QR già condivisi — esattamente il rischio che l'AT §9 chiedeva di evitare.

3. **Crash runtime su creazione evento** (`App.jsx` riga 67). `<EventCreate />` usato in `RegnoSectionRouter` ma **mai importato** — verificato: nessuna riga `import EventCreate` tra le righe 1-34. `npm run build` passa (Vite non sempre cattura riferimenti a componenti non definiti se il bundling non forza la risoluzione a build-time in questo setup), ma la route va in `ReferenceError` a runtime. Route completamente non funzionante.

4. **RBAC eventi non conforme alla decisione approvata** (`community_module/api/events.py` riga 140). Verificato:
   ```python
   stato="bozza" if current_user.ruolo != "admin" else "pubblicato",
   ```
   Un admin che crea un evento lo pubblica direttamente, bypassando il flusso bozza→valida. L'AT (§5) non prevede questa eccezione: il commento nel codice stesso mostra l'incertezza dello sviluppatore ("Il piano dice 'crea bozza'... Facciamo bozza per i soci"), segno che la decisione non era chiara in fase di implementazione — colpa del gap, non solo dell'esecuzione.
   Aggravante verificata: righe 147-149, `schede_ids` inseriti nella join senza verificare che le schede esistano in `catalogo_schede` e siano `stato="pubblicato"` — un evento può collegarsi a UUID inesistenti o a schede in bozza.

5. **Test aggiunti non riproducibili come gate CI** (`tests/test_struttura_006_wo2.py`). Riprodotto identico all'esito di Codex:
   - `test_anti_ambiguita`: chiama `/community/schede` invece di `/community/catalogo/schede` → 404 invece di 400 (bug nel test, la feature reale è corretta e verificata da Claude/Cowork in catalogo.py)
   - `test_get_regni`: nessun mock della sessione DB, tenta una connessione reale a Cloud SQL (`35.241.200.140:5432`) e fallisce per assenza di password nell'ambiente locale — non è un test unitario/di integrazione isolato, non passa in CI né in locale senza credenziali di produzione

## P2 — Non bloccanti ma da correggere prima del prossimo giro

6. **Contratto API regni incoerente con la documentazione**: l'AT-STRUTTURA-006 in alcuni punti (§5, §12 checklist) cita `GET /community/regni`, mentre l'implementazione reale (corretta, coerente con lo schema §2/§6) espone `GET /community/struttura/regni`. Questa è una incoerenza nel documento AT stesso, non nel codice — da correggere nell'AT: standardizzare ovunque su `/community/struttura/regni`.
7. **Bytecode Python committato**: `community_module/__pycache__/__init__.cpython-312.pyc`, `community_main.cpython-312.pyc`, `auth/__pycache__/__init__.cpython-312.pyc`, `models/__pycache__/__init__.cpython-312.pyc` — confermato con `git ls-files`. Regressione di igiene repo, va aggiunto `__pycache__/` a `.gitignore` se non già presente e rimossi dal tracking.

---

## Verifiche eseguite (Codex + Claude/Cowork, convergenti)

- `npm run build`: OK, solo warning preesistenti (eval vm-browserify, chunk >500kB) — **non rileva** il bug EventCreate (mancata risoluzione a build-time)
- `python -m pytest` (suite completa, `--ignore=claude-files` per evitare conflitto duplicato `test_visitatore.py`): 56 passed, 2 skipped, 2 failed — failure su `test_security_fix.py` è debito preesistente (URL senza prefisso `/community`, rotto da prima di WO-0, verificato al commit `010738c`), non causato da questo lavoro
- `python -m pytest tests/test_struttura_006_wo2.py -q` isolato: 2 failed, riprodotto identico da entrambi i reviewer
- Ispezione diretta codice: tutti i 7+1 redirect, l'import mancante, la logica RBAC, i `.pyc` — confermati riga per riga

## Prossimo passo (Round 1)

Nessun handoff a WO successivi né promozione `develop`→`certification` finché i 5 P1 non sono corretti. Il fix è a carico di Gemini/Antigravity (stesso sviluppatore, correzione mirata sui punti 1-5); Codex e Claude/Cowork rifanno una seconda passata di verifica sulla correzione prima di riaprire il flusso.

---

## Round 2 — Esito: RESPINTO, ma molto più vicino (commit `355fa8b`)

Gemini/Antigravity ha corretto tutti i 5 P1 del Round 1 (redirect regno corretti con preservazione path via `RedirectLegacy`, `EventCreate` importato, RBAC bozza/valida, `.pyc` rimossi dal tracking, test WO-2 riparati) — confermato: `python -m pytest tests -q` → 27 passed, 2 skipped. Restano però nuovi bloccanti, tutti verificati indipendentemente da Claude/Cowork sul codice reale:

### P1 — Nuovi/residui

1. **Bozze evento visibili via dettaglio pubblico** (`community_module/api/events.py` riga 98). Verificato: `get_event` controlla solo `if not ev.pubblico and (not current_user or current_user.ruolo == "guest")` — **non controlla mai `ev.stato`**. Un evento in `bozza` con `pubblico=True` è leggibile da chiunque conosca l'UUID, inclusi guest non autenticati. Contraddice l'AT (§5): "GET /events/{id} — pubblico se pubblicato, altrimenti creatore/admin". Manca completamente la clausola stato.
2. **Routing Step 5 ancora incompleto** (`src/App.jsx`). Verificato riga per riga:
   - `/bar`, `/dona`, `/guida`, `/numeri-utili`, `/profilo` restano route root (righe 113-130), MAI redirette a `/regno/midgard/...` (dona, numeri-utili) o `/regno/asgard/...` (guida, profilo) come da AT §9
   - `/media/*` ora reindirizza a `/regno/svartalfheim/media` (riga 108) — **regressione nuova**: il Round 1 aveva sbagliato il regno target, ma la correzione doveva essere "nessun redirect" (AT §9: "`/media` | invariata"), non "redirect al regno giusto". Il fix ha risolto il sintomo sbagliato.

### P2 — Non bloccanti

3. **Default schema eventi incoerente** (`community_module/models/community_models.py` riga 260): `CommunityEvent.stato` default resta `"pubblicato"`, mentre l'AT richiede default `"bozza"`. La route `POST /events` forza comunque `bozza` lato applicativo, quindi il rischio pratico è basso, ma il modello non riflette la regola di business — rischio se in futuro un altro path di scrittura (script, admin panel, migrazione) crea righe senza passare da quella route.
4. **Gate WO-3 non coperto da test**: confermato, nessun file test per eventi in `tests/` (`test_struttura_006_wo2.py` copre solo WO-2). Il flusso critico — socio crea bozza, guest non vede bozza, admin valida, evento pubblicato compare — non ha mai avuto un test dedicato. Se ci fosse stato, avrebbe intercettato il P1 #1 sopra prima della review manuale.

**Verifiche eseguite da Claude/Cowork**: lettura diretta di `events.py` (bozza visibility), `App.jsx` (routing completo righe 93-131), `community_models.py` (default stato) — tutti i 4 punti di Codex confermati esatti, nessun finding aggiuntivo trovato questa volta.

**Prossimo passo (Round 2)**: stesso schema del Round 1 — fix a carico di Gemini/Antigravity sui 2 P1 residui (bozza visibility, routing Step 5 completo incl. correzione `/media`), poi terza passata di verifica prima di sbloccare handoff/promozione.
