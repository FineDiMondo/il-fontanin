# Piano di Test Develop - AT-STRUTTURA-006

**Versione:** 1.0  
**Data:** 2026-07-13  
**Autore:** Codex  
**Ambito:** test completo post-rilascio in `develop` della riorganizzazione 9 Regni / Yggdrasil.  
**Riferimenti:** `files AF claude/AT-STRUTTURA-006_Riorganizzazione-9-Regni-Yggdrasil.md`, `files AF claude/WORK-ORDER-STRUTTURA-006_Piano-Sviluppo.md`, `docs/ENVIRONMENTS.md`, `docs/DEPLOY.md`, `AGENTS.md`.

Questo documento prepara la finestra di test successiva al rilascio in sviluppo. Non autorizza deploy: ogni rilascio resta soggetto ad AGENTS.md R3/R8 e ad autorizzazione esplicita nella sessione corrente.

## 1. Obiettivo

Verificare end-to-end che AT-STRUTTURA-006 sia correttamente rilasciata in ambiente `develop`, senza regressioni sui percorsi esistenti.

La verifica copre:

- Home trasformata in griglia 3x3 dei 9 regni.
- Route `/regno/:codice` e sezioni annidate via `RegnoSectionRouter`.
- Vista Yggdrasil separata da `/catalogo`.
- Filtro catalogo per `regno_codice`, `categoria_codice`, `categorie`.
- Endpoint pubblico `GET /community/struttura/regni`.
- Nuova relazione N:N Eventi -> Schede catalogo.
- RBAC eventi: socio crea bozza, admin valida/pubblica, guest non vede bozze.
- Marker multipli in mappa per eventi collegati a piu schede.
- Redirect client-side Step 5, inclusa preservazione di slug/id.
- Non regressione su `/catalogo`, `/media`, login, forum, chat, eventi, canzoniere, ricettario, bar, numeri utili, dona, guida, profilo.

## 2. Ambiente target

| Campo | Valore |
|---|---|
| Stage | `develop` |
| Branch sorgente atteso | `develop` |
| Backend develop | `https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app` |
| Backend health | `https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/health` |
| Frontend develop | `https://el-fontanin--develop-5nnaa48o.web.app` |
| DB applicativo | `jackass_verona_develop` |
| Regola deploy | nessun deploy implicito da questo piano |

Prima della finestra di test, confermare in `docs/ENVIRONMENTS.md` che gli URL siano ancora validi. Se il canale Firebase develop cambia URL, aggiornare l'evidenza di esecuzione, non questo piano storico.

## 3. Ruoli e account necessari

| Ruolo | Uso nel test | Prerequisito |
|---|---|---|
| Guest / finestra anonima | navigazione pubblica, catalogo pubblicato, eventi pubblicati, blocco bozze | nessun login |
| Socio | creazione evento in bozza, accesso a chat/profilo dove previsto | account `ruolo=socio` su develop |
| Admin | validazione evento, accesso a profilo/admin, verifica bozze | account `ruolo=admin` su develop |

Gli account reali non devono essere scritti in questo documento. Durante la finestra di test, registrarli solo come alias operativi: `GUEST`, `SOCIO_DEV`, `ADMIN_DEV`.

## 4. Dati minimi richiesti

La finestra di test deve partire solo se questi dati sono presenti in `develop`.

| ID | Dato | Verifica |
|---|---|---|
| D0.1 | 9 righe in `struttura_regni` | `GET /community/struttura/regni` restituisce 9 regni attivi |
| D0.2 | Mappatura categorie-regni coerente | tutte le 7 categorie tecniche assegnate una sola volta |
| D0.3 | Almeno 1 scheda pubblicata per Asgard, Vanaheim, Niflheim, Helheim, Alfheim o Svartalfheim dove disponibile | necessaria per test filtro catalogo |
| D0.4 | Scheda segnaposto Asgard con `is_segnaposto=true` | necessaria per migrazione eventi legacy |
| D0.5 | Almeno 2 schede pubblicate reali con coordinate valide | necessarie per test evento multi-scheda e marker multipli |
| D0.6 | Nessun evento pubblicato senza riga in `community_event_catalogo_schede` | controllo integrita dati |

