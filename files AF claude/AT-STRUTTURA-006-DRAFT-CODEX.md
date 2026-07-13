# AT-STRUTTURA-006-DRAFT-CODEX — Analisi Tecnica
## Riorganizzazione dell'Architettura Informativa secondo i 9 Regni / Yggdrasil — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AT-STRUTTURA-006-DRAFT-CODEX |
| Fase | Analisi Tecnica, draft parallelo indipendente |
| Base | AF-STRUTTURA-006_Riorganizzazione-9-Regni-Yggdrasil.md, commit `6f2f7ee`, branch `develop` |
| Autore | Codex |
| Validazione successiva | Sintesi Claude/Cowork in `AT-STRUTTURA-006.md`, poi processo standard R9 |
| Stack rilevato | FastAPI + SQLAlchemy + PostgreSQL (`community_module`), React + React Router, `react-leaflet@4` |
| Vincoli applicati | Nessuna modifica codice in questa fase; regno non e' un campo di `catalogo_schede`; RBAC reale `guest` / `socio` / `admin`; eventi: Membro propone bozza, Admin pubblica |

---

## 1. Rilievo Tecnico Critico

Il codebase reale e' gia' oltre il livello di ipotesi dell'AT-CATALOGAZIONE-001: esistono gia' i modelli SQLAlchemy `CatalogoCategoria`, `CatalogoSottocategoria`, `CatalogoScheda`, `CatalogoMedia`, `CompetenzaDominio`, `CompetenzaUtente`; esistono gia' il router `/community/catalogo`, il router `/community/competenze` e la funzione `is_validatore_per_dominio`.

Conferme importanti dal codice:

| Tema | Stato reale |
|---|---|
| RBAC | `community_users.ruolo` ha 3 valori tecnici: `guest`, `socio`, `admin`. Il "Validatore" resta una qualifica di dominio sopra `socio`, non un quarto ruolo. |
| Catalogo | `GET /community/catalogo/schede` filtra oggi per `categoria_id` singolo e `stato`; non supporta ancora `regno_codice` o liste di categorie. |
| Mappa | `react-leaflet@4` e' gia' usato in `src/pages/Mappa.jsx` e `CatalogForm.jsx`, incluso fix icone Leaflet/Vite. |
| Eventi | `POST /community/events` richiede oggi `require_admin`; `CommunityEvent.stato` defaulta a `pubblicato`; gli eventi hanno `luogo`/`luogo_online` testuali e nessun link a schede catalogo. |
| Frontend routing | `src/App.jsx` usa React Router SPA; i redirect esistenti sono client-side via `<Navigate replace />`. |
| Validazione catalogo UI | Backend ammette validatori per dominio, ma `CatalogoValidazione.jsx` oggi espone la coda solo ad `admin`. Questo va allineato in sviluppo, non risolto qui. |

Decisione tecnica di questo draft: usare una tabella dedicata per la mappa `regno_codice -> catalogo_categorie`, non config statica duplicata. La mappa serve al backend per filtrare catalogo ed eventi, deve essere consistente con le categorie DB e deve impedire che una stessa categoria venga assegnata a due regni. I testi/icone/tema dei regni possono restare in seed DB o, per il solo rendering, in un config frontend; la relazione categoria-regno deve stare in Postgres per evitare drift tra API e UI.

## 2. Architettura Incrementale

La migrazione resta a step, come da AF:

1. Home a griglia 9 regni + accesso Yggdrasil, senza spostare route esistenti.
2. Vista catalogo filtrabile per regno, riusando `Catalogo.jsx` tramite componente comune.
3. Livello Yggdrasil aggregato, equivalente a catalogo completo + mappa completa.
4. Relazione N:N Eventi-Schede e cambio RBAC eventi.
5. Redirect client-side dalle route storiche alle nuove route, mantenendo alias finche' i link esterni non sono stabilizzati.

Ogni step deve essere rilasciabile senza deploy implicito. Deploy e promozioni restano fuori scope e richiedono autorizzazione esplicita di Daniel in sessione.

## 3. Schema Dati — PostgreSQL / SQLAlchemy

### 3.1 Registro Regni — `struttura_regni`

Tabella piccola, seedata, con codici URL-safe ASCII. Non sostituisce le categorie catalogo e non viene referenziata da `catalogo_schede`.

