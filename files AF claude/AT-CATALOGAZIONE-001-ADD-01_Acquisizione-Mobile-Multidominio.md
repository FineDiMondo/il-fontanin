# AT-CATALOGAZIONE-001-ADD-01 — Analisi Tecnica (Addendum)
## Acquisizione Mobile Multidominio — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AT-CATALOGAZIONE-001-ADD-01 |
| Fase | Analisi Tecnica (Addendum) |
| Base | AF-CATALOGAZIONE-001-ADD-01 |
| Autore | Gemini/Antigravity |
| Validazione | Claude (prima dell'handoff a sviluppo) |
| Sviluppo e Test | Gemini/Antigravity |
| Stack target | PostgreSQL + FastAPI (`community_module`) + React (PWA) |

---

## 1. Rilievi Tecnici Preliminari

In ottemperanza alla regola metodologica, prima di redigere questa AT è stato analizzato il codice reale del repository:
- **`GoogleDriveService` (`community_module/services/google_drive_service.py`)**: Il servizio attuale utilizza `MediaIoBaseUpload(..., resumable=True)`. Supporta nativamente l'upload chunked di qualsiasi `mime_type` (incluso video) su Google Drive. L'infrastruttura per i video è quindi già idonea senza introdurre nuovi bucket o librerie.
- **Mappa (`src/pages/Mappa.jsx`)**: Il progetto utilizza `react-leaflet` e contiene già import validi per aggirare i noti problemi di Vite con le icone Leaflet (`markerIcon`, `markerIcon2x`, ecc.). Per l'input manuale richiesto dal fallback, sarà sufficiente importare `MapContainer` e `Marker` impostando la property `draggable={true}`.
- **`community_models.py`**: Il file definisce le tabelle per Forum, Chat, Eventi e Lavori in PostgreSQL via SQLAlchemy. Le tabelle per il catalogo (in quanto progettate in AT-CATALOGAZIONE-001) seguiranno lo stesso pattern dichiarativo di `Base`.

## 2. Modifiche allo Schema Dati e Seed

Lo schema progettato in `AT-CATALOGAZIONE-001` rimane intatto e viene unicamente esteso per coprire le nuove categorie e i media video.

### 2.1 Estensione Media (Video)
Nella tabella `catalogo_media` (o equivalente definizione SQL), il campo `tipo` che precedentemente assumeva `foto|documento` dovrà accettare anche `video`. Nessuna modifica di colonna è necessaria se viene gestito come `String(20)`.

### 2.2 Seed Iniziale Multidominio
Il database dovrà essere inizializzato (via script one-off o endpoint di admin) con il seguente seed per la tabella `catalogo_categorie`. Per il momento (pilot), le `metadata_schema` specifiche non previste saranno configurate con JSON vuoti (o generici), rimandando a Daniel la definizione specifica in corso d'opera.

```python
SEED_CATEGORIE = [
    {"codice": "monumenti-cristiani", "nome": "Monumenti Cristiani", "schema": {"campi": []}}, # Già previsto
    {"codice": "idrico", "nome": "Idrico", "schema": {"campi": []}},
    {"codice": "naturale", "nome": "Naturale", "schema": {"campi": []}},
    {"codice": "storico", "nome": "Storico", "schema": {"campi": []}},
    {"codice": "culturale", "nome": "Culturale", "schema": {"campi": []}},
    {"codice": "economico", "nome": "Economico", "schema": {"campi": []}},
    {"codice": "militare", "nome": "Militare", "schema": {"campi": []}},
]
```

### 2.3 Modifiche Schema catalogo_media
Aggiungere due campi alla tabella `catalogo_media`:
- `modalita_acquisizione`: String(20), nullable=False, default="upload_server"
  Valori ammessi: `upload_server` | `link_drive_personale` | `link_esterno`
- `url_esterno`: Text, nullable — valorizzato solo se `modalita_acquisizione` è `link_drive_personale` (l'URL/ID Drive) o `link_esterno` (l'URL pubblico, es. YouTube o altra piattaforma).
Il campo `drive_file_id` già previsto resta usato solo per `upload_server` e `link_drive_personale`.


## 3. Backend: Endpoint e Logiche di Validazione

### 3.1 Obbligatorietà Geolocalizzazione
Secondo AF Sez. 5, la geolocalizzazione è obbligatoria anche in bozza.
In `community_module/api/catalogo.py` (o dove risiederà lo schema), Pydantic dovrà far valere questo vincolo in modo assoluto.

```python
from pydantic import BaseModel, Field
from decimal import Decimal

class SchedaCreate(BaseModel):
    # altri campi...
    lat: Decimal = Field(..., ge=-90, le=90, description="Obbligatorio anche per le bozze")
    lng: Decimal = Field(..., ge=-180, le=180, description="Obbligatorio anche per le bozze")
```
Un payload privo di questi campi verrà respinto dal server con `HTTPException 422`, impedendo di creare entry "orfane" di posizione.

### 3.2 Percorsi di Acquisizione Media e Limiti
Si prevedono tre distinti percorsi di acquisizione dei media per superare i limiti di trasferimento di Cloud Run (32MB max per richiesta):
1. **upload_server**: Il file viene inviato direttamente al backend tramite form-data (stesso schema di `POST /schede/{id}/media`). È applicato un limite massimo di **28 MB** (con un margine di sicurezza sotto il tetto di Cloud Run di 32 MB), adatto per foto e brevi video.
2. **link_drive_personale**: L'utente carica preventivamente il file sul proprio Google Drive personale (es. dall'app mobile Drive) e incolla il `drive_file_id`. Non viene imposto alcun limite di dimensione dal nostro backend, replicando il pattern di `POST /media/link-personal`.
3. **link_esterno**: L'utente fornisce un URL pubblico (es. YouTube, Amazon Photos, iCloud condiviso). Il backend effettua solo una validazione sintattica dell'URL (deve iniziare con http/https) senza verificare la raggiungibilità remota del contenuto per il pilot.