Se D0.3 non e pienamente soddisfatto per un regno ancora vuoto, il test UI del regno deve verificare l'empty state esplicito, non fallire per assenza di contenuto.

## 5. Gate di ingresso

| ID | Gate | Comando / controllo | Esito atteso |
|---|---|---|---|
| G0.1 | Working tree locale pulito | `git status --short --branch` | nessuna modifica pendente |
| G0.2 | Build locale | `npm run build` | OK; solo warning preesistenti chunk/eval |
| G0.3 | Test backend locali | `python -m pytest tests -q` | tutti verdi, skip attesi documentati |
| G0.4 | Test eventi locali | `python -m pytest tests/test_events_flow.py -q` | 4 passed |
| G0.5 | Whitespace | `git diff --check` | nessun errore |
| G0.6 | Deploy develop completato | GitHub Actions `deploy-develop.yml` | run verde |
| G0.7 | Backend vivo | `GET /community/health` | HTTP 200 |
| G0.8 | Frontend vivo | apertura URL develop in finestra browser | app caricata, nessuna pagina bianca |

## 6. Convenzione esiti ed evidenze

Ogni test va marcato:

- `PASS`: esito atteso rispettato.
- `FAIL`: esito atteso non rispettato, allegare URL, utente, screenshot/log e severita.
- `BLOCKED`: non eseguibile per ambiente, dati mancanti o account indisponibile.
- `N/A`: non applicabile per decisione esplicita.

Evidenze minime:

- Output dei comandi per test automatici e API.
- Screenshot desktop e mobile per Home, RegnoDashboard, Yggdrasil, Mappa, EventCreate.
- URL finale dopo redirect per ogni route legacy.
- Utente/ruolo usato, senza credenziali.
- Eventuali errori console browser o network HTTP 4xx/5xx.

## 7. Smoke tecnico post-rilascio

| ID | Area | Procedura | Esito atteso |
|---|---|---|---|
| S1 | Health backend | `GET <backend>/community/health` | 200 |
| S2 | Categorie catalogo | `GET <backend>/community/catalogo/categorie` | 7 categorie attive |
| S3 | Regni | `GET <backend>/community/struttura/regni` | 9 regni ordinati, pubblici, con categorie associate |
| S4 | Catalogo pubblico | `GET <backend>/community/catalogo/schede?stato=pubblicato` | 200, lista anche vuota ma JSON valido |
| S5 | Eventi pubblici | `GET <backend>/community/events?upcoming=true&per_page=20` | 200, solo eventi pubblicati |
| S6 | Frontend | aprire frontend develop | Home caricata, nessun errore bloccante in console |
| S7 | Bundle config | da frontend chiamare API develop, non production | Network tab mostra host backend develop |

## 8. Test dati e API

### 8.1 Struttura regni

| ID | Procedura | Esito atteso |
|---|---|---|
| API-R1 | `GET /community/struttura/regni` da guest | 200 senza token |
| API-R2 | Contare elementi `codice` | esattamente 9 codici: `asgard`, `vanaheim`, `alfheim`, `midgard`, `jotunheim`, `svartalfheim`, `niflheim`, `muspelheim`, `helheim` |
| API-R3 | Verificare `ordine` | valori univoci e ordinabili 1..9 |
| API-R4 | Verificare categorie associate | `vanaheim:naturale`, `niflheim:idrico`, `helheim:storico+militare`, `asgard:monumenti-cristiani`, `alfheim:culturale`, `svartalfheim:economico`; nessuna categoria duplicata |

### 8.2 Catalogo filtrato

