# AT-CANZONIERE-003 — Analisi Tecnica
## Canzoniere Comunitario — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AT-CANZONIERE-003 |
| Fase | Analisi Tecnica (AT) |
| Base | AF-CANZONIERE-003 |
| Autore | Gemini/Antigravity |
| Validazione | Claude (prima dell'handoff a sviluppo) |
| Stack target | PostgreSQL + FastAPI (`community_module`) + React |

---

## 1. Rilievi Tecnici e Architetturali

In coerenza con l'intero ecosistema sviluppato:
- **Database**: Lo storage dei dati avverrà in PostgreSQL (`jackass_verona`), non in Firestore.
- **RBAC**: Si farà leva sull'architettura a 3 livelli (`guest`, `socio`, `admin`) ricavabile dal JWT. Come per la Catalogazione, si decide di **posticipare l'introduzione di un ruolo dedicato "Editor Canzoniere"** a una fase successiva. Nell'MVP, chiunque sia `socio` potrà inserire e modificare brani. Questo accelera il time-to-market e stimola la partecipazione iniziale.
- **Dipendenza UI**: L'AF menzionava l'aggiunta di "brani inseriti da me" in una pagina Profilo. Poiché l'AT-COMPETENZE-002 ha già introdotto la necessità di creare `Profilo.jsx`, questa feature si innesterà naturalmente in quella stessa pagina.

## 2. Schema Dati (PostgreSQL / SQLAlchemy)

Aggiunte in `community_models.py`:

```python
class CanzoniereBrano(Base):
    __tablename__ = "canzoniere_brani"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    titolo             = Column(String(200), nullable=False)
    autore             = Column(String(200))
    tipo               = Column(String(50), nullable=False, default="autore") # tradizionale, autore, cover
    tonalita_originale = Column(String(10))
    capotasto          = Column(Integer, default=0)
    tempo_bpm          = Column(Integer)
    ritmo_strumming    = Column(Text)
    testo_accordi      = Column(Text, nullable=False) # Markdown/ChordPro
    fonte              = Column(String(50), default="manuale")
    fonte_url          = Column(String(500))
    licenza            = Column(String(50))
    
    creato_da          = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    modificato_da      = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at         = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at         = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    # Campo per gestione concorrenza / versioning esplicito
    versione           = Column(Integer, nullable=False, default=1)

class CanzoniereVersione(Base):
    __tablename__ = "canzoniere_versioni"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    brano_id           = Column(UUID(as_uuid=True), ForeignKey("canzoniere_brani.id", ondelete="CASCADE"), nullable=False)
    versione           = Column(Integer, nullable=False)
    contenuto_testo    = Column(Text, nullable=False)
    modificato_da      = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    created_at         = Column(DateTime(timezone=True), nullable=False, default=func.now())

class CanzoniereRaccolta(Base):
    __tablename__ = "canzoniere_raccolte"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome        = Column(String(200), nullable=False)
    descrizione = Column(Text)
    pubblica    = Column(Boolean, nullable=False, default=False)
    creato_da   = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), nullable=False, default=func.now())

class CanzoniereRaccoltaBrano(Base):
    __tablename__ = "canzoniere_raccolte_brani"
    __table_args__ = (UniqueConstraint("raccolta_id", "brano_id"),)

    raccolta_id = Column(UUID(as_uuid=True), ForeignKey("canzoniere_raccolte.id", ondelete="CASCADE"), primary_key=True)
    brano_id    = Column(UUID(as_uuid=True), ForeignKey("canzoniere_brani.id", ondelete="CASCADE"), primary_key=True)
    ordine      = Column(Integer, nullable=False, default=0)
```

## 3. Motore di Trasposizione Accordi (Frontend)

Per rispettare il vincolo di leggerezza e mantenere la logica lato client, l'AT propone di **non introdurre dipendenze pesanti** per il parsing degli accordi. 
Si creerà un modulo utilitario in `src/utils/chordTransposer.js`:
1. Utilizza una Regex standard per identificare i tag `[ ]` del formato ChordPro, es. `\[([A-G][#b]?[a-zA-Z0-9]*)\]`.
2. Ha un array circolare di 12 semitoni: `['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']`.
3. Lo stato React (es. `transposeDelta = +2`) applica lo shift semitono per semitono in fase di renderizzazione. Questo non modifica il testo salvato nel database, agisce puramente sul rendering dell'anteprima.

## 4. API Endpoints (`community_module/api/canzoniere.py`)

- `GET /brani` (Pubblico) — Lista base (con paginazione/ricerca testuale su titolo e autore).
- `GET /brani/{id}` (Pubblico) — Dettaglio brano.
- `POST /brani` (`require_socio`) — Crea brano, salva versione 1 in `canzoniere_versioni`.
- `PUT /brani/{id}` (`require_socio`) — Modifica brano. Il backend deve autoincrementare `versione` in `canzoniere_brani` e salvare lo snapshot precedente/nuovo in `canzoniere_versioni`.
- `GET /brani/{id}/versioni` (`require_socio`) — Mostra lo storico.
- Endpoint analoghi per `GET/POST/PUT/DELETE` sulle Raccolte e l'ordinamento all'interno di esse.

## 5. UI/UX Frontend

- **Editor ChordPro Live**: Inserimento testuale (es. una `textarea` monospaced) diviso a metà o a tab: "Sorgente" e "Anteprima".
- **Vista Stampa**: Implementata via CSS (`@media print`). Rimuoverà header, navigazione e padding, convertendo i colori scuri in bianco e nero e applicando `page-break-inside: avoid` ai blocchi di strofa.

## 6. Rischi e Punti Aperti

| Punto | Chi decide | Nota |
|---|---|---|
| Editor Canzoniere (Ruolo) | Daniel | L'AT consiglia di partire con tutti i `socio` abilitati, per poi rivalutare se servono moderatori espliciti. Confermato? |
| Import Esterno | Daniel | Rimandato esplicitamente in Fase 2 per ragioni legali. |

## 7. Handoff a Sviluppo
- [ ] Creare modelli SQLAlchemy in `community_models.py`
- [ ] Predisporre Pydantic Schemas e controller FastAPI `canzoniere.py`
- [ ] Sviluppare `src/utils/chordTransposer.js`
- [ ] Implementare `Canzoniere.jsx`, `CanzoniereEditor.jsx` e `Raccolte.jsx`
- [ ] Aggiungere stili `@media print` in `index.css` per ottimizzazione carta.