```python
class StrutturaRegno(Base):
    __tablename__ = "struttura_regni"

    codice      = Column(String(40), primary_key=True)  # vanaheim, jotunheim, ...
    nome        = Column(String(100), nullable=False)
    descrizione = Column(Text)
    ordine      = Column(Integer, nullable=False, unique=True)
    navigabile  = Column(Boolean, nullable=False, default=True)
    tema_json   = Column(JSONB)  # colore, icona, immagine, microcopy UI
    attivo      = Column(Boolean, nullable=False, default=True)
    created_at  = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at  = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    categorie   = relationship("StrutturaRegnoCategoria", back_populates="regno")
```

### 3.2 Mappa Regno-Categorie — `struttura_regno_categorie`

Questa e' l'artefatto esplicito richiesto dall'AF. La `UniqueConstraint("categoria_id")` preserva il vincolo funzionale: una scheda ha una sola categoria, quindi appartiene a un solo regno tramite quella categoria. Un regno puo' invece aggregare piu' categorie.

```python
class StrutturaRegnoCategoria(Base):
    __tablename__ = "struttura_regno_categorie"
    __table_args__ = (
        UniqueConstraint("categoria_id", name="uq_regno_categoria_categoria_unica"),
        Index("ix_regno_categorie_regno", "regno_codice"),
    )

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    regno_codice  = Column(String(40), ForeignKey("struttura_regni.codice", ondelete="CASCADE"), nullable=False)
    categoria_id  = Column(UUID(as_uuid=True), ForeignKey("catalogo_categorie.id", ondelete="CASCADE"), nullable=False)
    ordine        = Column(Integer, nullable=False, default=0)
    created_at    = Column(DateTime(timezone=True), nullable=False, default=func.now())

    regno         = relationship("StrutturaRegno", back_populates="categorie")
    categoria     = relationship("CatalogoCategoria")
```

Nota: se Daniel in futuro vuole che una stessa categoria tecnica compaia in piu' regni, va cambiato esplicitamente il modello funzionale dell'AF, perche' oggi romperebbe la regola "scheda -> categoria -> un solo regno".

### 3.3 Relazione Eventi-Schede — `community_event_catalogo_schede`

Join table obbligatoria per gli eventi pubblicabili. L'evento non acquisisce coordinate proprie: la mappa deriva sempre dalle schede collegate.

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

Estensione a `CommunityEvent`:

```python
class CommunityEvent(Base):
    __tablename__ = "community_events"

    # campi esistenti invariati
    stato             = Column(String(20), nullable=False, default="bozza")
    validato_da       = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    validato_at       = Column(DateTime(timezone=True))
    nota_validazione  = Column(Text)

    schede_catalogo   = relationship(
        "CommunityEventCatalogoScheda",
        back_populates="event",
        cascade="all, delete-orphan",
    )
```

`luogo` e `luogo_online` restano per retrocompatibilita' e display, ma non sono piu' fonte di geolocalizzazione. Per i nuovi eventi, la pubblicazione richiede almeno una riga nella join table.

## 4. Seed Iniziale Regni e Mappa Categorie

Codici route proposti:

| Regno | Codice URL | Categorie catalogo proposte | Stato |
|---|---|---|---|
| Vanaheim | `vanaheim` | `naturale` | Coerente con AF; richiede seed sottocategorie flora/fauna/piantumazioni se Daniel le conferma. |
| Jotunheim | `jotunheim` | nessuna iniziale | Regno di route/funzionalita' (`LavoriProgetto`, competenze), non necessariamente catalogo in questa iterazione. |
| Helheim | `helheim` | `storico`, `militare` | Proposta tecnica: memoria, siti storici, fortificazioni e tracce militari. Da confermare Daniel. |
| Niflheim | `niflheim` | `idrico` | Coerente con AF e AF-ACQUA-005. |
| Muspelheim | `muspelheim` | `culturale` | Tradizioni, feste, ricette/bar come contenuti di regno. Da confermare se leggende restano qui o passano ad Alfheim. |
| Svartalfheim | `svartalfheim` | `economico` | Mestieri, botteghe, attivita' storiche. I componenti tecnici restano trasversali, non route migrate. |
| Alfheim | `alfheim` | nessuna iniziale | Mappa attuale e Canzoniere; eventuale categoria "leggende" richiede decisione Daniel per non riusare `culturale` in due regni. |
| Asgard | `asgard` | `monumenti-cristiani` | Sacro/devozione. Login/Profilo/Guida restano utility route, non contenuti catalogo. |
| Midgard | `midgard` | nessuna iniziale | Vita di comunita': forum, chat, eventi, dona, numeri utili. |

