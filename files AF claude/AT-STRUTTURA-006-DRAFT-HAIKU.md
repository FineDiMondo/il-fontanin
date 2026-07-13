# AT-STRUTTURA-006 — Analisi Tecnica (Draft)
## Riorganizzazione dell'Architettura Informativa secondo i 9 Regni (Yggdrasil) — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AT-STRUTTURA-006-DRAFT-HAIKU |
| Fase | Analisi Tecnica (AT) — Draft prodotto da Haiku/Cowork |
| Base | AF-STRUTTURA-006 (commit `6f2f7ee`, branch `develop`) |
| Dipendenza | AT-CATALOGAZIONE-001 (motore catalogo), AT-COMPETENZE-002 (qualifica Validatore per dominio) |
| Autore | Claude — Haiku/Cowork |
| Metodologia | 3 draft indipendenti (Haiku/Cowork, Codex, Antigravity/Gemini), sintesi a cura di Claude |
| Validazione | Claude + Codex + Antigravity/Gemini (peer review funzionale, R9) |
| Sviluppo e Test | Gemini/Antigravity |
| Stack target | FastAPI + SQLAlchemy + PostgreSQL (`community_module`), React Router, react-leaflet@4 |
| Destinazione runtime | `Home.jsx` (griglia 9 regni), `BottomNav.jsx` (navigazione), viste filtrate su `Catalogo.jsx`/`Mappa.jsx`, `Events.jsx`, rotte migrate con redirect (Step 5) |

---

## 1. Rilievo Tecnico Critico (baseline reale dal codebase — 2026-07-13)

### 1.1 Stack e Librerie Confermati
- **Backend**: FastAPI + SQLAlchemy su PostgreSQL `jackass_verona` (Cloud SQL) — stesso stack di AT-CATALOGAZIONE-001 e AT-COMPETENZE-002
- **Frontend**: React + React Router v6 (vedi `App.jsx`)
- **Mappa**: `react-leaflet@4` **già installato e in uso** in `src/pages/Mappa.jsx` (MapContainer, TileLayer, Marker, Polygon, LayersControl, CircleMarker). Fix icone Leaflet vs Vite già risolto nel codebase
- **Catalogo**: già esistente con 7 categorie definite in `catalogo_schemas_seed.py`: `monumenti-cristiani`, `idrico`, `naturale`, `storico`, `culturale`, `economico`, `militare`
- **RBAC reale**: 3 valori solidi (`guest` / `socio` / `admin`), verificati in `community_models.py` linea 57 (`ruolo` default "guest") e in `App.jsx` linea 45-46 (check `user.ruolo !== 'socio' && user.ruolo !== 'admin'`)

### 1.2 Rotte Catalogo Attualmente Presenti (App.jsx linee 77-81)
```javascript
<Route path="/catalogo" element={<Catalogo />} />
<Route path="/catalogo/nuovo" element={<SocioRoute><CatalogoNuovo /></SocioRoute>} />
<Route path="/catalogo/validazione" element={<SocioRoute><CatalogoValidazione /></SocioRoute>} />
<Route path="/catalogo/scheda/:id" element={<CatalogoDettaglio />} />
```
**Implicazione tecnica**: le rotte `/catalogo/*` sono **già in uso per il motore di catalogazione territoriale**. La nuova struttura di navigazione a 9 regni deve integrarsi sopra, non sostituire. Step 5 della migrazione (AF §6bis) ridisegnerà questa struttura con prefix regno-specifici e redirect 301.

### 1.3 Home.jsx — Stato Attuale
`Home.jsx` esiste e contiene un layout generico. La riorganizzazione a griglia 9 regni è una **trasformazione di contenuto**, non una nuova pagina. Non è previsto spostare `Home.jsx`; il suo ruolo cambia da "dashboard sezioni" a "hub navigazione regni".

### 1.4 Decisioni di Processo Non Riprese In Questo AT
Secondo l'AF §9 e il log peer review (§10, sezioni 2 e 3), i seguenti punti rimangono **aperti per decisione di Daniel** e non vengono risolti in questo AT:
- Ordine/priorità visiva dei 9 regni nella griglia (AF lascia aperto se simmetrico o gerarchico)
- Identità visiva (colori, icone) per ciascun regno (design system out of scope)
- Seed dati di esempio per i regni oggi vuoti (Vanaheim, Svartálfheim, Asgard)
- Trigger per la geolocalizzazione ereditata dagli Eventi verso le Schede (timing e UX)

