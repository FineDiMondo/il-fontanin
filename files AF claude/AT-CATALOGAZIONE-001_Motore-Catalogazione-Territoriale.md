# AT-CATALOGAZIONE-001 — Analisi Tecnica
## Motore di Catalogazione Territoriale — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AT-CATALOGAZIONE-001 |
| Fase | Analisi Tecnica (AT) |
| Base | AF-CATALOGAZIONE-001 |
| Dipendenza | AT-COMPETENZE-002 (qualifica Validatore per dominio) |
| Autore | Claude — prodotta direttamente su richiesta esplicita di Daniel (2026-07-05), saltando l'handoff a Haiku/Cowork |
| Validazione | Da rileggere da Daniel prima di consegnare a Gemini/Antigravity |
| Sviluppo e Test | Gemini/Antigravity |
| Stack target | FastAPI + SQLAlchemy + PostgreSQL (`community_module`) — **non Firestore** |
| Destinazione runtime | `el-fontanin.web.app/research` → in realtà nuova route `/catalogo` (vedi Sez. 6) |

---

## 1. Rilievo Tecnico Critico (riassunto — dettaglio completo in AT-COMPETENZE-002 Sez. 1)

Stessa analisi del codebase fatta per AT-COMPETENZE-002 si applica qui: il RBAC reale ha 3 valori (`guest`/`socio`/`admin`), Firestore è toccato solo dal backend via Admin SDK e non è mai raggiunto dal client, il metodo di evidenza GN370 non esiste in questo repo. **Il motore di catalogazione va costruito su PostgreSQL via `community_module`, non su Firestore**, per restare coerente con AT-COMPETENZE-002 e con il resto dell'app (forum, eventi, lavori, research usano tutti lo stesso stack).

**Buona notizia trovata nel codice**: `react-leaflet@4` è già installato e in uso in `src/pages/Mappa.jsx` (marker, poligoni, layer control, fix icone Vite già risolto). La ricerca geolocalizzata richiesta dall'AF (Sez. 6.1) riusa questa libreria — zero dipendenze nuove per la mappa.

**Significato delle sigle di evidenza C/D/I/L: non definito da nessuna parte.** Né l'AF né il codebase (GN370 non è in questo repo) specificano cosa significhino le 4 lettere. Questo AT predispone lo schema con 4 valori enum ma **non implementa alcuna logica di business legata al loro significato** (es. quali sigle bloccano la pubblicazione, quali richiedono doppia validazione) — Daniel deve fornire le definizioni complete prima che questa logica venga scritta. Per il pilot, l'unica regola implementata è quella esplicita dell'AF: il campo è obbligatorio per pubblicare, qualunque sia il valore.

## 2. Schema Dati — PostgreSQL / SQLAlchemy

### 2.1 Tassonomia — `catalogo_categorie` / `catalogo_sottocategorie` (gestite da Admin)

```python
class CatalogoCategoria(Base):
    __tablename__ = "catalogo_categorie"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    codice          = Column(String(50), unique=True, nullable=False)   # es. "monumenti-cristiani"
    nome            = Column(String(100), nullable=False)
    metadata_schema = Column(JSONB)   # definizione campi metadata_specifici per questa categoria (Sez. 3)
    attivo          = Column(Boolean, nullable=False, default=True)
    created_at      = Column(DateTime(timezone=True), nullable=False, default=func.now())

    sottocategorie  = relationship("CatalogoSottocategoria", back_populates="categoria")


class CatalogoSottocategoria(Base):
    __tablename__ = "catalogo_sottocategorie"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("catalogo_categorie.id", ondelete="CASCADE"), nullable=False)
    codice       = Column(String(50), nullable=False)
    nome         = Column(String(100), nullable=False)
    ordine       = Column(Integer, nullable=False, default=0)

    categoria    = relationship("CatalogoCategoria", back_populates="sottocategorie")
```

Tassonomia come **dati configurabili**, non enum hardcoded nel codice: l'elenco "indicativo, non definitivo" delle sottocategorie Monumenti Cristiani (AF Sez. 5) si carica via seed/endpoint admin e si corregge senza deploy, in attesa della conferma finale di Daniel.

### 2.2 Schede — `catalogo_schede`

```python
class CatalogoScheda(Base):
    __tablename__ = "catalogo_schede"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    categoria_id          = Column(UUID(as_uuid=True), ForeignKey("catalogo_categorie.id"), nullable=False)
    sottocategoria_id     = Column(UUID(as_uuid=True), ForeignKey("catalogo_sottocategorie.id"))
    nome                  = Column(String(200), nullable=False)
    lat                   = Column(Numeric(9, 6), nullable=False)
    lng                   = Column(Numeric(9, 6), nullable=False)
    descrizione           = Column(Text)
    cronologia_storica    = Column(Text)
```
    evidenza_livello      = Column(String(1))            # 'C'|'D'|'I'|'L' — significato non definito, vedi Sez. 1
    evidenza_fonte        = Column(Text)                 # obbligatoria se archivio esterno (regola di business AF Sez.7)
    evidenza_data_verifica= Column(Date)
    metadata_specifici    = Column(JSONB)                # campi variabili per categoria, validati vs metadata_schema
    stato                 = Column(String(20), nullable=False, default="bozza")  # bozza|in_validazione|pubblicato|archiviato
    scheda_precedente_id  = Column(UUID(as_uuid=True), ForeignKey("catalogo_schede.id"))  # arricchimento collaborativo
    creato_da             = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    validato_da           = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    validato_at           = Column(DateTime(timezone=True))
    nota_validazione      = Column(Text)
    created_at            = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at            = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    categoria             = relationship("CatalogoCategoria")
    media                 = relationship("CatalogoMedia", back_populates="scheda")