Questa tabella e' una proposta seed, non una decisione editoriale finale: le assegnazioni ambigue (`militare`, `culturale`, `economico`) vanno confermate da Daniel prima dell'implementazione.

## 5. Schemas Pydantic

Nuovi schemas in `community_module/models/schemas.py`:

```python
class RegnoCategoriaOut(BaseModel):
    codice: str
    nome: str

    class Config:
        from_attributes = True


class RegnoOut(BaseModel):
    codice: str
    nome: str
    descrizione: Optional[str] = None
    ordine: int
    navigabile: bool
    tema_json: Optional[Dict[str, Any]] = None
    categorie: List[RegnoCategoriaOut] = []

    class Config:
        from_attributes = True
```

Estensione evento:

```python
class EventSchedaCatalogoOut(BaseModel):
    id: UUID
    nome: str
    lat: Decimal
    lng: Decimal
    categoria_codice: str
    categoria_nome: str
    regno_codice: Optional[str] = None


class EventCreate(BaseModel):
    titolo: str = Field(min_length=5)
    descrizione: Optional[str] = None
    luogo: Optional[str] = None
    luogo_online: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    max_partecipanti: Optional[int] = None
    pubblico: bool = True
    scheda_ids: List[UUID] = Field(min_length=1)


class EventValida(BaseModel):
    approvato: bool
    nota_validazione: Optional[str] = None


class EventOut(BaseModel):
    id: UUID
    titolo: str
    descrizione: Optional[str] = None
    luogo: Optional[str] = None
    luogo_online: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    max_partecipanti: Optional[int] = None
    pubblico: bool
    stato: str
    created_at: datetime
    posti_disponibili: Optional[int] = None
    iscritti: int = 0
    schede: List[EventSchedaCatalogoOut] = []
```

Per compatibilita', i client vecchi che non leggono `schede` continuano a funzionare. I client nuovi devono inviare `scheda_ids` quando creano o modificano eventi.

## 6. Backend API

### 6.1 Nuovo router `community_module/api/struttura.py`

Montato in `community_main.py` sotto `/community/struttura`.

| Metodo | Path | Guard | Note |
|---|---|---|---|
| GET | `/regni` | pubblico | Restituisce i 9 regni attivi in ordine, con categorie risolte. |
| GET | `/regni/{codice}` | pubblico | Dettaglio regno + categorie collegate. |
| GET | `/regni/{codice}/categorie` | pubblico | Solo codici categorie, utile per frontend o test. |

Esempio shape:

```json
{
  "codice": "niflheim",
  "nome": "Niflheim",
  "categorie": [
    {"codice": "idrico", "nome": "Idrico"}
  ],
  "tema_json": {"accent": "#2563eb", "icon": "droplets"}
}
```

### 6.2 Estensione `GET /community/catalogo/schede`

Parametri esistenti da mantenere:

| Parametro | Stato |
|---|---|
| `categoria_id` | retrocompatibile, filtro singolo UUID |
| `stato` | invariato |
| `bbox` | invariato |

Nuovi parametri:

| Parametro | Tipo | Note |
|---|---|---|
| `categoria_codice` | string | filtro singolo per codice categoria, piu' leggibile nelle route nuove |
| `categorie` | string CSV | lista codici categoria, es. `storico,militare` |
| `regno_codice` | string | risolve la mappa DB e filtra tutte le categorie del regno |

Regola anti-ambiguita': accettare uno solo tra `categoria_id`, `categoria_codice`, `categorie`, `regno_codice`; se arrivano piu' filtri di dominio rispondere `400`.

Pseudo-query:

```python
if regno_codice:
    query = query.join(CatalogoCategoria).join(
        StrutturaRegnoCategoria,
        StrutturaRegnoCategoria.categoria_id == CatalogoCategoria.id,
    ).filter(StrutturaRegnoCategoria.regno_codice == regno_codice)
elif categorie:
    codici = [c.strip() for c in categorie.split(",") if c.strip()]
    query = query.join(CatalogoCategoria).filter(CatalogoCategoria.codice.in_(codici))
elif categoria_codice:
    query = query.join(CatalogoCategoria).filter(CatalogoCategoria.codice == categoria_codice)
elif categoria_id:
    query = query.filter(CatalogoScheda.categoria_id == categoria_id)
```