| ID | Procedura | Esito atteso |
|---|---|---|
| API-C1 | `GET /community/catalogo/schede?stato=pubblicato&regno_codice=niflheim` | solo schede categoria `idrico` |
| API-C2 | `GET /community/catalogo/schede?stato=pubblicato&regno_codice=helheim` | solo schede categorie `storico` o `militare` |
| API-C3 | `GET /community/catalogo/schede?stato=pubblicato&categoria_codice=naturale` | solo schede categoria `naturale` |
| API-C4 | `GET /community/catalogo/schede?stato=pubblicato&categorie=storico,militare` | solo schede `storico` o `militare` |
| API-C5 | `GET /community/catalogo/schede?regno_codice=vanaheim&categoria_codice=naturale` | 400 con messaggio anti-ambiguita |
| API-C6 | `GET /community/catalogo/schede?stato=bozza` senza token | 401 |
| API-C7 | `GET /community/catalogo/schede?stato=bozza` con socio non autore/non validatore | 200 con lista vuota o solo schede autorizzate |
| API-C8 | `/catalogo`, `/catalogo/nuovo`, `/catalogo/validazione`, `/catalogo/scheda/:id` | restano route operative, non redirect a Yggdrasil |

### 8.3 Eventi RBAC e relazione N:N

| ID | Ruolo | Procedura | Esito atteso |
|---|---|---|---|
| API-E1 | Guest | `GET /community/events` | solo eventi `stato=pubblicato`, nessuna bozza |
| API-E2 | Socio | `POST /community/events` senza `schede_ids` | 400, almeno una scheda richiesta |
| API-E3 | Socio | `POST /community/events` con `schede_ids` di scheda inesistente | 400 |
| API-E4 | Socio | `POST /community/events` con scheda non pubblicata | 400 |
| API-E5 | Socio | `POST /community/events` con 1 scheda pubblicata | 200/201, evento creato in `bozza`, non pubblicato |
| API-E6 | Guest | `GET /community/events/{id_bozza}` | 403 |
| API-E7 | Autore socio | `GET /community/events/{id_bozza}` | 200 |
| API-E8 | Admin | `GET /community/events/{id_bozza}` | 200 |
| API-E9 | Admin | `POST /community/events/{id}/valida` su evento con >=1 scheda | stato diventa `pubblicato`, `validato_da` e `validato_at` valorizzati |
| API-E10 | Guest | `GET /community/events/{id_pubblicato}` | 200 |
| API-E11 | Socio | Iscrizione a evento pubblicato | 200, iscrizione confermata o lista attesa |
| API-E12 | Admin | Validazione evento senza schede collegate | 400, pubblicazione bloccata |

### 8.4 Migrazione eventi legacy

| ID | Procedura | Esito atteso |
|---|---|---|
| API-M1 | Eseguire `scripts/migrate_events_catalogo_links.py --dry-run` su develop o copia develop | stampa match/fallback senza commit |
| API-M2 | Verificare evento legacy senza match | collegabile alla scheda segnaposto Asgard |
| API-M3 | Verificare evento legacy con scheda segnaposto | compare in lista eventi, ma non produce marker geografico falso in mappa |
| API-M4 | Query DB su eventi pubblicati senza join | risultato 0 |

## 9. Test frontend in finestra browser

Questi test vanno eseguiti dopo il rilascio in sviluppo, in finestra browser reale. Usare almeno:

- Desktop: larghezza circa 1440px.
- Mobile: viewport circa 375px.
- Una finestra anonima per test guest.
- Una sessione autenticata socio.
- Una sessione autenticata admin.

### 9.1 Home e navigazione regni