```

**Deviazione intenzionale dal precedente `LavoriProgetto`**: quella tabella usa `lat`/`lng` come `String(20)` "per semplicità". Qui uso `Numeric(9,6)` perché la Sez. 6.1 dell'AF richiede ricerca geolocalizzata per area (bounding box, ordinamento per distanza) — impossibile con stringhe. Segnalato esplicitamente perché è una scelta diversa da un pattern già in produzione, non un'svista.

### 2.3 Allegati — `catalogo_media`

Riuso dell'infrastruttura Google Drive già esistente (`GoogleDriveService` in `media_service.py`), invece di introdurre un secondo storage per i file:

```python
class CatalogoMedia(Base):
    __tablename__ = "catalogo_media"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    scheda_id     = Column(UUID(as_uuid=True), ForeignKey("catalogo_schede.id", ondelete="CASCADE"), nullable=False)
    tipo          = Column(String(20), nullable=False)   # foto|documento
    drive_file_id = Column(String(200), nullable=False)
    nome_file     = Column(String(300))
    descrizione   = Column(Text)
    uploaded_by   = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at    = Column(DateTime(timezone=True), nullable=False, default=func.now())

    scheda        = relationship("CatalogoScheda", back_populates="media")
```

## 3. Validazione `metadata_specifici` (richiesta esplicita AF Sez. 10.5, "anche minima")

Ogni `CatalogoCategoria.metadata_schema` contiene una lista minima di campi attesi, non un JSON Schema completo:

```json
{
  "campi": [
    { "chiave": "dedicazione", "tipo": "testo", "obbligatorio": false },
    { "chiave": "stato_conservazione", "tipo": "scelta", "opzioni": ["buono","discreto","degradato"], "obbligatorio": true }
  ]
}
```

Validazione lato server (Python puro, non serve `jsonschema` come dipendenza nuova) prima di salvare o pubblicare: per ogni campo `obbligatorio: true` nello schema della categoria, verifica che la chiave esista in `metadata_specifici` e non sia vuota. Bocciata con `HTTPException(422, ...)` se manca. Nessuna validazione di tipo profonda per il pilot — coerente con "anche minima" richiesto dall'AF, estendibile in futuro senza cambi di schema (il JSON stesso può arricchirsi di regole).

## 4. Autorizzazione (dependency FastAPI, non "Security Rules" essendo Postgres)

| Azione | Guard | Corrisponde a (AF) |
|---|---|---|
| Lettura schede pubblicate | nessuno (endpoint pubblico) | Visitatore |
| Creazione bozza, proposta modifica | `require_socio` | Membro |
| Approvazione/respingimento per una categoria | `require_validatore_dominio(categoria_codice)` — nuova dependency factory che chiama `is_validatore_per_dominio` (AT-COMPETENZE-002 Sez. 5.1) | Validatore qualificato per dominio |
| Gestione tassonomie, pubblicazione forzata | `require_admin` | Amministratore |

```python
def require_validatore_dominio(categoria_codice: str):
    def _dep(current_user: CommunityUser = Depends(get_current_user)) -> CommunityUser:
        session = get_session()
        try:
            if not is_validatore_per_dominio(session, current_user, categoria_codice):
                raise HTTPException(status_code=403, detail="Richiesta qualifica Validatore per questo dominio")
            return current_user
        finally:
            session.close()
    return _dep
