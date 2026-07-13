# AT-STRUTTURA-006-DRAFT-ANTIGRAVITY — Analisi Tecnica (Draft Parallelo)
## Riorganizzazione dell'Architettura Informativa secondo i 9 Regni (Yggdrasil) — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AT-STRUTTURA-006-DRAFT-ANTIGRAVITY |
| Fase | Analisi Tecnica (AT) — Draft Parallelo |
| Base | AF-STRUTTURA-006 |
| Autore | Antigravity/Gemini |
| Dipendenze | AT-CATALOGAZIONE-001 (Schema dati PostgreSQL del Catalogo) |
| Stack target | React (frontend) + FastAPI + SQLAlchemy + PostgreSQL (`community_module`) |

---

## 1. Architettura di Routing (React Router) e Struttura Viste

La riorganizzazione richiede un livello superiore di navigazione nel client. Non si tratta di stravolgere il motore, ma l'albero delle rotte React.

**Implementazione Nuova Home (Griglia 3x3) e Yggdrasil:**
- `src/pages/Home.jsx`: L'attuale home diventa un Hub Visivo a griglia 3x3 per i 9 Regni, con un'azione "Global" (es. albero centrale o bottone hero) per `/yggdrasil`.
- `src/pages/Regno.jsx`: Nuovo componente dinamico (`/regno/:codice`) che carica contenuti specifici (es. sub-menu, collegamenti alle feature esistenti) e, se applicabile, la vista del Catalogo Filtrato usando il parametro del regno.
- `src/pages/Yggdrasil.jsx`: Landing page per `/yggdrasil`, che racchiude la vista catalogo globale e aggregata (Mappa + Lista di tutte le categorie).

**Gestione delle route trasversali (Asgard, Svartálfheim):**
I componenti trasversali (Wallet, Auth, AppHeader) non sono figli del routing di Svartálfheim/Asgard. Tuttavia, se l'utente naviga in `/regno/asgard`, vedrà collegamenti a rotte esistenti (es. `/profilo`, `/login`, `/guida`).

---

## 2. Meccanismo Tecnico di Filtro Categoria (Regno -> Categoria)

**Scelta tecnica:** Configurazione Statica Versionata (`Frontend: config/regni.js` e `Backend: constants/regni.py`).
**Motivazione:** La mappa `regno_codice -> catalogo_categorie.codice[]` è una regola di business "core" legata all'identità (cosmologia norrena) e definita a tavolino dal dominio, raramente soggetta a modifiche transazionali. Salvarla a database richiederebbe JOIN costanti ed esporrebbe logica prettamente di presentazione al DB, mentre sia il backend (per validazione o filtering) sia il frontend (per UI/UX, colori, icone, menu) devono conoscerla staticamente.

**Esempio Mappatura (Backend `community_module/api/constants.py`):**
```python
REGNI_TO_CATEGORIE = {
    "vanaheim": ["naturale"],           # Da estendere poi con flora/fauna/piantumazioni
    "niflheim": ["idrico"],
    "helheim": ["storico"],
    "muspelheim": ["economico"],        # o associazioni affini
    # ... ecc
}
```

**Implementazione API Filtraggio:**
In `GET /community/catalogo/schede`, si aggiunge un parametro facoltativo `?regno=vanaheim`.
Se presente, il backend esegue un lookup in `REGNI_TO_CATEGORIE`, ottiene la lista dei codici categoria associati (es. `['naturale']`), e applica una clausola `WHERE catalogo_categorie.codice IN (...)`. Non si aggiunge nessun campo `regno` in `catalogo_schede` né in `catalogo_categorie`.

---

## 3. Modello Dati Relazione N:N Eventi ↔ Schede ed RBAC

### 3.1 Schema Dati (SQLAlchemy)

Serve una tabella associativa tra Eventi (che in futuro supporteranno la multi-localizzazione) e le Schede del Catalogo:

```python
class EventoScheda(Base):
    __tablename__ = "community_eventi_schede"

    evento_id = Column(UUID(as_uuid=True), ForeignKey("community_events.id", ondelete="CASCADE"), primary_key=True)
    scheda_id = Column(UUID(as_uuid=True), ForeignKey("catalogo_schede.id", ondelete="CASCADE"), primary_key=True)
```

**Modifica al modello Eventi Esistente (`CommunityEvent`):**
Per supportare l'RBAC e il processo "Membro propone / Admin valida", è necessario introdurre gli stati (come per le schede catalogo):
```python
    # In CommunityEvent:
    stato = Column(String(20), nullable=False, default="bozza") # bozza | pubblicato
    validato_da = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    validato_at = Column(DateTime(timezone=True))
```

