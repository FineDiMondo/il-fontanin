# AT-STRUTTURA-006 — Analisi Tecnica (Sintesi Finale)
## Riorganizzazione dell'Architettura Informativa secondo i 9 Regni (Yggdrasil) — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AT-STRUTTURA-006 |
| Fase | Analisi Tecnica (AT) — Sintesi finale |
| Base | AF-STRUTTURA-006 (commit `6f2f7ee`, branch `develop`) |
| Metodo | 3 draft indipendenti — AT-STRUTTURA-006-DRAFT-HAIKU, -CODEX, -ANTIGRAVITY — sintetizzati qui da Claude/Cowork |
| Dipendenze | AT-CATALOGAZIONE-001 (motore catalogo), AT-COMPETENZE-002 (qualifica Validatore per dominio) |
| Validazione | Da rileggere da Daniel; poi peer review R9 su questa sintesi (Codex + Antigravity/Gemini) prima di sviluppo |
| Sviluppo e Test | Gemini/Antigravity |
| Stack confermato (convergenza dei 3 draft) | FastAPI + SQLAlchemy + PostgreSQL (`community_module`), React + React Router v6, `react-leaflet@4` già in uso in `Mappa.jsx`, RBAC reale a 3 valori (`guest`/`socio`/`admin`) |

---

## Come leggere questo documento

I tre draft convergono sulla maggior parte delle scelte tecniche — quelle sono riportate come **deciso**, con la versione più rigorosa tra le tre come base. Su alcuni punti i draft divergono in modo sostanziale: quelli sono riportati come **decisione aperta**, con le tre proposte a confronto, perché sono scelte di dominio/prodotto che spettano a Daniel, non normalizzabili a tavolino da un AT.

---

## 1. Rilievo Tecnico Critico (convergenza dei 3 draft + dettagli aggiuntivi di Codex)

Confermato da tutti e tre i draft, indipendentemente:
- Backend FastAPI + SQLAlchemy su PostgreSQL, stesso stack di AT-CATALOGAZIONE-001/AT-COMPETENZE-002
- `react-leaflet@4` già installato e in uso in `Mappa.jsx` e `CatalogForm.jsx` (fix icone Leaflet/Vite già risolto) — nessuna nuova dipendenza mappa
- RBAC reale a 3 valori tecnici: `guest` / `socio` / `admin`. "Validatore" resta qualifica di dominio sopra `socio` (AT-COMPETENZE-002), non un quarto ruolo
- Catalogo: 7 categorie esistenti (`monumenti-cristiani`, `idrico`, `naturale`, `storico`, `culturale`, `economico`, `militare`); `GET /community/catalogo/schede` oggi filtra solo per `categoria_id` singolo, non per liste o per regno
- Eventi: `POST /community/events` richiede oggi `require_admin`; `CommunityEvent.stato` defaulta a `pubblicato`; nessun collegamento a schede catalogo, solo `luogo`/`luogo_online` testuali
- Rotte `/catalogo/*` già attive e operative (`App.jsx`): la riorganizzazione a 9 regni si integra sopra, non sostituisce

**Rilievo aggiuntivo (solo Codex, verificato, da riportare)**: `CatalogoValidazione.jsx` oggi espone la coda di validazione solo ad `admin`, anche se il backend supporta già validatori per dominio (`is_validatore_per_dominio`). Disallineamento preesistente, non introdotto da questa AT — va corretto in sviluppo, segnalato come voce separata nell'handoff (§9).

---

## 2. DECISO da Daniel (2026-07-13) — Tabella PostgreSQL, niente JSON

Confermata **Opzione B**: `struttura_regni` + `struttura_regno_categorie` (schema Codex, §3.1/3.2 sotto), con `UniqueConstraint` su categoria. Motivazione di Daniel: tutti i dati di business/funzionali dell'app vivono su PostgreSQL (già in uso, nessun costo aggiuntivo), inclusi i campi georeferenziati già presenti sulle schede — nessuna configurazione statica JSON per dati che sono comunque di dominio applicativo. Questa regola vale non solo per la mappa regno→categorie ma come principio generale per qualunque nuovo dato funzionale di questa AT: **PostgreSQL, non file di config statici**, salvo puro tema grafico (colori/icone, vedi §5bis).

