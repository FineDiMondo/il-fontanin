# AT-COMPETENZE-002 — Analisi Tecnica
## Sistema Profilo Competenze e Questionari Modulari — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AT-COMPETENZE-002 |
| Fase | Analisi Tecnica (AT) |
| Base | AF-COMPETENZE-002 |
| Autore | Claude — prodotta direttamente su richiesta esplicita di Daniel (2026-07-05), saltando l'handoff a Haiku/Cowork |
| Validazione | Da rileggere da Daniel prima di consegnare a Gemini/Antigravity — in particolare la Sez. 1 |
| Sviluppo e Test | Gemini/Antigravity |
| Stack target | FastAPI + SQLAlchemy + PostgreSQL (`community_module`), **non Firestore** — vedi Sez. 1 |
| Repo analizzato | `D:\Progetti GCloud\fontanin` (stato al 2026-07-05) |

---

## 1. Rilievo Tecnico Critico — supera la decisione "Firestore" del 2026-07-05

Prima di progettare, ho letto il codebase reale (non solo l'AF). Tre fatti cambiano la base di partenza:

**1. Il RBAC "già in uso" non ha 4 ruoli.** `community_module/models/community_models.py` ha un solo campo `ruolo` (String) con 3 valori reali: `guest`, `socio`, `admin`. Non esiste un ruolo "Validatore" né un "Visitatore" distinto da `guest`. L'AF assumeva un riuso as-is di Visitatore/Membro/Validatore/Amministratore che nel codice non esiste — è un modello RBAC generico, non quello di questo repo.

**2. Il metodo di evidenza GN370 [C]/[D]/[I]/[L] non è in questo repo.** Nessuna occorrenza nel codice. È un riferimento a un altro progetto (genealogico), non un componente riusabile qui. Va trattato come una convenzione nuova da definire, non un import.

**3. Firestore, dove esiste, è toccato solo dal backend via Admin SDK — mai dal client.** `src/firebase.js` inizializza solo `getAuth`, non `getFirestore`: il client non ha mai un SDK Firestore. `media_service.py` scrive su Firestore usando `firebase_admin` lato server, con privilegi di Admin che **bypassano** `firestore.rules`. Quel file di regole esiste ma oggi non è il percorso di enforcement reale per nessuna feature: è codice morto rispetto al flusso effettivo.


**Tutto il resto dell'app** (forum, chat, eventi, lavori, research) è FastAPI + SQLAlchemy + PostgreSQL (Cloud SQL, DB `jackass_verona`), con auth JWT propria (`community_auth.py`) e ruolo letto da Postgres — non da Custom Claims Firebase, che nel codice non vengono nemmeno sincronizzati con `ruolo`.

**Decisione tecnica (mia responsabilità come autore dell'AT, supera la risposta "Firestore" data prima di questa analisi):** il profilo competenze vive in **PostgreSQL**, dentro `community_module`, esposto via nuovo router FastAPI — non in Firestore.

**Perché:** Firestore richiederebbe (a) aggiungere per la prima volta il client SDK Firestore al frontend, (b) far vivere `firestore.rules` per la prima volta come enforcement reale, (c) mantenere due fonti di verità sul ruolo utente (Postgres `ruolo` + eventuali claim Firebase). Postgres invece riusa esattamente lo stesso stack, la stessa autenticazione JWT e lo stesso pattern di ogni altra feature del repo (vedi `lavori.py`, `research.py`, `forum`). È la scelta coerente con un metodo sistemico e deterministico: un solo backend, un solo modello di ruolo, zero infrastruttura parallela per un pilot.

**Questo non è irreversibile**: se Daniel ha un motivo per preferire comunque Firestore (es. piano di migrazione dell'intera app che non conosco), va segnalato prima dello sviluppo — ma la raccomandazione tecnica ferma di questo documento è Postgres, ed è quanto segue è progettato di conseguenza.

## 2. Schema Dati — PostgreSQL / SQLAlchemy

Due tabelle nuove in `community_module/models/community_models.py`, stesso stile delle esistenti (UUID PK, `func.now()`, JSONB per campi variabili).

### 2.1 `competenza_domini` — registro domini/questionari (gestito da Amministratore)

```python
class CompetenzaDominio(Base):
    __tablename__ = "competenza_domini"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    codice       = Column(String(50), unique=True, nullable=False)   # es. "monumenti-cristiani"
    nome         = Column(String(100), nullable=False)
    descrizione  = Column(Text)
    domande_json = Column(JSONB, nullable=False)   # lista {id, testo, tipo, opzioni?, scala_min?, scala_max?}
    attivo       = Column(Boolean, nullable=False, default=True)
    created_by   = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at   = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at   = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
```

Il campo `tipo` delle domande riusa lo stesso vocabolario già usato in `ResearchSurvey.domande_json` (`testo`, `scelta_singola`, `scelta_multipla`, `scala`) — stessa UI di `SurveyForm` in `Research.jsx`, zero componenti nuovi per il rendering delle domande.

### 2.2 `competenza_utente` — dichiarazione/validazione per utente e dominio

```python
class CompetenzaUtente(Base):
    __tablename__ = "competenza_utente"
    __table_args__ = (UniqueConstraint("user_id", "dominio_id"),)

    id                     = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id                = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), nullable=False)
    dominio_id             = Column(UUID(as_uuid=True), ForeignKey("competenza_domini.id", ondelete="CASCADE"), nullable=False)
    livello_dichiarato     = Column(String(20), nullable=False, default="nessuna")  # nessuna|base|intermedia|esperta
    livello_validato       = Column(String(20))  # stessa scala, null finché non validato
    validato_da            = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    validato_at            = Column(DateTime(timezone=True))
    fonte                  = Column(Text)   # es. "storico dell'arte", "archivista", "interesse personale"
    risposte_json          = Column(JSONB)  # risposte al questionario di dominio
    data_ultima_revisione  = Column(DateTime(timezone=True), nullable=False, default=func.now())
    created_at             = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at             = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
```

**Provisioning**: nessun framework di migrazione (no Alembic nel repo). Le due tabelle vanno create con `Base.metadata.create_all(engine)` eseguito una tantum contro Cloud SQL, come probabilmente già fatto per le tabelle esistenti — Gemini/Antigravity deve verificare come sono state create le tabelle attuali prima di scegliere come applicare questa migrazione (script manuale vs shell Python one-off).

## 3. Schemas Pydantic (`community_module/models/schemas.py`)

```python
class DomandaCompetenza(BaseModel):
    id: str
    testo: str
    tipo: str  # testo | scelta_singola | scelta_multipla | scala
    opzioni: Optional[List[str]] = None
    scala_min: Optional[int] = None
    scala_max: Optional[int] = None

class DominioCreate(BaseModel):
    codice: str = Field(min_length=2, max_length=50)
    nome: str
    descrizione: Optional[str] = None
    domande: List[DomandaCompetenza]

class DominioOut(BaseModel):
    id: UUID
    codice: str
    nome: str
    descrizione: Optional[str] = None
    domande_json: List[Dict[str, Any]]
    attivo: bool
    created_at: datetime

    class Config:
        from_attributes = True
```

```python
class CompetenzaDichiarazione(BaseModel):
    livello_dichiarato: str  # nessuna|base|intermedia|esperta
    fonte: Optional[str] = None
    risposte_json: Optional[Dict[str, Any]] = None

class CompetenzaValida(BaseModel):
    livello_validato: str
    nota: Optional[str] = None

class CompetenzaOut(BaseModel):
    id: UUID
    dominio_id: UUID
    livello_dichiarato: str
    livello_validato: Optional[str] = None
    fonte: Optional[str] = None
    data_ultima_revisione: datetime

    class Config:
        from_attributes = True
```

## 4. Mappatura ruoli AF → ruoli reali

Il ruolo Validatore dell'AF **non** è un quarto valore di `ruolo`: è una qualifica sopra il ruolo `socio` esistente, esattamente come voleva l'AF originale ("qualifica, non ruolo nominale"). Corrispondenza:

| Ruolo AF | Ruolo reale | Condizione aggiuntiva |
|---|---|---|
| Visitatore | `guest` / non autenticato | — |
| Membro | `socio` | — |
| Validatore (per un dominio) | `socio` | + `livello_validato` non nullo su quel `dominio_id`, oppure `ruolo == 'admin'` (l'admin valida ovunque) |
| Amministratore | `admin` | — |

## 5. Endpoint (`community_module/api/competenze.py`, montato su `/community/competenze`)

| Metodo | Path | Guard | Note |
|---|---|---|---|
| GET | `/domini` | pubblico | Lista domini attivi (per mostrare il questionario) |
| POST | `/domini` | `require_admin` | Crea nuovo dominio — governance chiusa in AF Sez. 7: solo Admin |
| GET | `/me` | `get_current_user` | Tutte le righe competenza dell'utente corrente |
| PUT | `/me/{dominio_id}` | `require_socio` | Utente crea/aggiorna la propria dichiarazione (upsert su `user_id`+`dominio_id`) |
| PATCH | `/{competenza_id}/valida` | `require_admin` | Admin imposta `livello_validato` |
| GET | `/me/validatore/{dominio_codice}` | `get_current_user` | Risponde `{"is_validatore": bool}` — usato dal motore di catalogazione |

**Nota di scope (Sez. 3 AF diceva "Amministratore o Validatore senior" può validare):** per il pilot questo AT limita la validazione al solo `require_admin`. "Validatore senior" non è definito da nessuna parte (chi lo è? come si diventa senior?) e aprirebbe un problema di bootstrap (chi valida il primo validatore?). Estensione futura possibile, non bloccante per il pilot — segnalato come scope reso esplicito, non deciso a caso.

## 5.1 Funzione di integrazione per il motore di catalogazione

In `community_module/services/competenze_service.py`:

```python
def is_validatore_per_dominio(session, user: CommunityUser, dominio_codice: str) -> bool:
    if user.ruolo == "admin":
        return True
    if user.ruolo != "socio":
        return False
    dominio = session.query(CompetenzaDominio).filter(
        CompetenzaDominio.codice == dominio_codice
    ).first()
    if not dominio:
        return False
    riga = session.query(CompetenzaUtente).filter(
        CompetenzaUtente.user_id == user.id,
        CompetenzaUtente.dominio_id == dominio.id,
    ).first()
    return bool(riga and riga.livello_validato)
```

Questa è la funzione che AT-CATALOGAZIONE-001 richiama come `require_validatore_dominio` (vedi quel documento, Sez. 4).

## 6. Componente React

**Rilievo**: l'AF assumeva una "propria scheda profilo" già esistente in cui aggiungere una sezione Competenze. **Non esiste nessuna pagina profilo utente nel repo** (`src/pages/` non ha un `Profilo.jsx` o simile). Questo AT introduce quindi:

- `src/pages/Profilo.jsx` — nuova pagina, route `/profilo`, linkata da `AppHeader`/`UserAvatar` (menu utente) — dati base utente (nome, email, ruolo) + sezione Competenze
- `src/components/competenze/CompetenzeSection.jsx` — fetcha `GET /community/competenze/domini` + `GET /community/competenze/me`, per ogni dominio attivo renderizza un form basato su `domande_json` riusando la stessa logica di rendering domande già scritta in `SurveyForm` (`Research.jsx`), estesa con un selettore "Livello dichiarato" (radio/select nessuna/base/intermedia/esperta) e un campo `fonte` testuale
- Submit → `PUT /community/competenze/me/{dominio_id}`

## 7. Rischi e punti aperti che questo AT non risolve

| Punto | Chi decide | Nota |
|---|---|---|
| Postgres al posto di Firestore | Daniel (da riconfermare) | Raccomandazione tecnica ferma di questo AT, vedi Sez. 1 — non blocca lo sviluppo ma va letta prima di avviarlo |
| Validazione solo Admin (no "Validatore senior") | Daniel | Scope semplificato per il pilot, vedi Sez. 5 |
| Nessuna pagina Profilo esistente | Nessuno — è un fatto, non una scelta | Aggiunge una pagina net-new allo scope tecnico rispetto a quanto l'AF lasciava intendere |
| `risposte_json` senza validazione di schema oltre `Dict[str, Any]` | Nessuno | Stesso pattern già in produzione per `ResearchResponse.risposte_json` — non è una regressione di qualità |

## 8. Handoff a Gemini/Antigravity — checklist

1. Aggiungere `CompetenzaDominio` e `CompetenzaUtente` a `community_module/models/community_models.py` (Sez. 2)
2. Applicare le tabelle a Cloud SQL (`jackass_verona`) — verificare prima come sono state create le tabelle esistenti, non esiste Alembic
3. Aggiungere gli schemas Pydantic a `community_module/models/schemas.py` (Sez. 3)
4. Creare `community_module/api/competenze.py` con gli endpoint di Sez. 5, seguendo esattamente il pattern di `lavori.py` (stesso stile try/finally, stesse dependency `require_socio`/`require_admin`/`get_current_user`)
5. Montare il router in `community_module/community_main.py` (`community_router.include_router(competenze_router)`)
6. Creare `community_module/services/competenze_service.py` con `is_validatore_per_dominio` (Sez. 5.1)
7. Creare `src/pages/Profilo.jsx` + `src/components/competenze/CompetenzeSection.jsx` (Sez. 6), aggiungere voce di navigazione da `AppHeader`/`UserAvatar`
8. Popolare il primo dominio (`monumenti-cristiani`) via `POST /community/competenze/domini` come admin, con le domande indicative già in AF-COMPETENZE-002 Sez. 4.2 — da confermare con Daniel prima della pubblicazione reale
9. Testare il bootstrap: nessun utente è Validatore finché un Admin non valida almeno una dichiarazione — verificare che il motore di catalogazione (AT-CATALOGAZIONE-001) gestisca correttamente lo stato "nessun Validatore ancora qualificato" senza bloccare la coda di validazione (l'Admin deve poter sempre validare come fallback)