---

## 4. Frontend: Acquisizione Mobile e Interfaccia

### 4.1 Input Nativo Mobile-First
Per garantire la possibilità di scattare foto/video "sul campo" sfruttando le app native dello smartphone (senza scrivere interfacce webcam in JS):

```jsx
{/* Scatto diretto foto (fallback a galleria su OS dove capture non supportato) */}
<input type="file" accept="image/*" capture="environment" onChange={handleMediaUpload} />

{/* Registrazione diretta video */}
<input type="file" accept="video/*" capture="environment" onChange={handleMediaUpload} />
```

### 4.2 Geolocalizzazione e Mappa per il Fallback
Il form innesca automaticamente l'API `navigator.geolocation` all'avvio.

```javascript
navigator.geolocation.getCurrentPosition(
  (pos) => setPosizione([pos.coords.latitude, pos.coords.longitude]),
  (err) => {
    alert("Permesso GPS negato o non disponibile. Seleziona manualmente il punto sulla mappa.");
    setPosizione(FONTANIN_DEFAULT);
  },
  { enableHighAccuracy: true, timeout: 10000 }
);
```

### 4.3 Requisiti di Layout Responsive (`CatalogForm.jsx`)
- **Nessun layout multicolonna**: gli input andranno incolonnati (width: 100%).
- **Touch-friendly**: ogni bottone dovrà avere una dimensione minima (es. `min-h-[44px]` in Tailwind).
- **Mappa Drag**: La mappa dovrà avere CSS `touch-action: none` e occupare una porzione ben definita della UI (es. `h-[300px]`), o essere aperta come "modale a tutto schermo".
- **Feedback visuale**: Inserire uno spinner e bloccare (disable) il tasto di "Salva" durante l'upload dei video.

### 4.4 Gestione Allegati in CatalogForm.jsx
Il componente per la gestione degli allegati nel form offrirà un selettore (radio/tab) a tre opzioni:
1. **"Scatta/Carica"**: Input file standard con attributo `capture="environment"`. Viene applicato un controllo client-side sul peso del file: se supera i **28 MB**, l'upload viene bloccato immediatamente mostrando un messaggio d'errore all'utente.
2. **"Collega dal mio Drive"**: Input di testo in cui l'utente inserisce manualmente il `drive_file_id` (nessun Picker nel pilot).
3. **"Link esterno (YouTube o altro)"**: Campo di testo per incollare l'URL pubblico (http/https).

### 4.5 Visualizzazione Media nel Dettaglio Scheda
- Se l'URL corrisponde a un video di YouTube, il video viene visualizzato incorporato tramite un `iframe` puntato all'URL di embed, senza richiedere l'uso delle YouTube Data API.
- Per qualsiasi altro `link_esterno`, viene mostrato un link cliccabile semplice accompagnato da un'icona "apri esterno".

---

## 5. Nuovo Endpoint Backend

Viene introdotto un nuovo endpoint per registrare i riferimenti dei media collegati senza trasferimento di byte dal client al server per i flussi di tipo drive e link esterni:

### `POST /schede/{id}/media/link`
- **Payload richiesto**:
  ```json
  {
    "modalita_acquisizione": "upload_server | link_drive_personale | link_esterno",
    "url_esterno": "string (nullable)",
    "drive_file_id": "string (nullable)",
    "nome_file": "string",
    "tipo": "foto | video | documento"
  }
  ```
- **Logica**: Per le modalità `link_drive_personale` e `link_esterno` l'endpoint salva unicamente i metadati e l'indirizzo nel DB, senza elaborare alcun file in upload sul server.

---

## 6. Rischi e Limitazioni

- **Nessuna verifica di accessibilità remota**: Per i link esterni e i collegamenti a Drive personali, il server non esegue verifiche preventive.
- **Rottura/Rimozione del link originale**: Se un video YouTube viene eliminato o una foto su Drive viene rimossa, la scheda presenterà un allegato non funzionante. Nessun health-check automatico previsto per il pilot.
- **Wording lat/lng**: Lat e lng devono essere presentati all'utente in formato decimale leggibile.
- **Regola video/foto minima**: La possibilità di inserire un video non sostituisce il requisito minimo obbligatorio di caricare almeno una foto e una descrizione della scheda.

---

## 7. Handoff a Gemini/Antigravity — Checklist

1. [ ] Aggiungere i campi `modalita_acquisizione` e `url_esterno` alla tabella/modello `catalogo_media`.
2. [ ] Implementare l'endpoint `POST /schede/{id}/media/link` gestendo la memorizzazione separata dei link e dei file id.
3. [ ] Inserire i controlli sul backend (Max 28MB) e client-side (Max 28MB con avviso bloccante) per la modalità `upload_server`.
4. [ ] Rimuovere l'attributo `Optional` dai campi `lat` e `lng` nello schema `SchedaCreate` (Pydantic).
5. [ ] Progettare `CatalogForm.jsx` con selettore a tre opzioni (radio/tab) per i percorsi di acquisizione allegati.
6. [ ] Configurare `navigator.geolocation` con fallback visibile (es. `alert` o toast nativo).
7. [ ] Integrare in `CatalogForm.jsx` il componente `react-leaflet` con marker impostato a `draggable={true}`.
8. [ ] Implementare nel dettaglio scheda il rendering con `iframe` per i link YouTube e con icona "apri esterno" per gli altri URL esterni.
9. [ ] Iniettare le 7 categorie nel DB.
