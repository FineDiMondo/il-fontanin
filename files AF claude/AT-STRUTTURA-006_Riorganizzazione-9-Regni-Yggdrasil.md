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

## 2. Decisione Aperta — Dove vive la mappa Regno → Categorie

I tre draft **divergono** su questo punto architetturale:

| Proposta | Draft | Argomento a favore |
|---|---|---|
| **A. Config statica versionata** (JSON/constants, in repo, non in DB) | Haiku (opzione consigliata), Antigravity | Cambia raramente, è una regola di presentazione/identità più che dato transazionale; zero query aggiuntive; frontend e backend leggono la stessa fonte statica |
| **B. Tabella PostgreSQL dedicata** (`struttura_regni` + `struttura_regno_categorie`, con `UniqueConstraint` su categoria) | Codex | Garanzia strutturale (vincolo DB) che una categoria appartenga a un solo regno; evita drift tra API e UI; gestibile da admin panel senza deploy in futuro |

Entrambe le opzioni rispettano il vincolo funzionale dell'AF (nessun nuovo campo su `catalogo_schede`, il regno resta una mappa sopra le categorie esistenti). La differenza è dove vive quella mappa e chi la fa rispettare.

**Raccomandazione di questa sintesi**: opzione B (tabella DB) per il vincolo di integrità che offre gratuitamente (constraint invece di disciplina applicativa), ma è un incremento di scope minimo rispetto a un JSON — **decisione da confermare da Daniel** prima di procedere, perché cambia dove risiede la fonte di verità.

---

## 3. Decisione Aperta — Assegnazione Categorie ai Regni (seed)

Tutti e tre i draft segnalano esplicitamente questo punto come non risolvibile in autonomia. Le tre proposte divergono, specialmente su `militare`, `culturale`, `economico`, `monumenti-cristiani`:

| Regno | Haiku | Antigravity | Codex |
|---|---|---|---|
| Vanaheim | `naturale` | `naturale` | `naturale` |
| Jötunheim | `economico` | — | nessuna iniziale |
| Helheim | `storico` | `storico` | `storico` + `militare` |
| Niflheim | `idrico` | `idrico` | `idrico` |
| Muspelheim | nessuna (Ricettario/Bar standalone) | `economico` (ipotesi) | `culturale` |
| Svartálfheim | nessuna | — | `economico` |
| Álfheim | `culturale` + Mappa | — | nessuna iniziale (+ Mappa, Canzoniere) |
| Asgard | nessuna | — | `monumenti-cristiani` |
| Midgard | tutte (fallback) | — | nessuna |

Le tre proposte concordano solo su Vanaheim→`naturale` e Niflheim→`idrico`. Tutto il resto è a discrezione editoriale.

**Decisione richiesta a Daniel**: quale assegnazione finale usare (una delle tre, o un mix). Fino a questa conferma, il seed non può essere scritto in modo definitivo — l'handoff a sviluppo (§9) userà un seed segnaposto marcato esplicitamente come "da confermare".

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
| `/guida`, `/profilo` | `/regno/asgard/...` | — **decisione aperta**: tile Asgard navigabile o solo concettuale? (§10) |
| `/catalogo` | `/yggdrasil` (raccomandato) | **decisione aperta**, vedi sotto |
| `/catalogo/nuovo`, `/catalogo/validazione`, `/catalogo/scheda/:id` | invariate | route operative trasversali: spostarle aumenterebbe il rischio di regressione senza benefico funzionale (adottata la posizione più conservativa, Codex) |
| `/login`, `/media` | invariate | utility trasversali, nessun impatto routing da questa AT |

**Decisione aperta**: `/catalogo` diventa alias/redirect di `/yggdrasil`, o resta il nome pubblico primario? Tutti e tre i draft segnalano il punto, nessuno lo risolve — spetta a Daniel.

---

## 10. Deciso — Migrazione Eventi Legacy (approccio conservativo)

Adottato l'approccio di Codex (più cauto di quello di Haiku, che proponeva creazione automatica di schede minime via fuzzy-match): **nessuna creazione automatica di schede senza conferma umana**, perché una scheda richiede categoria, livello di evidenza e responsabilità editoriale — dati che un fuzzy-match testuale non può garantire.

Procedura:
1. Script dry-run (`scripts/migrate_events_catalogo_links.py --dry-run`)
2. Per ogni evento pubblicato: cerca schede pubblicate con nome simile a `luogo`; se match univoco sopra soglia, propone il collegamento; altrimenti produce riga CSV "richiede decisione"
3. Nessuna scheda minima creata automaticamente senza conferma esplicita di Daniel
4. Esecuzione solo dopo revisione del CSV da parte di Daniel
5. Blocco pubblicazione per nuovi eventi senza `scheda_ids` (già in vigore da §5)

**Decisione aperta**: eventi legacy non mappabili — lasciarli in `bozza`/`richiesta_modifiche`, collegarli manualmente uno a uno, o creare schede minime con supervisione? Spetta a Daniel dopo aver visto il CSV.