Autorizzazione bozze: mantenere l'attuale filtro per creatore/admin/validatore dominio, ma testarlo anche con `regno_codice`, perche' il join extra non deve allargare la visibilita' delle bozze.

### 6.3 Eventi: cambio RBAC e join schede

Modifiche a `community_module/api/events.py`:

| Metodo | Path | Guard | Nuovo comportamento |
|---|---|---|---|
| GET | `/events` | pubblico/opzionale | Default resta solo `pubblicato`; aggiungere `regno_codice` e `include_schede=true`. |
| GET | `/events/{event_id}` | pubblico/opzionale | Include `schede`; bozza visibile solo a creatore/admin. |
| POST | `/events` | `require_socio` | Crea evento in `bozza`, richiede `scheda_ids` non vuoto, collega solo schede `pubblicato`. |
| PATCH | `/events/{event_id}` | creatore se `bozza`, oppure admin | Aggiorna dati e set schede; se l'evento era respinto torna `bozza`. |
| POST | `/events/{event_id}/valida` | `require_admin` | Se `approvato=true`, richiede almeno una scheda collegata e pubblica; altrimenti respinge con nota. |
| DELETE | `/events/{event_id}` | `require_admin` | Invariato: annulla. |

Regole backend:

- `guest` / non autenticato: legge solo eventi `pubblicato` e `pubblico=true`.
- `socio`: legge eventi pubblicati e privati per soci; crea proposte in `bozza`; legge le proprie bozze.
- `admin`: legge e valida tutto.
- Un evento pubblicato senza almeno una riga `community_event_catalogo_schede` deve essere impossibile.
- Schede collegabili: solo `CatalogoScheda.stato == "pubblicato"` nel flusso ordinario. L'admin puo' avere override solo se Daniel lo conferma.

Filtro eventi per regno:

```python
q = q.join(CommunityEventCatalogoScheda).join(CatalogoScheda).join(CatalogoCategoria)
q = q.join(StrutturaRegnoCategoria, StrutturaRegnoCategoria.categoria_id == CatalogoCategoria.id)
q = q.filter(StrutturaRegnoCategoria.regno_codice == regno_codice).distinct()
```

Per la lista evento in un regno, l'evento compare una volta se almeno una scheda collegata appartiene al regno. Per la mappa del regno, si renderizzano solo le schede collegate che appartengono a quel regno. A livello Yggdrasil si renderizzano tutte.

## 7. Frontend React

### 7.1 Routing target

Nuove route in `src/App.jsx`:

```jsx
<Route path="/" element={<Home />} />
<Route path="/regni/:regnoCodice" element={<RegnoHub />} />
<Route path="/regni/:regnoCodice/:section" element={<RegnoSectionRouter />} />
<Route path="/yggdrasil" element={<Yggdrasil />} />
```

Route operative da mantenere:

```jsx
<Route path="/catalogo/nuovo" element={<SocioRoute><CatalogoNuovo /></SocioRoute>} />
<Route path="/catalogo/validazione" element={<SocioRoute><CatalogoValidazione /></SocioRoute>} />
<Route path="/catalogo/scheda/:id" element={<CatalogoDettaglio />} />
```

`/catalogo` puo' diventare alias/redirect verso `/yggdrasil` allo Step 5, ma i dettagli/azioni catalogo restano route operative per ridurre il rischio di regressione.

### 7.2 Componenti nuovi/proposti