| ID | Ruolo | Procedura | Esito atteso |
|---|---|---|---|
| UI-H1 | Guest | Aprire `/` | griglia 3x3 con 9 regni, accesso Yggdrasil distinto |
| UI-H2 | Guest | Cliccare ogni tile regno | apre `/regno/:codice`, nessuna pagina bianca |
| UI-H3 | Guest | Mobile 375px | nessun overflow orizzontale; tile leggibili e tappabili |
| UI-H4 | Guest | Aprire `/regno/asgard` e `/regno/svartalfheim` | entrambi navigabili come hub |
| UI-H5 | Guest | Aprire codice regno inesistente `/regno/foo` | empty state "Regno non trovato" o fallback coerente, niente crash |

### 9.2 RegnoDashboard e catalogo filtrato

| ID | Ruolo | Procedura | Esito atteso |
|---|---|---|---|
| UI-R1 | Guest | `/regno/niflheim` | catalogo mostra solo contenuti idrici o empty state esplicito |
| UI-R2 | Guest | `/regno/helheim` | catalogo mostra storico/militare o empty state esplicito |
| UI-R3 | Guest | `/regno/asgard` | catalogo monumenti cristiani, incluso pilot se seed presente |
| UI-R4 | Guest | `/regno/svartalfheim` | catalogo economico o empty state esplicito |
| UI-R5 | Guest | `/regno/midgard`, `/regno/jotunheim`, `/regno/muspelheim` | non crashano anche senza categoria catalogo assegnata |

### 9.3 Yggdrasil e catalogo invariato

| ID | Ruolo | Procedura | Esito atteso |
|---|---|---|---|
| UI-Y1 | Guest | Aprire `/yggdrasil` | vista aggregata caricata |
| UI-Y2 | Guest | Confrontare `/yggdrasil` e `/regno/niflheim` | Yggdrasil non e filtrato a un solo regno |
| UI-Y3 | Guest | Aprire `/catalogo` | resta motore catalogazione, non redirect a `/yggdrasil` |
| UI-Y4 | Socio | Aprire `/catalogo/nuovo` | form catalogo accessibile solo a socio/admin |
| UI-Y5 | Admin | Aprire `/catalogo/validazione` | coda validazione accessibile |

### 9.4 Redirect Step 5

Verificare sia URL finale sia rendering della pagina. Per i redirect con parametri, verificare che slug/id siano preservati.

| ID | Route vecchia | Route attesa | Esito atteso |
|---|---|---|---|
| UI-D1 | `/storia` | `/regno/helheim/storia` | render Storia |
| UI-D2 | `/research` | `/regno/helheim/research` | render Research |
| UI-D3 | `/forum` | `/regno/midgard/forum` | render Forum |
| UI-D4 | `/forum/<slug>` | `/regno/midgard/forum/<slug>` | slug preservato, render categoria forum |
| UI-D5 | `/forum/thread/<id>` | `/regno/midgard/forum/thread/<id>` | id preservato, render thread |
| UI-D6 | `/chat` | `/regno/midgard/chat` | guest rediretto a login o socio vede Chat |
| UI-D7 | `/chat/<slug>` | `/regno/midgard/chat/<slug>` | slug preservato |
| UI-D8 | `/events` | `/regno/midgard/events` | render Events |
| UI-D9 | `/events/<id>` | `/regno/midgard/events/<id>` | id preservato, render EventDetail |
| UI-D10 | `/mappa` | `/regno/alfheim/mappa` | render Mappa |
| UI-D11 | `/geologia` | `/regno/vanaheim/geologia` | render Geologia |
| UI-D12 | `/analisi-acqua` | `/regno/niflheim/analisi-acqua` | render Analisi Acqua |
| UI-D13 | `/lavori` | `/regno/jotunheim/lavori` | render LavoriProgetto |
| UI-D14 | `/canzoniere` | `/regno/alfheim/canzoniere` | render Canzoniere |
| UI-D15 | `/ricettario` | `/regno/muspelheim/ricettario` | render Ricettario |
| UI-D16 | `/bar` | `/regno/muspelheim/bar` | render Bar |
| UI-D17 | `/dona` | `/regno/midgard/dona` | render Dona |
| UI-D18 | `/numeri-utili` | `/regno/midgard/numeri-utili` | render NumeriUtili |
| UI-D19 | `/guida` | `/regno/asgard/guida` | render Guida |
| UI-D20 | `/profilo` | `/regno/asgard/profilo` | guest login gate; socio/admin Profilo se feature flag attivo |
| UI-D21 | `/media` | invariata `/media` | nessun redirect a regno |
| UI-D22 | `/catalogo` | invariata `/catalogo` | nessun redirect a `/yggdrasil` |