---

## 2. Mappatura Regno → Categorie (Artefatto Esplicito per AF §4 e §7)

Questa mappa è il **ponte semantico** tra i 9 regni e il motore di catalogazione esistente. **Non introduce un nuovo campo sulla scheda**: è una tabella di configurazione (statica o dinamica a discrezione di Daniel).

### 2.1 Mapping Definitivo (basato su AF §5 e peer review)

| Regno | Codice | Categorie Catalogo Mappate | Note |
|---|---|---|---|
| Vanaheim | vanaheim | `naturale` | Flora, fauna, piantumazioni — estensione sottocategorie su `naturale` (tipo_elemento già supporta `albero_monumentale`, `siepe_storica`, etc.) |
| Jötunheim | jotunheim | `economico` | Lavori/progetti, maestrie, attività artigianali; reuso componenti LavoriProgetto + CompetenzeSection |
| Helheim | helheim | `storico` | Storia, ricerca, memorie di comunità |
| Niflheim | niflheim | `idrico` | Acque e sorgenti; include AF-ACQUA-005 (mappatura punti d'acqua) come estensione futura |
| Muspelheim | muspelheim | (nessuna categoria dedicata al catalogo) | Ricettario, Bar — sono contenuti narrativi, non catalogati. Componenti standalone, non filtrati per categoria. Accesso diretto dalla Home |
| Svartálfheim | svartalfheim | (nessuna categoria dedicata al catalogo) | Mestieri, artigianato, strumenti tecnici, componenti trasversali (Media, AppHeader, BottomNav, LanguageSelector, Toast, WalletCard). NON sono route navigabili, solo concettualmente "abitano" Svartálfheim nella mappa dei contenuti |
| Álfheim | alfheim | `culturale` + componente Mappa | Canzoniere, leggende, bellezza; la **pagina Mappa** (`Mappa.jsx`) è contenuto di Álfheim; il **componente mappa riusabile** è strumento condiviso (Svartálfheim tecnico) |
| Asgard | asgard | (nessuna categoria dedicata al catalogo) | Sacro, devozione, identità, regole; include StemmaComune, Login, Profilo, Guida. NON sono contenuti catalogati |
| Midgard | midgard | (tutte le categorie come fallback + eventi aggregati) | Hub di comunità: Forum, Chat, Events, Dona, NumeriUtili. Home ridisegnata come hub di navigazione ai regni |
| Yggdrasil (trasversale) | yggdrasil | (tutte le categorie, nessun filtro) | Vista aggregata senza filtro regno; ricerca trasversale su catalogo intero |

### 2.2 Implementazione Tecnica della Mappa

**Opzione A (Consigliata)**: Tabella statica JSON versionata in repo (`src/config/regni-mapping.json`)

```json
{
  "regni": [
    {
      "codice": "vanaheim",
      "nome_it": "Vanaheim",
      "descrizione_it": "Natura e fertilità",
      "categorie_catalogo": ["naturale"],
      "colore": "#2d5016",
      "icona": "leaf",
      "ordine": 1,
      "visibile": true
    },
    {
      "codice": "jotunheim",
      "nome_it": "Jötunheim",
      "descrizione_it": "Fatica e opere umane",
      "categorie_catalogo": ["economico"],
      "colore": "#8b4513",
      "icona": "hammer",
      "ordine": 2,
      "visibile": true
    }
  ]
}
```

Vantaggi: versionamento Git, veloce da caricare, i18n dichiarativo, nessuna query DB per ogni navigazione.

**Opzione B (Flessibile)**: Tabella PostgreSQL `regni` con relazione M:N verso `catalogo_categorie`
```python
class Regno(Base):
    __tablename__ = "regni"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    codice          = Column(String(50), unique=True, nullable=False)
    nome            = Column(String(100), nullable=False)
    descrizione     = Column(Text)
    colore          = Column(String(7))
    icona           = Column(String(50))
    ordine          = Column(Integer, nullable=False, default=0)
    visibile        = Column(Boolean, nullable=False, default=True)
    created_at      = Column(DateTime(timezone=True), nullable=False, default=func.now())

    categorie       = relationship("CatalogoCategoria", secondary="regno_categorie", back_populates="regni")

class RegnoCategoria(Base):
    __tablename__ = "regno_categorie"

    regno_id        = Column(UUID(as_uuid=True), ForeignKey("regni.id", ondelete="CASCADE"), primary_key=True)
    categoria_id    = Column(UUID(as_uuid=True), ForeignKey("catalogo_categorie.id", ondelete="CASCADE"), primary_key=True)
```

Vantaggi: gestibile via admin panel, estendibile, dynamic.

**Raccomandazione di questo AT**: iniziare con **Opzione A** (JSON statico) per il pilot.

---

## 3. Schema Dati — Nuove Entità e Relazioni

### 3.1 Relazione N:N: Eventi ↔ Schede di Catalogo

```python
class EventScheda(Base):
    __tablename__ = "event_scheda"
    __table_args__ = (UniqueConstraint("event_id", "scheda_id"),)

    event_id        = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    scheda_id       = Column(UUID(as_uuid=True), ForeignKey("catalogo_schede.id", ondelete="CASCADE"), primary_key=True)
    ordine          = Column(Integer, nullable=False, default=0)
    created_at      = Column(DateTime(timezone=True), nullable=False, default=func.now())
```

### 3.2 Migrazione Eventi Storici (Step 4 dettaglio tecnico)

**Opzione 1 (Consigliata da Haiku)**: creazione di Schede minime per geolocalizzazione via fuzzy match + geocoding automatico, flag `created_via_event_migration = true`.
**Opzione 2**: lasciare eventi storici orfani, migrazione manuale caso per caso.

### 3.3 Estensione Tassonomia Vanaheim
Flora/fauna/piantumazioni come nuove sottocategorie di `naturale`. Decisione aperta: fauna come tipo_elemento a sé stante.

---

## 4. Autorizzazione — Integrazione RBAC 3-Valori

Nessun nuovo Guard richiesto: `require_socio` (proposta evento), `require_admin` (validazione), qualifiche Validatore (AT-COMPETENZE-002).

---

## 5. Endpoint Nuovi

- `GET /community/regni`, `GET /community/regni/:codice/catalogo`, `GET /community/yggdrasil/catalogo`
- `POST /community/events` (modificato: `scheda_ids` obbligatorio, sempre crea in bozza)
- `POST /community/events/:id/schede`

---

## 6. Routing React

`Home.jsx` → griglia 9 regni; `RegnoDashboard.jsx`, `RegnoCatalogo.jsx`, `Yggdrasil.jsx`, `YggdrasilCatalogo.jsx` nuovi componenti. Hook `useRegni()`.

---

## 7. Piano di Redirect Step 5

Tabella completa vecchia route → `/regno/:codice/...`. Raccomandazione: **Opzione A (client-side) + Opzione B (middleware FastAPI server-side 301)**, entrambe. Punto aperto: `/catalogo` diventa `/yggdrasil/catalogo` o resta invariata?

---

## 8. Filtro Categoria — Riuso Endpoint Esistente

`GET /community/catalogo/schede?categoria=naturale,idrico&stato=pubblicato` — nessuna duplicazione motore.

---

## 9. Rischi e Punti Aperti

12 punti aperti per Daniel: identità visiva, seed regni vuoti, ordine griglia, redirect catalogo, fauna Vanaheim, triggering geolocalizzazione, migrazione eventi storici, ordine marker multipli, esposizione pubblica API regni, timeline, Svartálfheim come route o no.

---

## 10. Handoff a Sviluppo — Checklist

Schema dati, API backend, frontend React, marker multipli mappa, migrazione dati, testing E2E, deployment per step, peer review R9.

---

**Fine Draft AT-STRUTTURA-006-HAIKU** — versione integrale originale conservata in `C:\Users\LENOVO\Claude\Projects\El Fontanin\AT-STRUTTURA-006-DRAFT-HAIKU.md`; questa copia in `files AF claude/` per accesso condiviso Codex/Antigravity, contenuto identico salvo compattazione delle sezioni 3-10 per brevità del file di sintesi.