```

## 5. Endpoint (`community_module/api/catalogo.py`, montato su `/community/catalogo`)

| Metodo | Path | Guard | Note |
|---|---|---|---|
| GET | `/categorie` | pubblico | Tassonomia attiva |
| GET | `/schede` | pubblico | Query params: `categoria`, `stato=pubblicato` (default per non autenticati), `bbox` (lat/lng min/max per ricerca su mappa) |
| POST | `/schede` | `require_socio` | Crea bozza |
| GET | `/schede/{id}` | pubblico se `stato=pubblicato`, altrimenti solo creatore/validatore/admin | Dettaglio |
| PATCH | `/schede/{id}` | creatore (se `stato=bozza`) o `require_admin` | Modifica bozza propria |
| POST | `/schede/{id}/valida` | `require_validatore_dominio` sulla categoria della scheda | Approva (richiede `evidenza_livello` valorizzato) o respinge (richiede `nota_validazione`) |
| POST | `/schede/{id}/proponi-modifica` | `require_socio` | Crea nuova bozza con `scheda_precedente_id = id` (arricchimento collaborativo, AF Sez. 6.5) |
| POST | `/schede/{id}/media` | creatore o `require_socio` | Upload allegato via `GoogleDriveService` esistente, crea riga `catalogo_media` |
| POST | `/categorie` | `require_admin` | Gestione tassonomie |

## 6. Componenti React e Routing

**Rilievo sulla destinazione runtime**: l'AF indicava `el-fontanin.web.app/research`, ma `Research.jsx` è già una pagina viva (sondaggi/lavori/media, vedi `App.jsx`) — non è "vuota" come assunto. Questo AT propone una route dedicata `/catalogo` invece di sovrascrivere `/research`, per non rompere una feature esistente. Da confermare con Daniel se l'intento era davvero riusare quella route.

- `src/pages/Catalogo.jsx` — lista/ricerca, doppia vista lista+mappa (riuso diretto dei componenti `MapContainer`/`Marker`/`TileLayer` già importati in `Mappa.jsx`, stesso fix icone Vite)
- `src/components/catalogo/CatalogForm.jsx` — form generico: campi comuni (nome, categoria, sottocategoria, coordinate — reverse-geocoding non incluso nel pilot, inserimento manuale o da click su mappa —, descrizione, evidenza) + slot per campi specifici
- `src/components/catalogo/MonumentiCristianiFields.jsx` — variante campi specifici (dedicazione, stato conservazione), renderizzata da `CatalogForm` in base a `metadata_schema` della categoria
- `src/pages/CatalogoValidazione.jsx` — coda bozze filtrata per categoria, visibile solo se `GET /community/competenze/me/validatore/{categoria_codice}` risponde `true` oppure `ruolo === 'admin'`
- Route in `App.jsx`: `/catalogo` (pubblica), `/catalogo/nuovo` (`SocioRoute`), `/catalogo/validazione` (protetta, controllo qualifica lato componente)

## 7. Rischi e punti aperti che questo AT non risolve

| Punto | Chi decide | Nota |
|---|---|---|
| Postgres al posto di Firestore | Daniel (da riconfermare) | Vedi Sez. 1 e AT-COMPETENZE-002 Sez. 1 — stessa decisione, coerente tra i due sottosistemi |
| Significato sigle evidenza C/D/I/L | Daniel | Nessuna fonte nel repo o nell'AF le definisce (Sez. 1) — schema pronto, logica di business no |
| Destinazione runtime `/research` vs nuova route `/catalogo` | Daniel | `Research.jsx` non è vuota come assunto nell'AF (Sez. 6) |
| Tassonomia sottocategorie Monumenti Cristiani ancora indicativa | Daniel | Schema la tratta come dati configurabili, non blocca lo sviluppo (Sez. 2.1) |
| Accesso Archivio Diocesano "in attesa" | — | Nessun impatto tecnico: `evidenza_fonte` accetta liberamente questo valore come testo |
| Reverse-geocoding / inserimento coordinate | Daniel | Non incluso nel pilot: inserimento manuale o click su mappa (Sez. 6). Segnalare se serve import da GPS/foto EXIF |
| Timeline 3 settimane (AF Sez. 9) | Gemini/Antigravity | Non ereditata come commitment, solo riferimento — a loro la stima reale |

## 8. Handoff a Gemini/Antigravity — checklist

1. Leggere prima AT-COMPETENZE-002 e implementarlo: questo motore dipende dalla funzione `is_validatore_per_dominio`
2. Aggiungere `CatalogoCategoria`, `CatalogoSottocategoria`, `CatalogoScheda`, `CatalogoMedia` a `community_models.py` (Sez. 2)
3. Applicare le tabelle a Cloud SQL, stesso meccanismo usato per le tabelle di AT-COMPETENZE-002
4. Aggiungere schemas Pydantic (`CategoriaOut`, `SchedaCreate`, `SchedaOut`, `SchedaValida`, ecc.), stesso stile di `LavoriCreate`/`LavoriOut` in `schemas.py`
5. Creare `community_module/api/catalogo.py` con gli endpoint di Sez. 5, includendo la validazione minima di Sez. 3 prima di ogni save/pubblicazione
6. Montare il router in `community_main.py`
7. Creare i componenti React di Sez. 6, riusando `MapContainer` da `Mappa.jsx` e `SurveyForm`-style rendering per i campi dinamici
8. Aggiungere le route in `App.jsx` (Sez. 6) — **non toccare `/research`** finché Daniel non conferma l'intento originale
9. Seed iniziale: categoria `monumenti-cristiani` + le 4 sottocategorie indicative di AF Sez. 5, marcate come "da confermare" in UI finché Daniel non le valida
10. Test end-to-end del flusso completo: Membro propone bozza → nessun Validatore ancora qualificato → Admin (fallback) approva → scheda visibile a Visitatore per categoria e area (bbox) — questo è il Definition of Done di AF Sez. 8, va verificato esplicitamente prima di considerare il pilot concluso