### 9.5 Eventi UI

| ID | Ruolo | Procedura | Esito atteso |
|---|---|---|---|
| UI-E1 | Socio | Aprire `/regno/midgard/events/nuovo` | form evento visibile |
| UI-E2 | Socio | Provare submit senza schede | errore client "selezionare almeno una scheda" |
| UI-E3 | Socio | Creare evento con una scheda pubblicata | salvataggio in bozza, non visibile nel calendario guest |
| UI-E4 | Guest | Aprire dettaglio bozza tramite URL | 403 o messaggio non autorizzato, non contenuto evento |
| UI-E5 | Admin | Aprire dettaglio bozza | contenuto visibile |
| UI-E6 | Admin | Validare evento via API o UI se presente | evento passa a pubblicato |
| UI-E7 | Guest | Dopo validazione, aprire lista eventi | evento pubblicato visibile se `pubblico=true` |
| UI-E8 | Socio | Iscriversi a evento pubblicato | iscrizione confermata o lista attesa, nessun 500 |

### 9.6 Mappa ed eventi multi-scheda

| ID | Ruolo | Procedura | Esito atteso |
|---|---|---|---|
| UI-MAP1 | Guest | Aprire `/regno/alfheim/mappa` | mappa Leaflet caricata, tile visibili, nessuna icona rotta |
| UI-MAP2 | Guest | Evento pubblicato collegato a 2 schede reali | compaiono 2 marker, popup con stesso evento e nomi scheda distinti |
| UI-MAP3 | Guest | Evento collegato a scheda segnaposto | nessun marker falso per quella scheda |
| UI-MAP4 | Mobile | Aprire mappa a 375px | mappa interagibile, popup non tagliati in modo bloccante |

### 9.7 RBAC e accessi protetti

| ID | Ruolo | Procedura | Esito atteso |
|---|---|---|---|
| UI-A1 | Guest | `/regno/midgard/chat` | redirect login |
| UI-A2 | Socio | `/regno/midgard/chat` | accesso consentito |
| UI-A3 | Guest | `/regno/asgard/profilo` | redirect login |
| UI-A4 | Socio/Admin | `/regno/asgard/profilo` | accesso se `VITE_ENABLE_COMPETENZE_FEATURE=true`; fallback coerente se flag off |
| UI-A5 | Guest | `/catalogo/nuovo` | redirect login |
| UI-A6 | Socio | `/catalogo/nuovo` | accesso consentito |

## 10. Test regressione funzionale

| ID | Area | Procedura | Esito atteso |
|---|---|---|---|
| REG-1 | Login | login/logout con account develop | token gestito correttamente, nessun loop |
| REG-2 | Forum | lettura categorie/thread | 200 e UI usabile |
| REG-3 | Chat | accesso socio | canali/chat room funzionano |
| REG-4 | Catalogo dettaglio | aprire una scheda pubblicata | dettaglio e media non rotti |
| REG-5 | Catalogo create | socio crea bozza scheda | stato bozza, non pubblica direttamente |
| REG-6 | Validazione catalogo | admin valida scheda | stato pubblicato |
| REG-7 | Canzoniere | lista brani | caricata |
| REG-8 | Ricettario | lista ricette | caricata |
| REG-9 | Media | `/media` | route invariata e galleria funzionante se feature flag attivo |
| REG-10 | Numeri utili | vecchia e nuova route | stessa pagina renderizzata |

## 11. Test non funzionali

