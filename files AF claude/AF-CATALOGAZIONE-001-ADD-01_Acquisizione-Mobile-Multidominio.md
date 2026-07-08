# AF-CATALOGAZIONE-001-ADD-01 — Analisi Funzionale (Addendum)
## Acquisizione Mobile Multidominio — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AF-CATALOGAZIONE-001-ADD-01 |
| Fase | Analisi Funzionale (Addendum) |
| Autore | Claude (AF) |
| Documento base | AF-CATALOGAZIONE-001 (aggiorna Sez. 2, 4, 5, 6) |
| Decisioni Daniel (2026-07-07) | Tassonomia allargata subito; acquisizione via browser/PWA da smartphone; nessuna modalità offline nel pilot |
| Prossimo step | Haiku/Cowork produce AT (o Claude su richiesta esplicita) |
| Validazione AT | Claude |
| Sviluppo e Test | Gemini/Antigravity |

---

## 1. Scopo dell'Addendum

Introdurre in AF-CATALOGAZIONE-001 due requisiti emersi dopo la validazione dell'AT: (a) acquisizione dati **da smartphone sul campo** — foto, video, geolocalizzazione — come modalità di input primaria, non solo secondaria rispetto all'inserimento da desktop; (b) **allargamento immediato della tassonomia** oltre i Monumenti Cristiani, a qualunque elemento georeferenziato di natura idrica, naturale, storica, culturale, economica o militare.

## 2. Decisioni Daniel (2026-07-07)

| Decisione | Valore | Impatto |
|---|---|---|
| Ambito tassonomia | Allargamento immediato, non differito | Sez. 3 |
| Piattaforma acquisizione mobile | Browser da smartphone (PWA/responsive), non app nativa | Sez. 4 |
| Modalità offline | Non richiesta per il pilot — si presume connessione disponibile | Sez. 5 |

## 3. Tassonomia Estesa (sostituisce AF-CATALOGAZIONE-001 Sez. 2 e 5)

Il motore resta generico per dominio (architettura invariata — vedi AT-CATALOGAZIONE-001 Sez. 2.1: categorie come dati configurabili in `catalogo_categorie`, non enum hardcoded). Cambia l'ampiezza del seed iniziale: da 1 categoria (Monumenti Cristiani) a un set aperto.

**Categorie attive dal giorno 1** (elenco iniziale, estensibile senza deploy da parte di Amministratore — nessuna di queste è una modifica di schema):

| Categoria | Codice | Esempi |
|---|---|---|
| Monumenti Cristiani | `monumenti-cristiani` | Chiese, edicole votive, capitelli (già in AF-CATALOGAZIONE-001 Sez. 5) |
| Idrico | `idrico` | Sorgenti, fontane, canali, pozzi, punti d'acqua (sostituisce lo stub `AnalisiAcqua.jsx`) |
| Naturale | `naturale` | Alberi monumentali, formazioni geologiche, aree di interesse naturalistico |
| Storico | `storico` | Rovine, monumenti del Regno d'Italia (già previsto in AF-CATALOGAZIONE-001 Sez. 1) |
| Culturale | `culturale` | Tradizione locale non religiosa né strettamente storica (luoghi di memoria, toponimi) |
| Economico | `economico` | Mulini, fornaci, attività produttive storiche o dismesse |
| Militare | `militare` | Trincee, postazioni, fortificazioni, cippi commemorativi (separato da Storico per filtro dedicato sulla mappa) |

**Nota di governance (invariata da AF-COMPETENZE-002 Sez. 7)**: solo Amministratore crea nuove categorie — questo elenco è il seed iniziale, non un tetto.

**Punto aperto per AT**: ciascuna categoria richiede il proprio `metadata_schema` (campi specifici, come già previsto per Monumenti Cristiani in AT-CATALOGAZIONE-001 Sez. 3). Questo AF non definisce i campi specifici delle nuove 6 categorie — indicativo, da affinare con Daniel prima della pubblicazione reale (stesso trattamento già riservato alla tassonomia Monumenti Cristiani).

## 4. Acquisizione da Smartphone (nuovo flusso funzionale)

### 4.1 Principio
Il Membro sul campo usa il proprio smartphone (browser, nessuna app da installare) per censire un elemento nel momento e nel luogo in cui lo osserva, senza dover trascrivere dati a casa da appunti.

### 4.2 Cosa cambia rispetto al flusso desktop già previsto (AF-CATALOGAZIONE-001 Sez. 6)