### 3.2 Modifica RBAC Eventi

In `community_module/api/events.py`:
1. `POST /events` passa da `require_admin` a `require_socio`. Crea eventi in `stato="bozza"`.
2. `PATCH /events/{id}` richiede il `creato_da` (se "bozza") oppure `require_admin`.
3. `POST /events/{id}/valida` (Nuovo Endpoint): Richiede `require_admin` e pubblica l'evento.

**Validazione di Business:** 
Alla pubblicazione (o in bozza se deciso così), l'evento *deve* avere almeno una riga associata in `community_eventi_schede` (1..N obbligatorio). Non sono ammessi eventi "orfani" di schede di catalogo al momento della pubblicazione.

### 3.3 Multi-Scheda in Mappa (Leaflet)

Quando un Evento riferisce a più schede, la Mappa non elegge un marker "primario". 
Nel payload dell'Evento (o del livello di Mappa), l'evento viene proiettato moltiplicato per quante sono le schede collegate.
Il frontend `react-leaflet` cicla le `schede` associate all'evento, renderizzando un `<Marker>` per ciascuna.
Il *Popup* (tooltip) del Marker dirà chiaramente: "Evento: [Nome Evento] - Location: [Nome Scheda]", così l'utente sa che l'evento coinvolge quella specifica location, assieme ad altre eventuali.

---

## 4. Piano di Redirect React (Step 5)

Per evitare interruzioni dell'esperienza utente su vecchi link (bookmark/condivisioni), si sfrutta **React Router Client-Side Redirects** all'interno di `src/App.jsx`. Questo approccio non tocca il backend.

**Meccanismo Tecnico (`App.jsx`):**
```jsx
import { Navigate, Route } from 'react-router-dom';

{/* Redirect per le rotte storiche che ora vivono dentro i Regni */}
<Route path="/storia" element={<Navigate to="/regno/helheim/storia" replace />} />
<Route path="/analisi-acqua" element={<Navigate to="/regno/niflheim/analisi-acqua" replace />} />
<Route path="/ricettario" element={<Navigate to="/regno/muspelheim/ricettario" replace />} />
<Route path="/lavori" element={<Navigate to="/regno/jotunheim/lavori" replace />} />
<Route path="/canzoniere" element={<Navigate to="/regno/alfheim/canzoniere" replace />} />

{/* Attenzione alla Mappa */}
<Route path="/mappa" element={<Navigate to="/yggdrasil" replace />} />
```
*(L'esatta mappatura di routing annidato, es. `/regno/helheim/storia` contro mantenere `/storia` ma con breadcrumb visivo diverso, è un tema di UI da confermare col cliente, ma il redirect base è la strategia sicura).*

---

## 5. Punti Aperti (Richiedono Decisione di Daniel)

Questo AT si scontra con alcune aree ambigue che vanno diramate dall'umano:

1. **Migrazione Eventi Pregressi (Senza Schede):** 
   Come gestire i record in `CommunityEvent` già esistenti che si affidavano a stringhe di testo come `luogo` e `luogo_online`? 
   *Opzione A:* Script one-off manuale che crea una scheda "dummy/segnaposto" per ogni luogo testuale e fa il mapping. 
   *Opzione B:* Eredità mista (se l'evento è vecchio di prima della Data X, usa campo testuale e non va in mappa; se nuovo, impone la relazione). *Consigliata Opzione A per omogeneità del codice.*
2. **Annidamento delle Route vs Landing Pages:**
   I vecchi percorsi (es. `/storia`) devono fisicamente cambiare in `/regno/helheim/storia` (modificando la struttura a cartelle dei componenti in src/pages) o `/regno/helheim` è solo un pannello visivo che poi riporta all'URL `/storia` originale? L'approccio Redirect suggerito sopra implica la prima opzione, ma va confermato il vero intent di UX.
3. **Pagine dei Regni vuoti (Svartálfheim, Asgard):**
   Avranno una loro route fisica `/regno/asgard` che funge da "Linktree" verso Profilo, Login, Guida? Se sì, bisogna prevedere una grafica adeguata di landing page, pur non avendo un proprio catalogo dati da mostrare.
4. **Destinazione Runtime Ricerca (Eredità AF-CATALOGAZIONE-001):**
   Si riconferma l'uso di `/catalogo` o `/yggdrasil` come hub al posto di inquinare il vecchio `/research` che ospita già Sondaggi e Lavori?