| ID | Area | Procedura | Esito atteso |
|---|---|---|---|
| NF-1 | Responsivo | Home, RegnoDashboard, Yggdrasil, Mappa a 375px | nessun overflow orizzontale |
| NF-2 | Accessibilita base | navigazione tastiera sui tile e bottoni principali | focus visibile, azioni attivabili |
| NF-3 | Performance percepita | apertura Home e Yggdrasil su develop | niente blocchi lunghi; loading state se API lente |
| NF-4 | Console browser | percorso smoke completo | nessun errore JS bloccante |
| NF-5 | Network | percorso smoke completo | nessun 500; 401/403 solo dove attesi |
| NF-6 | Sicurezza dati | guest non vede bozze eventi o schede | nessun leak contenuto non pubblicato |

## 12. Sequenza operativa della finestra di test

1. Confermare autorizzazione della finestra di test e URL develop.
2. Leggere `AGENTS.md`; se serve scrivere report, fare check-in R2.
3. Eseguire i gate G0 locali.
4. Verificare deploy develop su GitHub Actions e salute backend/frontend.
5. Eseguire smoke tecnico S1-S7.
6. Eseguire API-R, API-C, API-E, API-M con evidenze.
7. Aprire finestra browser desktop e finestra mobile; eseguire UI-H, UI-R, UI-Y, UI-D.
8. Eseguire flussi autenticati socio/admin: UI-E, UI-A, regressione catalogo.
9. Verificare mappa e marker multi-scheda.
10. Compilare report esecuzione con PASS/FAIL/BLOCKED.
11. Se tutti i P0/P1 sono PASS, autorizzare tecnicamente la promozione successiva solo se Daniel lo chiede esplicitamente.

## 13. Criteri di uscita

### Go per chiudere il test develop

- Tutti i gate G0 PASS.
- Nessun P0/P1 aperto.
- Tutti i redirect Step 5 PASS o N/A motivato.
- RBAC eventi e catalogo PASS.
- Nessun evento pubblicato senza scheda collegata.
- `/catalogo` e `/media` invariati.
- Evidenze salvate nel report di sessione.

### No-go

- Pagina bianca o crash su Home, `/regno/:codice`, `/yggdrasil`, `/catalogo`, eventi o mappa.
- Guest vede bozze evento o bozze catalogo non autorizzate.
- Socio crea evento pubblicato direttamente.
- Admin non riesce a validare evento con scheda valida.
- Redirect parametrici perdono slug/id.
- Mappa mostra marker falsi per scheda segnaposto.
- Backend develop usa DB o API production per errore di configurazione.

## 14. Template report di esecuzione

```md
# Report Test Develop - AT-STRUTTURA-006

Data:
Esecutore:
Branch/commit testato:
Frontend develop:
Backend develop:
Browser/viewport:
Account usati: GUEST / SOCIO_DEV / ADMIN_DEV

## Sintesi
- Esito complessivo: PASS / FAIL / BLOCKED
- P0/P1 aperti:
- P2/P3 aperti:
- Decisioni richieste a Daniel:

## Gate
| ID | Esito | Evidenza |
|---|---|---|

## API
| ID | Esito | Evidenza |
|---|---|---|

## UI in finestra
| ID | Esito | Evidenza |
|---|---|---|

## Regressione
| ID | Esito | Evidenza |
|---|---|---|

## Allegati
- Screenshot:
- Log:
- Note:
```

## 15. Punti da confermare prima della finestra

| Punto | Responsabile | Stato |
|---|---|---|
| URL frontend develop aggiornato dopo rilascio | Daniel / agente deploy | Da confermare |
| Account socio e admin disponibili su develop | Daniel | Da confermare |
| Dati minimi D0 presenti o seed eseguito | agente deploy | Da confermare |
| Eventuale uso di dati reali in develop autorizzato/anonimizzato | Daniel | Da confermare |
| Finestra temporale di test | Daniel + Codex | Da pianificare |