- **Geolocalizzazione**: rilevata automaticamente dal GPS del dispositivo al momento dell'apertura del form (non più solo inserimento manuale o click su mappa, come invece AT-CATALOGAZIONE-001 Sez. 6/7 aveva escluso dal pilot). L'utente vede la posizione rilevata e può correggerla trascinando un marker, per i casi di GPS impreciso o rilevazione a distanza dall'oggetto.
- **Foto**: scatto diretto dalla fotocamera del dispositivo (non solo upload da galleria) — restano comunque ammessi allegati da galleria per foto pregresse.
- **Video**: nuovo tipo di allegato, non presente in AT-CATALOGAZIONE-001 Sez. 2.3 (`catalogo_media.tipo` aveva solo `foto|documento`). Va aggiunto `video`.
- **Compilazione minima sul campo**: nome, categoria, e i campi obbligatori del `metadata_schema` della categoria — descrizione estesa e arricchimento possono avvenire in un secondo momento da desktop (coerente con l'arricchimento collaborativo già previsto in AF-CATALOGAZIONE-001 Sez. 6.5).

### 4.3 Vincolo esplicito da Daniel (2026-07-07)

Nessuna modalità offline per il pilot: se il dispositivo non ha connessione al momento del censimento, l'utente riprova quando la connessione torna disponibile. Foto/video/coordinate restano nel form fino all'invio riuscito (comportamento standard di un form web, nessuna persistenza locale aggiuntiva da progettare).

## 5. Regole di Business Aggiuntive

- Il campo geolocalizzazione è obbligatorio anche per il salvataggio in bozza (diversamente dal livello di evidenza, che resta obbligatorio solo alla pubblicazione — AF-CATALOGAZIONE-001 Sez. 7) — senza posizione l'elemento non ha senso su una mappa
- Un video allegato non sostituisce l'obbligo di almeno una foto o descrizione testuale minima
- Le nuove categorie ereditano lo stesso workflow di validazione già definito (bozza → in validazione → pubblicato) e la stessa qualifica per dominio di AF-COMPETENZE-002 — un Validatore lo è solo per i domini in cui ha `livello_validato`, incluse le nuove categorie

## 6. Criteri di Accettazione (aggiuntivi a AF-CATALOGAZIONE-001 Sez. 8)

- [ ] Da uno smartphone (browser, non app), un Membro può aprire il form, scattare una foto, vedere la propria posizione GPS precompilata, correggerla se necessario, e inviare una bozza in meno di 2 minuti
- [ ] Un video può essere allegato a una scheda, con lo stesso meccanismo di upload già usato per foto/documenti (`GoogleDriveService`)
- [ ] Le categorie Idrico, Naturale, Storico, Culturale, Economico, Militare sono selezionabili al momento della creazione di una scheda, ciascuna con propri campi specifici (anche minimi, per il pilot)
- [ ] La mappa (`Mappa.jsx`/nuova vista Catalogo) filtra gli elementi per categoria

## 7. Rischi e Dipendenze Note (da riportare in AT)

| Rischio | Impatto | Note |
|---|---|---|
| Dimensione/durata massima video | Medio | Upload video da rete mobile può essere lento o fallire su file grandi — AT deve proporre un limite (es. 60s / dimensione max) per il pilot |
| Precisione GPS su dispositivi/browser diversi | Medio | Alcuni browser mobile richiedono permesso esplicito e possono avere precisione variabile (10-50m) — la correzione manuale (Sez. 4.2) è la mitigazione, non un'eccezione rara |
| 6 nuove categorie senza `metadata_schema` definito | Medio | AT può predisporre schema vuoto/minimo per ciascuna, ma i campi specifici restano da Daniel prima della pubblicazione reale (Sez. 3) |
| UI mobile-first non ancora progettata | Medio | `CatalogForm.jsx` era pensato in AT-CATALOGAZIONE-001 Sez. 6 senza vincolo mobile esplicito — l'AT di questo addendum deve trattare il layout responsive come requisito, non rifinitura successiva |
| Permessi browser (fotocamera/GPS) negati dall'utente | Basso | AT deve prevedere un messaggio chiaro e un fallback a inserimento manuale, non un errore silente |

## 8. Handoff ad AT — cosa deve aggiungere/modificare rispetto a AT-CATALOGAZIONE-001

1. Aggiungere `video` ai valori ammessi di `catalogo_media.tipo` (Sez. 2.3 di AT-CATALOGAZIONE-001)
2. Specifica tecnica acquisizione mobile: `<input type="file" accept="image/*,video/*" capture="environment">` per scatto diretto (pattern standard mobile web, non richiede `getUserMedia`/UI fotocamera custom) + `navigator.geolocation.getCurrentPosition()` per il GPS, con marker trascinabile su `MapContainer` esistente per la correzione manuale
3. Seed iniziale esteso: le 6 nuove categorie (Sez. 3), ciascuna con `metadata_schema` minimo/vuoto marcato "da confermare" in UI, stesso trattamento già riservato a Monumenti Cristiani
4. Limite dimensione/durata video da definire (Sez. 7) — proporre un valore per il pilot, non lasciarlo illimitato
5. Vincolo di obbligatorietà geolocalizzazione anche in bozza (Sez. 5) — verificare lato server, non solo lato client
6. Layout `CatalogForm.jsx` responsive-first, non adattamento successivo

**Nota per Daniel**: questo addendum non tocca le decisioni già chiuse in AT-CATALOGAZIONE-001 (Postgres, endpoint, RBAC per dominio) — le estende. Il significato delle sigle C/D/I/L (AT-CATALOGAZIONE-001 Sez. 1, ancora aperto) vale anche per le nuove categorie, non solo per Monumenti Cristiani.