| File | Responsabilita' |
|---|---|
| `src/config/regni.js` | Solo metadata UI statici: ordine, label, descrizione breve, route delle sezioni. Non contiene la mappa categorie come fonte di verita'. |
| `src/pages/Home.jsx` | Griglia 3x3 regni + accesso distinto Yggdrasil. Niente fetch obbligatorio per il primo render; puo' usare config UI. |
| `src/pages/RegnoHub.jsx` | Legge `regnoCodice`, mostra sezioni del regno, `CatalogoVista regnoCodice={...}` se il regno ha categorie, e link eventi filtrati. |
| `src/pages/Yggdrasil.jsx` | Aggregato trasversale: `CatalogoVista scope="all"` + mappa schede/eventi senza filtro. |
| `src/components/catalogo/CatalogoVista.jsx` | Estrae la parte lista/filtri da `Catalogo.jsx`; props: `regnoCodice`, `categorieCodici`, `showCategoryFilters`, `showMap`. |
| `src/components/catalogo/CatalogoMap.jsx` | Mappa Leaflet riusabile per schede catalogo e marker evento; usa lo stesso fix icone di `Mappa.jsx`/`CatalogForm.jsx`. |
| `src/components/events/EventForm.jsx` | Form evento per soci/admin con selezione obbligatoria di 1..N schede catalogo. |
| `src/pages/EventiValidazione.jsx` | Coda admin per eventi in bozza/richiesta modifiche. |

`src/pages/Mappa.jsx` resta pagina contenuto di Alfheim: non va trasformata nel componente mappa riusabile. La mappa riusabile nasce in `components/catalogo` o `components/map`, non dentro `pages`.

### 7.3 CatalogoVista

Comportamento:

- Se `regnoCodice` valorizzato, chiama `GET /catalogo/schede?stato=pubblicato&regno_codice=${regnoCodice}`.
- Se `scope="all"` o nessun filtro, chiama `GET /catalogo/schede?stato=pubblicato`.
- Se l'utente seleziona una categoria, usa `categoria_codice` invece di `categoria_id`, cosi' la URL resta stabile rispetto agli UUID DB.
- La lista continua a linkare `/catalogo/scheda/:id`.
- La vista mappa e la lista usano gli stessi dati, evitando una seconda fonte per coordinate.

### 7.4 EventForm

Il form evento deve includere un selettore schede:

- ricerca testuale su `GET /catalogo/schede?stato=pubblicato`;
- filtro facoltativo per regno/categoria;
- selezione multi con chip, almeno 1;
- preview mappa dei punti selezionati;
- submit a `POST /events` con `scheda_ids`.

Nessun evento nuovo va pubblicato direttamente dal form socio: stato `bozza`, poi validazione admin.

## 8. Resa in Mappa di Eventi Multi-Scheda

Modello dati per la UI:

```js
const eventMarkers = events.flatMap((event) =>
  event.schede.map((scheda) => ({
    key: `${event.id}:${scheda.id}`,
    eventId: event.id,
    schedaId: scheda.id,
    title: event.titolo,
    startsAt: event.starts_at,
    position: [Number(scheda.lat), Number(scheda.lng)],
    regnoCodice: scheda.regno_codice,
    categoriaCodice: scheda.categoria_codice,
  }))
)
```

Regole:

- Evento con 1 scheda: 1 marker.
- Evento con N schede: N marker, stesso titolo evento, popup con link a `/events/:id` e scheda collegata.
- Evento con schede in regni diversi: appare nella lista di ciascun regno coinvolto; nella mappa di ogni regno mostra solo i marker delle schede di quel regno; in Yggdrasil mostra tutti i marker.
- Nessuna location primaria/secondaria in questa iterazione.
- Se due marker cadono sullo stesso punto, usare clustering solo se il numero di marker rende la mappa illeggibile. Non introdurre subito una nuova dipendenza: partire con marker distinti e popup.

## 9. Piano Redirect Step 5

Meccanismo consigliato: redirect client-side React Router con `<Navigate replace />`. L'app e' una SPA su Firebase Hosting; i redirect server-side 301 richiederebbero configurazione hosting e deploy esplicito. Per questa migrazione funzionale, `replace` preserva bookmark e non sporca la history. Se Daniel richiede SEO/301 reali, va aperto un work order separato con deploy approvato.