---

## 3. DECISO da Daniel (2026-07-13) — Assegnazione Categorie ai Regni

Daniel ha chiesto la proposta più logica tra le tre, non una scelta secca — questa è la sintesi che risolve le sovrapposizioni rispettando il vincolo "una categoria = un solo regno" (dal DB constraint di §2):

| Regno | Categoria/e catalogo | Logica |
|---|---|---|
| Vanaheim | `naturale` | Convergenza piena dei 3 draft |
| Niflheim | `idrico` | Convergenza piena dei 3 draft |
| Helheim | `storico` + `militare` | Memoria/antenati include sia storia civile sia tracce militari/fortificazioni/ossari (proposta Codex, la più coerente con "antenati e memoria") |
| Asgard | `monumenti-cristiani` | Sacro/devozione = esattamente il dominio del pilot già esistente (Sant'Andrea, AF-CATALOGAZIONE-001) — nessun altro regno si adatta meglio |
| Álfheim | `culturale` | Bellezza/leggende/folklore si adatta a "culturale" meglio delle tradizioni conviviali (vedi Muspelheim sotto); include anche Canzoniere e la pagina Mappa come contenuto |
| Svartálfheim | `economico` | Mestieri/artigianato/botteghe = attività economica storica, coerente con "fatica manuale produttiva" |
| Jötunheim | nessuna | Contenuto già coperto da pagine dedicate (LavoriProgetto, CompetenzeSection), non da schede di catalogo georeferenziate |
| Muspelheim | nessuna | Ricettario/Bar restano contenuti narrativi standalone, non catalogati (evita la sovrapposizione con `culturale` di Álfheim) |
| Midgard | nessuna | Hub di comunità (Forum/Chat/Events/Dona/NumeriUtili); l'aggregazione di tutte le categorie è già il ruolo di Yggdrasil, Midgard non deve duplicarlo |

Tutte e 7 le categorie tecniche esistenti sono assegnate esattamente una volta (nessun conflitto con il vincolo DB di §2). 3 regni restano senza categoria di catalogo: il loro contenuto vive nelle pagine applicative esistenti, non nel motore di catalogazione.

---

## 4. Deciso — Relazione N:N Eventi ↔ Schede di Catalogo

Convergenza piena dei 3 draft su modello e regole. Schema adottato (versione più completa, da Codex, con indici e vincoli espliciti):

```python
class CommunityEventCatalogoScheda(Base):
    __tablename__ = "community_event_catalogo_schede"
    __table_args__ = (
        UniqueConstraint("event_id", "scheda_id", name="uq_event_scheda"),
        Index("ix_event_schede_event", "event_id"),
        Index("ix_event_schede_scheda", "scheda_id"),
    )

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_id   = Column(UUID(as_uuid=True), ForeignKey("community_events.id", ondelete="CASCADE"), nullable=False)
    scheda_id  = Column(UUID(as_uuid=True), ForeignKey("catalogo_schede.id", ondelete="RESTRICT"), nullable=False)
    ordine     = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())

    event      = relationship("CommunityEvent", back_populates="schede_catalogo")
    scheda     = relationship("CatalogoScheda")
```

Estensione a `CommunityEvent`: `stato` (default `bozza`), `validato_da`, `validato_at`, `nota_validazione`. `luogo`/`luogo_online` restano per display/retrocompatibilità, non più fonte di geolocalizzazione per i nuovi eventi. Collegamento obbligatorio 1..N per la pubblicazione (confermato da Daniel in fase AF).

**Nota tecnica di Codex, adottata**: `ondelete="RESTRICT"` sulla scheda (non `CASCADE`) — se una scheda collegata a un evento pubblicato viene eliminata, l'operazione deve fallire esplicitamente invece di silenziosamente scollegare l'evento.

---

## 5. Deciso — RBAC Eventi (Membro propone / Admin valida)

Convergenza piena. Endpoint consolidati (versione più completa, Codex):

| Metodo | Path | Guard | Comportamento |
|---|---|---|---|
| GET | `/events` | pubblico/opzionale | Default solo `pubblicato`; filtri `regno_codice`, `include_schede=true` |
| GET | `/events/{id}` | pubblico/opzionale | Include `schede`; bozza visibile solo a creatore/admin |
| POST | `/events` | `require_socio` | Crea in `bozza`, richiede `scheda_ids` non vuoto (min 1), collega solo schede `pubblicato` |
| PATCH | `/events/{id}` | creatore se `bozza`, o admin | Aggiorna dati e schede; se respinto torna a `bozza` |
| POST | `/events/{id}/valida` | `require_admin` | `approvato=true` → richiede ≥1 scheda, pubblica; altrimenti respinge con nota |
| DELETE | `/events/{id}` | `require_admin` | Invariato |

Regola di integrità: un evento pubblicato senza almeno una riga in `community_event_catalogo_schede` deve essere strutturalmente impossibile (verificata sia in validazione applicativa sia, se possibile, con vincolo a livello di query di pubblicazione).

**Decisione aperta (segnalata solo da Codex, ma valida)**: l'AF dice "Admin valida/pubblica" — questo AT non introduce un ruolo "Validatore eventi" analogo al Validatore di dominio del catalogo. Se in futuro Daniel vuole delegare la validazione eventi a non-admin, serve un nuovo criterio esplicito (fuori scope qui).

---

## 6. Deciso — Filtro Categoria sul Catalogo Esistente

Adottata la versione più rigorosa (Codex), che copre anche il caso Opzione B della §2:

Parametri esistenti mantenuti invariati: `categoria_id` (UUID singolo, retrocompatibile), `stato`, `bbox`.

Nuovi parametri:

| Parametro | Tipo | Note |
|---|---|---|
| `categoria_codice` | string | filtro singolo per codice leggibile |
| `categorie` | string CSV | lista codici categoria, es. `storico,militare` |
| `regno_codice` | string | risolve la mappa regno→categorie e filtra tutte le categorie del regno |

**Regola anti-ambiguità (adottata)**: accettare un solo filtro di dominio per richiesta tra `categoria_id`, `categoria_codice`, `categorie`, `regno_codice`; se ne arrivano più di uno, rispondere `400`. Nessuno degli altri due draft aveva previsto questa regola esplicitamente, ma previene comportamenti ambigui silenziosi — adottata nella sintesi.

Se si sceglie l'Opzione A della §2 (config statica) invece della tabella DB, il filtro `regno_codice` risolve comunque lato backend leggendo la config statica invece di fare un JOIN — l'interfaccia dell'endpoint resta identica in entrambi i casi.

---

## 7. Deciso — Resa in Mappa di Eventi Multi-Scheda

Convergenza piena dei 3 draft: **marker multipli**, uno per scheda collegata, stesso evento, nessuna gerarchia primaria/secondaria (coerente con la decisione già presa da Daniel in fase AF).

```js
const eventMarkers = events.flatMap((event) =>
  event.schede.map((scheda) => ({
    key: `${event.id}:${scheda.id}`,
    eventId: event.id,
    schedaId: scheda.id,
    title: event.titolo,
    position: [Number(scheda.lat), Number(scheda.lng)],
    regnoCodice: scheda.regno_codice,
  }))
)
```

Popup per ciascun marker: nome evento + nome scheda specifica, così l'utente capisce che l'evento coinvolge più location. Clustering visivo solo se necessario per leggibilità (non introdotto come dipendenza fin da subito, nota di Codex adottata: partire semplice, aggiungere clustering solo se serve).

---

## 8. Deciso — Routing Frontend (nomi standardizzati)

I tre draft usano nomi leggermente diversi (`/regno/:codice` vs `/regni/:regnoCodice`, `RegnoDashboard` vs `RegnoHub`). Standardizzato in questa sintesi su `/regno/:codice` (singolare, coerente con il linguaggio "Livello Regno" già usato in AF-STRUTTURA-006 §4):

```jsx
<Route path="/" element={<Home />} />                          {/* griglia 9 regni + accesso Yggdrasil */}
<Route path="/regno/:codice" element={<RegnoDashboard />} />   {/* hub del regno */}
<Route path="/regno/:codice/:section" element={<RegnoSectionRouter />} />  {/* pagine migrate, Step 5 */}
<Route path="/yggdrasil" element={<Yggdrasil />} />
<Route path="/yggdrasil/catalogo" element={<YggdrasilCatalogo />} />
```

Componenti nuovi (nomi consolidati):

| File | Responsabilità |
|---|---|
| `src/pages/Home.jsx` | Griglia 3x3 regni + accesso distinto Yggdrasil (trasformazione di contenuto, non nuova pagina) |
| `src/pages/RegnoDashboard.jsx` | Hub del regno: sezioni/pagine migrate + catalogo filtrato se il regno ha categorie |
| `src/pages/RegnoSectionRouter.jsx` | Mappa `"regno/sezione" -> Componente esistente`, per riusare le pagine già scritte senza duplicarle (Step 5) |
| `src/pages/Yggdrasil.jsx` / `YggdrasilCatalogo.jsx` | Vista aggregata, nessun filtro |
| `src/components/catalogo/CatalogoVista.jsx` | Estrae lista/filtri/mappa da `Catalogo.jsx`, riusabile da RegnoDashboard e Yggdrasil (props: `regnoCodice`, `categorieCodici`, `scope`) |
| `src/components/catalogo/CatalogoMap.jsx` | Mappa Leaflet riusabile (schede + marker eventi multi-scheda), stesso fix icone di `Mappa.jsx` |
| `src/components/events/EventForm.jsx` | Form evento con selettore schede obbligatorio (min 1), submit sempre in bozza per soci |
| `src/hooks/useRegni.js` | Hook per caricare i 9 regni (da config statica o da `GET /community/regni`, a seconda della §2) |

**Correzione rispetto al draft Antigravity**: quel draft propone il redirect `/mappa → /yggdrasil`, ma questo contraddice la classificazione già fissata in AF-STRUTTURA-006 §5 (Mappa.jsx è contenuto di Álfheim, non di Yggdrasil). Redirect corretto: `/mappa → /regno/alfheim/mappa`. `Mappa.jsx` **resta** pagina di contenuto; il componente mappa riusabile (`CatalogoMap.jsx`) è cosa distinta e tecnica (Svartálfheim concettuale, nessun impatto routing).

---

## 9. Deciso — Piano di Redirect Step 5 (solo client-side per questa iterazione)

Codex e Antigravity concordano; Haiku proponeva di aggiungere anche un middleware server-side FastAPI per 301 HTTP reali. **Adottato: solo client-side** (`<Navigate replace />`), per questo motivo: l'app è una SPA su Firebase Hosting, un redirect server-side richiederebbe configurazione hosting e un deploy dedicato — che secondo AGENTS.md R3/R8 richiede sempre autorizzazione esplicita di Daniel nella sessione corrente. Se in futuro serve SEO/301 reali per bot o crawler, va aperto un work order separato con deploy autorizzato — non incluso in questa iterazione.

Tabella redirect consolidata (unione delle proposte, con la correzione di §8 su `/mappa`):

| Route vecchia | Route nuova | Note |
|---|---|---|
| `/storia` | `/regno/helheim/storia` | |
| `/geologia` | `/regno/vanaheim/geologia` | |
| `/analisi-acqua` | `/regno/niflheim/analisi-acqua` | coerente con AF-ACQUA-005 |
| `/lavori` | `/regno/jotunheim/lavori` | mantiene `SocioRoute` se richiesto |
| `/ricettario` | `/regno/muspelheim/ricettario` | |
| `/bar` | `/regno/muspelheim/bar` | |
| `/canzoniere` | `/regno/alfheim/canzoniere` | |
| `/mappa` | `/regno/alfheim/mappa` | **corretto**, vedi §8 |
| `/research` | `/regno/helheim/research` | non sovrascrivere feature esistente |
| `/forum`, `/forum/:slug`, `/forum/thread/:id` | `/regno/midgard/forum...` | preservare parametri |
| `/chat`, `/chat/:slug` | `/regno/midgard/chat...` | mantiene `SocioRoute` |
| `/events`, `/events/:id` | `/regno/midgard/events...` | alias vecchio necessario per QR/notifiche già inviate |
| `/dona` | `/regno/midgard/dona` | |
| `/numeri-utili` | `/regno/midgard/numeri-utili` | |
| `/guida`, `/profilo` | `/regno/asgard/...` | **DECISO**: sì, tile Asgard navigabile come hub concettuale (vedi §4bis) |
| `/catalogo` | **invariata, nessun redirect** | **DECISO da Daniel**: "catalogo è catalogo, Yggdrasil è l'insieme di tutto" — sono due cose concettualmente distinte, non alias. `/catalogo` resta il motore/strumento di catalogazione (creazione, validazione, dettaglio scheda); `/yggdrasil` è la nuova vista di navigazione/scoperta aggregata. Nessun redirect tra i due |
| `/catalogo/nuovo`, `/catalogo/validazione`, `/catalogo/scheda/:id` | invariate | route operative dello strumento di catalogazione, non contenuto di un regno |
| `/login`, `/media` | invariate | utility trasversali, nessun impatto routing da questa AT |

## 4bis. DECISO da Daniel — Tile Asgard e Svartálfheim navigabili

Confermato: entrambi i regni hanno una route/hub propria (`/regno/asgard`, `/regno/svartalfheim`) anche se non ospitano (Asgard ha comunque `monumenti-cristiani`) o non ospitano affatto (Svartálfheim ha `economico`, ma i componenti tecnici trasversali restano non navigabili) contenuto catalogo esclusivo. Il tile Asgard funge da hub verso Login/Profilo/Guida oltre al catalogo monumenti-cristiani; il tile Svartálfheim funge da hub verso il catalogo economico oltre a mostrare — solo come classificazione concettuale, non come route proprie — i componenti tecnici (Media, AppHeader, BottomNav, ecc., invariato da AF §5).

---

## 10. DECISO da Daniel — Migrazione Eventi Legacy: tutti in Asgard

Procedura aggiornata secondo la decisione di Daniel: per ogni evento storico pubblicato senza scheda collegata, **prima** si tenta il match automatico (nome simile a `luogo`, sopra soglia); se non trovato, l'evento **non resta orfano né va in coda manuale caso per caso**: si collega a una **scheda segnaposto unica**, categoria `monumenti-cristiani`, regno Asgard, creata una tantum per la migrazione (es. nome "Eventi storici — luogo non ancora catalogato", `stato = pubblicato`, `note_migrazione = "scheda segnaposto per migrazione eventi legacy, sostituire con scheda reale se identificata"`). Questo soddisfa la regola 1..N senza richiedere revisione manuale per ogni evento non mappabile; gli eventi collegati alla segnaposto restano identificabili per una pulizia futura (query su `scheda_id = <id_segnaposto>`).

Procedura:
1. Script dry-run (`scripts/migrate_events_catalogo_links.py --dry-run`)
2. Match automatico per nome simile a `luogo`, sopra soglia → collega alla scheda reale se trovata
3. Nessun match → collega alla scheda segnaposto Asgard/monumenti-cristiani (creata in seed, vedi §6bis)
4. Blocco pubblicazione per nuovi eventi senza `scheda_ids` resta invariato (§5) — la segnaposto vale solo per la migrazione storica, non per nuovi eventi

**Chiuso**: nessuna eccezione per eventi "solo online" — confermato da Daniel che tutti gli eventi della community sono fisici, la regola 1..N resta assoluta senza deroghe.

**Chiuso**: nessuna delega futura della validazione eventi a ruoli non-admin — resta solo Admin, il punto §11 (vecchio #12) è definitivamente chiuso, non solo rimandato.

---

## 11. Decisioni Finali di Daniel (2026-07-13) — Tutti i Punti Chiusi

| # | Punto | Decisione |
|---|---|---|
| 1 | Dove vive la mappa regno→categorie | **RISOLTO** — Tabella PostgreSQL (§2). Principio generale: nessun dato funzionale in config statica, solo PostgreSQL |
| 2 | Assegnazione categorie ai regni | **RISOLTO** — proposta consolidata in §3 |
| 3 | `/catalogo` vs `/yggdrasil` | **RISOLTO** — restano due cose distinte, nessun redirect (§9) |
| 4 | Tile Asgard/Svartálfheim navigabili | **RISOLTO** — sì, entrambi navigabili come hub (§4bis) |
| 5 | Identità visiva dei 9 regni | **RISOLTO** — vedi §5bis: mantenere i colori già usati nel mockup Home condiviso in sessione, stile essenziale invariato, unica modifica: le caselle 3x3 e l'header di ogni pagina-regno passano dal nero a testo bianco al colore proprio del regno |
| 6 | Seed dati iniziale | **RISOLTO** — proposta in §6bis |
| 7 | Ordine griglia 9 regni | **RISOLTO** — simmetrico (nessuna gerarchia visiva, griglia 3x3 paritaria, coerente col mockup) |
| 8 | Fauna come sottocategoria di `naturale` | **RISOLTO** — confermato, sì |
| 9 | Triggering geolocalizzazione Evento↔Scheda | **RISOLTO** — caricamento differito lato app (lazy, non bloccante al momento del collegamento; le coordinate si risolvono quando l'evento viene visualizzato, non richiedono uno step sincrono dedicato in UI) |
| 10 | Eventi legacy non mappabili | **RISOLTO** — scheda segnaposto in Asgard (§10) |
| 11 | Eventi "solo online" | **RISOLTO** — chiuso, non esistono eventi online nella community, nessuna eccezione alla regola 1..N |
| 12 | Validazione eventi delegabile a non-admin | **RISOLTO** — no, resta solo Admin |
| 13 | Esposizione pubblica `GET /community/regni` | **RISOLTO** — confermato pubblico, nessun dato sensibile |

Nessun punto aperto residuo. Il documento può procedere alla peer review R9 di sintesi (Codex + Antigravity) prima dell'handoff a sviluppo.

## 5bis. Identità Visiva — Nota per Sviluppo

Mantenere i colori/stile già usati nel mockup Home a 9 regni condiviso in sessione (palette fredda "blu risorgiva" dell'app, un colore distinto per regno). Unica modifica richiesta da Daniel: le caselle della griglia 3x3 e l'header di ogni pagina-regno, oggi previste con sfondo nero e testo bianco nel mockup, diventano invece colorate con il colore proprio di ciascun regno (testo in tinta scura/chiara coerente per contrasto WCAG AA, come da token esistenti `--fn-*`). Resta essenziale, nessun elemento decorativo aggiuntivo.

## 6bis. Seed Dati Iniziale — Proposta

Con la mappatura di §3, la situazione "regni vuoti" è diversa da quella originariamente segnalata da Haiku (Vanaheim/Svartálfheim/Asgard non sono più vuoti):

- **Asgard** (`monumenti-cristiani`): già popolato dal pilot AF-CATALOGAZIONE-001 (nodo zero Sant'Andrea) — nessun seed aggiuntivo necessario, il regno nasce con contenuto reale. Aggiungere qui anche la scheda segnaposto per la migrazione eventi legacy (§10).
- **Vanaheim** (`naturale`): seed minimo di 2-3 schede esempio sfruttando `tipo_elemento` già supportato (`albero_monumentale`, `siepe_storica`) più le nuove sottocategorie flora/fauna confermate al punto 8.
- **Helheim** (`storico`+`militare`): seed a partire dai siti già noti in documentazione esistente (obelisco di Villafranca, ossario, fortificazioni austriache — citati in AF-CATALOGAZIONE-001 §1).
- **Álfheim** (`culturale`): seed iniziale facoltativo; il regno ha comunque contenuto immediato da Canzoniere e dalla pagina Mappa, non dipende dal catalogo per essere popolato al lancio.
- **Svartálfheim** (`economico`): nessun dato noto ancora raccolto — proposta: lanciare con il regno navigabile ma catalogo vuoto e un messaggio esplicito ("nessuna scheda ancora catalogata in questo regno"), popolamento progressivo da parte della community.
- **Jötunheim, Muspelheim, Midgard** (nessuna categoria catalogo): nessun seed di catalogo necessario, il contenuto esiste già nelle rispettive pagine applicative.

---

## 12. Handoff a Sviluppo (Gemini/Antigravity) — Checklist Consolidata

Tutte le decisioni di Daniel sono chiuse (§11) — nessun bloccante residuo prima di scrivere schema/seed definitivo.

1. **Schema Dati**: `community_event_catalogo_schede` (§4); `struttura_regni`/`struttura_regno_categorie` in PostgreSQL, mai config JSON (§2); mapping definitivo di §3; estensione `CommunityEvent` (stato/validato_da/validato_at/nota_validazione); scheda segnaposto Asgard per migrazione eventi legacy (§10)
2. **Backend API**: filtro catalogo esteso (§6, con regola anti-ambiguità); endpoint `GET /community/regni` pubblico (§13 punto 13); eventi RBAC completo (§5, nessuna delega futura a non-admin); allineamento `CatalogoValidazione.jsx` a validatori di dominio, non solo admin (rilievo Codex, §1)
3. **Frontend React**: `Home.jsx` trasformata (griglia 3x3 simmetrica, colori per regno secondo §5bis), `RegnoDashboard.jsx` (incluso Asgard/Svartálfheim navigabili, §4bis), `RegnoSectionRouter.jsx`, `Yggdrasil.jsx`/`YggdrasilCatalogo.jsx`, `CatalogoVista.jsx`, `CatalogoMap.jsx`, `EventForm.jsx` (§8)
4. **Geolocalizzazione Evento↔Scheda**: caricamento differito/lazy lato app, nessuno step sincrono dedicato in UI al momento del collegamento (§11 punto 9)
5. **Mappa multi-scheda**: marker multipli, popup per scheda (§7)
6. **Redirect Step 5**: solo client-side per questa iterazione, tabella §9, con correzione `/mappa → /regno/alfheim/mappa`; `/catalogo` NON viene redirezionato (§9)
7. **Migrazione eventi legacy**: script dry-run + match automatico + fallback su scheda segnaposto Asgard, nessun evento orfano residuo, nessuna coda manuale caso-per-caso (§10)
8. **Seed iniziale**: secondo proposta §6bis (Asgard già popolato dal pilot, Vanaheim/Helheim con seed minimo, Svartálfheim vuoto con messaggio esplicito)
9. **Test** (backend + frontend + manuale): elenco completo già dettagliato nel draft Codex, da riusare integralmente in fase di test plan
10. **Deploy**: nessuno step di questa migrazione implica deploy automatico; ogni promozione resta soggetta ad autorizzazione esplicita di Daniel in sessione (AGENTS.md R3/R8)
11. **Peer review R9 su questa sintesi aggiornata**: Codex e Antigravity/Gemini rileggono AT-STRUTTURA-006 (questo documento, con le decisioni di Daniel incorporate) e confermano prima dell'inizio sviluppo

---

## 13. Log di Sintesi

| Data | Autore | Attività |
|---|---|---|
| 2026-07-13 | Claude/Cowork | Sintesi dei 3 draft indipendenti (Haiku, Codex, Antigravity) in questo documento. 8 punti tecnici risolti per convergenza/adozione della versione più rigorosa; 1 correzione applicata (redirect `/mappa`, draft Antigravity non coerente con AF §5). |
| 2026-07-13 | Daniel (decisioni) | Tutti i 13 punti aperti chiusi in un solo passaggio (§11): DB PostgreSQL esclusivo (§2), mapping regno-categorie finale (§3), `/catalogo` e `/yggdrasil` restano distinti (§9), tile Asgard/Svartálfheim navigabili (§4bis), identità visiva colorata per regno (§5bis), seed proposto (§6bis), griglia simmetrica, fauna confermata, geolocalizzazione lazy, migrazione eventi legacy su scheda segnaposto Asgard (§10), nessun evento online, nessuna delega validazione futura, API regni pubblica. |

**Prossimo passo**: peer review R9 di questa sintesi aggiornata (Codex + Antigravity/Gemini), poi handoff a sviluppo (Gemini/Antigravity).
