# WORK ORDER — Piano di Sviluppo AT-STRUTTURA-006
## Riorganizzazione 9 Regni / Yggdrasil — El Fontanin

| Campo | Valore |
|---|---|
| Basato su | AT-STRUTTURA-006_Riorganizzazione-9-Regni-Yggdrasil.md (commit `010738c`, R9 completa: Antigravity APPROVATO, Codex APPROVATO) |
| Sviluppo e Test | Gemini/Antigravity (assegnazione consigliata, vedi nota in fondo) |
| Metodo | 5 Work Order sequenziali (WO-0…WO-4), ciascuno rilasciabile e testabile da solo, un solo branch/scrittore alla volta (AGENTS.md R1/R2/R7) |
| Deploy | Nessuno step implica deploy automatico; ogni promozione develop→certification→production richiede autorizzazione esplicita di Daniel in sessione (R3/R8) |

---

## WO-0 — Fondamenta Dati (schema + seed)

**Scope**: solo schema e dati, nessuna UI.
- Migrazione Alembic: `struttura_regni`, `struttura_regno_categorie` (AT §2), `community_event_catalogo_schede` (AT §4), estensione `CommunityEvent` (`stato`, `validato_da`, `validato_at`, `nota_validazione`), campo `is_segnaposto` su `CatalogoScheda` (AT §10)
- Seed: 9 regni con mapping categorie finale (AT §3), scheda segnaposto Asgard/monumenti-cristiani (`is_segnaposto=true`), seed minimo Vanaheim/Helheim (AT §6bis)
- Branch: `feature/struttura-006-wo0-schema`

**Gate di uscita**: migrazione Alembic applicata su DB dev senza errori; `pytest` esistenti tutti verdi (nessuna regressione su catalogo/competenze); seed verificato con query manuale (9 regni, 7 categorie assegnate una sola volta).

## WO-1 — Home a griglia 9 regni (Step 1 AF)

**Scope**: solo frontend, nessuna route esistente spostata.
- `Home.jsx` trasformata in griglia 3x3 simmetrica + accesso Yggdrasil (AT §8, §5bis colori per regno)
- `RegnoDashboard.jsx` nuovo, hub base per ciascun regno (inclusi Asgard/Svartálfheim navigabili, AT §4bis)
- Branch: `feature/struttura-006-wo1-home`

**Gate di uscita**: `npm run build` senza warning nuovi; 375px no overflow orizzontale; click su ogni tile porta a `/regno/:codice` funzionante (anche se vuoto di contenuto per ora).

## WO-2 — Catalogo filtrato per regno + Yggdrasil (Step 2-3 AF)

**Scope**: backend + frontend, catalogo.
- Backend: `GET /community/catalogo/schede` esteso con `regno_codice`/`categoria_codice`/`categorie` + regola anti-ambiguità (400 se filtri multipli), nuovo router `GET /community/struttura/regni` (AT §6, §2)
- Frontend: `CatalogoVista.jsx`, `CatalogoMap.jsx` (estratti da `Catalogo.jsx`), integrati in `RegnoDashboard` e in `Yggdrasil.jsx`/`YggdrasilCatalogo.jsx`
- Branch: `feature/struttura-006-wo2-catalogo-regni`

**Gate di uscita**: `/regno/niflheim` mostra solo schede `idrico`; `/yggdrasil` mostra tutto il catalogo; test filtro anti-ambiguità (2 parametri insieme → 400); nessuna regressione su `/catalogo` esistente (resta invariata, AT §9).

## WO-3 — Eventi: RBAC + relazione N:N (Step 4 AF)

**Scope**: il work order più delicato — cambio RBAC dichiarato.
- Backend: `POST /events` passa a `require_socio` (crea `bozza`), nuovo `POST /events/{id}/valida` (`require_admin`), join table `community_event_catalogo_schede`, validazione ≥1 scheda per pubblicare (AT §4, §5)
- Frontend: `EventForm.jsx` con selettore schede obbligatorio (min 1), marker multipli in mappa (AT §7)
- Migrazione dati: script dry-run `migrate_events_catalogo_links.py`, match automatico + fallback su scheda segnaposto Asgard con `is_segnaposto` escluso dal rendering mappa (AT §10)
- Branch: `feature/struttura-006-wo3-eventi-rbac`

**Gate di uscita**: test RBAC completo (socio crea bozza, non pubblica direttamente; admin valida e pubblica); test evento multi-scheda → N marker con popup distinti; test evento legacy migrato → non genera marker falso in mappa, compare in lista con "luogo non ancora catalogato"; nessun evento pubblicato senza scheda collegata (verifica a DB).

## WO-4 — Redirect Step 5 + rifiniture

**Scope**: ultimo, solo dopo che WO-1…WO-3 sono passati da peer review.
- Routing corretto `/regno/:codice/*` con `RegnoSectionRouter` a route esplicite nidificate (AT §8, copre forum/thread, chat/:slug, events/:id)
- Redirect client-side tabella completa AT §9 (incluso `/mappa → /regno/alfheim/mappa` corretto)
- `CatalogoValidazione.jsx` allineato a validatori di dominio, non solo admin (rilievo Codex, AT §1)
- Branch: `feature/struttura-006-wo4-redirect`

**Gate di uscita**: nessuna route storica restituisce 404; redirect verificati uno a uno sulla tabella AT §9; QR/link eventi già condivisi (`/events/:id`) restano validi come alias; build e test E2E completi passano.

---

## Regole trasversali a tutti i WO

- Un solo branch/scrittore alla volta (R1); check-in/out in AGENTS.md per ogni WO (R2)
- Ogni WO rientra in `develop` via PR, mai commit diretto su `main` (R3/R7)
- Nessuna promozione a `certification`/`production` senza autorizzazione esplicita di Daniel nella sessione corrente (R8)
- Prima di iniziare un WO, verificare che il precedente sia DONE e il working tree pulito

---

## Nota — Quale agente assegnare allo sviluppo

**Consigliato: Gemini/Antigravity**, per tre ragioni concrete, non di preferenza astratta:

1. È già l'agente designato per "Sviluppo e Test" in tutti gli AT precedenti di questo progetto (AT-CATALOGAZIONE-001, AT-COMPETENZE-002) — mantenere la stessa assegnazione evita di disperdere il contesto implementativo tra due agenti diversi a metà percorso.
2. Ha già consegnato in questo repo, da solo, l'intero motore di catalogazione, Canzoniere/Ricettario, la Galleria Media e la Home Dashboard Phase 1B (vedi STORICO SESSIONI in AGENTS.md) — track record di feature full-stack complete, non solo infrastruttura.
3. Ha gestito in autonomia deploy e promozione tra ambienti (develop→certification→production) più volte: WO-4 in particolare richiede questa disciplina end-to-end.

**Ruolo per Codex**: la sua review ha individuato tutti e 3 i problemi tecnici reali di questa AT (schema mancante, routing multi-segmento, marker falsi) — più rigoroso di Antigravity su questi dettagli. Consiglio di tenerlo come **secondo paio d'occhi in code review su WO-3 e WO-4** (i due più a rischio: cambio RBAC ed eventi, e routing con redirect), non come sviluppatore primario — evita di duplicare lo sforzo di implementazione mantenendo comunque il beneficio della sua attenzione ai dettagli.