| Route vecchia | Route nuova | Note |
|---|---|---|
| `/` | `/` | Home sostituita dalla griglia 9 regni, nessun redirect. |
| `/geologia` | `/regni/vanaheim/geologia` | Route legacy mantenuta come redirect. |
| `/lavori` | `/regni/jotunheim/lavori` | `SocioRoute` invariato se richiesto dal componente. |
| `/storia` | `/regni/helheim/storia` | Redirect diretto. |
| `/research` | `/regni/helheim/research` | Conserva feature esistente, non sovrascrivere. |
| `/analisi-acqua` | `/regni/niflheim/analisi-acqua` | Coerente con AF-ACQUA-005. |
| `/ricettario` | `/regni/muspelheim/ricettario` | Redirect diretto. |
| `/bar` | `/regni/muspelheim/bar` | Redirect diretto. |
| `/mappa` | `/regni/alfheim/mappa` | La pagina `Mappa.jsx` resta contenuto, non componente tecnico. |
| `/canzoniere` | `/regni/alfheim/canzoniere` | Redirect diretto. |
| `/forum` | `/regni/midgard/forum` | Redirect diretto. |
| `/forum/:slug` | `/regni/midgard/forum/:slug` | Preservare parametro. |
| `/forum/thread/:id` | `/regni/midgard/forum/thread/:id` | Preservare parametro. |
| `/chat` | `/regni/midgard/chat` | Mantiene `SocioRoute`. |
| `/chat/:slug` | `/regni/midgard/chat/:slug` | Mantiene `SocioRoute`. |
| `/events` | `/regni/midgard/events` | Lista eventi nel regno Midgard. |
| `/events/:id` | `/regni/midgard/events/:id` | Dettaglio evento; alias vecchio necessario per QR/link notifiche. |
| `/dona` | `/regni/midgard/dona` | Redirect diretto. |
| `/numeri-utili` | `/regni/midgard/numeri-utili` | Redirect diretto. |
| `/catalogo` | `/yggdrasil` | Raccomandato come aggregato catalogo completo. Da confermare Daniel. |
| `/catalogo/nuovo` | invariata | Route operativa trasversale, non contenuto di regno. |
| `/catalogo/validazione` | invariata | Route operativa trasversale, richiede allineamento admin/validatore. |
| `/catalogo/scheda/:id` | invariata | Dettaglio scheda condiviso da regni e Yggdrasil. |
| `/media` | invariata | AF la classifica in Svartalfheim ma senza impatto routing tecnico. |
| `/login` | invariata | Utility auth, non route di regno. |
| `/profilo` | invariata | Utility utente, feature flag competenze esistente. |
| `/guida` | invariata | Utility trasversale; eventuale tile Asgard richiede conferma Daniel. |

Per implementare senza duplicare pagine, `RegnoSectionRouter` puo' rendere i componenti esistenti:

```jsx
const SECTION_COMPONENTS = {
  "vanaheim/geologia": Geologia,
  "helheim/storia": Storia,
  "helheim/research": Research,
  "niflheim/analisi-acqua": AnalisiAcqua,
  "muspelheim/ricettario": Ricettario,
  "midgard/forum": Forum,
  // ecc.
}
```

In alternativa si possono definire route esplicite una per una. Per leggibilita' e controllo RBAC, la seconda opzione e' piu' verbosa ma piu' sicura.

## 10. Migrazione Dati Eventi Esistenti

Problema: gli eventi esistenti hanno `luogo` / `luogo_online` testuali e zero schede collegate. Dopo la migrazione, nessun evento pubblicato dovrebbe restare senza scheda.

Procedura consigliata:

1. Script dry-run `scripts/migrate_events_catalogo_links.py --dry-run`.
2. Per ogni evento pubblicato:
   - cercare schede pubblicate con nome simile a `luogo`;
   - se match univoco sopra soglia, proporre link;
   - se nessun match, produrre riga CSV "richiede decisione".
3. Nessuna creazione automatica di schede minime senza conferma Daniel, perche' servono categoria, livello evidenza e responsabilita' editoriale.
4. Dopo revisione CSV, esecuzione con file approvato:
   - `event_id,scheda_id`
   - oppure `event_id,create_minimal_scheda,categoria_codice,nome,lat,lng`
5. Blocco di pubblicazione per eventi futuri senza `scheda_ids`.

Punto Daniel: scegliere se gli eventi legacy non mappabili vanno lasciati in `bozza/richiesta_modifiche`, collegati manualmente, o trasformati creando schede minime di catalogo.

## 11. Test e Gate

Backend:

- Test `GET /community/struttura/regni`: restituisce 9 regni, ordine stabile, categorie risolte.
- Test `GET /community/catalogo/schede?regno_codice=niflheim`: include solo schede categoria `idrico`.
- Test filtro bozze con `regno_codice`: un socio non creatore e non validatore non vede bozze altrui.
- Test `POST /community/events` con socio: crea `bozza`, non `pubblicato`.
- Test `POST /community/events` senza `scheda_ids`: `422`.
- Test `POST /community/events/{id}/valida` da socio: `403`; da admin con schede: pubblica.
- Test evento multi-scheda in regni diversi: query per ogni regno lo include; Yggdrasil lo include una volta.

Frontend:

- `npm run build` senza warning nuovi.
- Home 375px: griglia 3x3 leggibile, no overflow orizzontale.
- Click tile regno -> route corretta.
- `/yggdrasil` mostra catalogo completo.
- `/regni/niflheim` mostra filtro idrico e mappa non vuota se ci sono dati.
- Redirect legacy `/storia`, `/events/:id`, `/catalogo` funzionano con `replace`.
- EventForm non abilita submit senza almeno una scheda.

Manuale/browser:

- Verifica marker evento multi-scheda: due marker, stesso evento, popup distinti per scheda.
- Verifica QR/notifiche eventi: link vecchi `/events/:id` restano validi almeno come alias.

## 12. Punti che l'AT non puo' risolvere autonomamente

| Punto | Decisione richiesta |
|---|---|
| Mappa finale categorie-regni | Daniel deve confermare l'assegnazione delle 7 categorie tecniche ai regni, in particolare `militare`, `culturale`, `economico` e la presenza/assenza di categorie per Alfheim/Jotunheim/Midgard. |
| `/catalogo` come alias di `/yggdrasil` | Raccomandato tecnicamente, ma Daniel deve confermare se il nome pubblico "Catalogo" va mantenuto come voce primaria o sostituito da Yggdrasil. |
| Svartalfheim/Asgard in Home | Questo draft prevede hub/tiles ma non sposta utility route tecniche. Daniel deve confermare se i tile devono essere navigabili, descrittivi, o solo concettuali. |
| Eventi legacy senza scheda | Daniel deve decidere tra mappatura manuale, creazione di schede minime, o de-pubblicazione fino a catalogazione. |
| Eventi solo online | L'AF impone almeno una scheda collegata. Se Daniel vuole eventi online puri senza luogo fisico, serve eccezione esplicita al modello. |
| Nuove sottocategorie Vanaheim | Flora/fauna/piantumazioni richiedono seed, metadata_schema e domini competenza da confermare. |
| Validatore eventi | L'AF dice Admin valida/pubblica. Questo draft non introduce "Validatore eventi"; se Daniel vuole delega a validatori non-admin serve nuovo criterio. |
| Redirect server-side 301 | Questo draft usa redirect client-side. Redirect Firebase Hosting reali richiedono work order e deploy autorizzato. |

## 13. Handoff a Sviluppo — Checklist

1. Aggiungere modelli `StrutturaRegno`, `StrutturaRegnoCategoria`, `CommunityEventCatalogoScheda` in `community_module/models/community_models.py`.
2. Aggiungere campi `validato_da`, `validato_at`, `nota_validazione` e default `bozza` per `CommunityEvent`.
3. Creare/aggiornare script seed idempotente per i 9 regni e la mappa categoria-regno confermata da Daniel.
4. Aggiungere schemas Pydantic in `community_module/models/schemas.py`.
5. Creare router `community_module/api/struttura.py` e montarlo in `community_main.py`.
6. Estendere `community_module/api/catalogo.py` con `regno_codice`, `categoria_codice`, `categorie`.
7. Estendere `community_module/api/events.py` per bozza socio, validazione admin, join schede, filtro regno.
8. Estrarre da `Catalogo.jsx` un componente `CatalogoVista.jsx` riusabile.
9. Creare `CatalogoMap.jsx` con Leaflet e marker eventi multi-scheda.
10. Aggiornare `Home.jsx`, aggiungere `RegnoHub.jsx`, `RegnoSectionRouter.jsx`, `Yggdrasil.jsx`.
11. Aggiungere redirect legacy Step 5 solo quando Daniel conferma la tabella route.
12. Allineare `CatalogoValidazione.jsx`: admin sempre, validatori dominio se `is_validatore_per_dominio` ritorna true.
13. Implementare test backend/frontend elencati in Sez. 11.
14. Nessun deploy senza conferma esplicita in sessione, come da AGENTS.md R3/R8.