**Punto aggiuntivo (Codex)**: se Daniel vuole ammettere eventi "solo online" senza luogo fisico, questo modello richiede un'eccezione esplicita alla regola "1..N schede obbligatorie" — da decidere separatamente, non assunto qui.

---

## 11. Punti Aperti Consolidati per Daniel

| # | Punto | Origine | Impatto |
|---|---|---|---|
| 1 | Dove vive la mappa regno→categorie: config statica o tabella DB (§2) | Haiku/Antigravity vs Codex | Architettura |
| 2 | Assegnazione finale categorie ai regni, specialmente `militare`/`culturale`/`economico`/`monumenti-cristiani` (§3) | Tutti e 3, proposte diverse | Dati/contenuto |
| 3 | `/catalogo` diventa alias di `/yggdrasil` o resta nome pubblico primario (§9) | Tutti e 3 | Architettura/SEO |
| 4 | Tile Asgard (Login/Profilo/Guida) e Svartálfheim: navigabili come hub concettuale o solo classificazione, nessuna route propria? | Tutti e 3 | UX |
| 5 | Identità visiva dei 9 regni (colori, icone) | Haiku | UI/UX, fuori scope AT |
| 6 | Seed dati iniziale per regni oggi vuoti (Vanaheim, Svartálfheim, Asgard) | Haiku | Contenuto |
| 7 | Ordine/priorità griglia 9 regni (simmetrico vs gerarchico) | Haiku | UX |
| 8 | Fauna come sottocategoria di `naturale` in Vanaheim | Haiku/Codex | Dati |
| 9 | Triggering geolocalizzazione Evento↔Scheda: timing e UX al momento del collegamento | Haiku | UX |
| 10 | Eventi legacy non mappabili: manuale, schede minime supervisionate, o de-pubblicazione (§10) | Tutti e 3 | Dati |
| 11 | Eventi "solo online" senza luogo fisico: eccezione alla regola 1..N? | Codex | Regola di business |
| 12 | Validazione eventi delegabile a non-admin in futuro? | Codex | RBAC futuro |
| 13 | Esposizione pubblica di `GET /community/regni` (o equivalente) — confermare che non è sensibile | Haiku | Security, basso rischio |

---

## 12. Handoff a Sviluppo (Gemini/Antigravity) — Checklist Consolidata

1. **Decisioni preliminari da Daniel** (§11, punti 1-4 bloccanti prima di scrivere schema/seed definitivo)
2. **Schema Dati**: `community_event_catalogo_schede` (§4); mappa regno-categorie secondo la decisione presa in §2 (config JSON oppure `struttura_regni`/`struttura_regno_categorie`); estensione `CommunityEvent` (stato/validato_da/validato_at/nota_validazione)
3. **Backend API**: filtro catalogo esteso (§6, con regola anti-ambiguità); endpoint regni (`GET /community/regni` o equivalente); eventi RBAC completo (§5); allineamento `CatalogoValidazione.jsx` a validatori di dominio, non solo admin (rilievo Codex, §1)
4. **Frontend React**: `Home.jsx` trasformata, `RegnoDashboard.jsx`, `RegnoSectionRouter.jsx`, `Yggdrasil.jsx`/`YggdrasilCatalogo.jsx`, `CatalogoVista.jsx`, `CatalogoMap.jsx`, `EventForm.jsx` (§8)
5. **Mappa multi-scheda**: marker multipli, popup per scheda (§7)
6. **Redirect Step 5**: solo client-side per questa iterazione, tabella §9, con correzione `/mappa → /regno/alfheim/mappa`
7. **Migrazione eventi legacy**: script dry-run, nessuna creazione automatica senza conferma (§10)
8. **Test** (backend + frontend + manuale): elenco completo già dettagliato nel draft Codex, da riusare integralmente in fase di test plan
9. **Deploy**: nessuno step di questa migrazione implica deploy automatico; ogni promozione resta soggetta ad autorizzazione esplicita di Daniel in sessione (AGENTS.md R3/R8)
10. **Peer review R9 su questa sintesi**: Codex e Antigravity/Gemini rileggono AT-STRUTTURA-006 (questo documento, non i singoli draft) e confermano o sollevano nuove riserve prima dell'inizio sviluppo

---

## 13. Log di Sintesi

| Data | Autore | Attività |
|---|---|---|
| 2026-07-13 | Claude/Cowork | Sintesi dei 3 draft indipendenti (Haiku, Codex, Antigravity) in questo documento. 8 punti tecnici risolti per convergenza/adozione della versione più rigorosa; 13 punti aperti consolidati e deduplicati per decisione di Daniel; 1 correzione applicata (redirect `/mappa`, draft Antigravity non coerente con AF §5). |

**Prossimo passo**: Daniel decide i punti bloccanti (§11 #1-4), poi questo documento torna in peer review R9 (Codex + Antigravity) prima dell'handoff a sviluppo.
