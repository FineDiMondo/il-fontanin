# AF-STRUTTURA-006 — Analisi Funzionale
## Riorganizzazione dell'Architettura Informativa secondo i 9 Regni (Yggdrasil) — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AF-STRUTTURA-006 |
| Fase | Analisi Funzionale (AF) |
| Autore | Claude (AF) |
| Prossimo step | Haiku/Cowork produce AT (Analisi Tecnica) su questa base |
| Peer review obbligatoria | Codex + Antigravity/Gemini, prima dello sviluppo (AGENTS.md R9) |
| Validazione AT | Claude, prima dell'handoff a sviluppo |
| Sviluppo e Test | Gemini/Antigravity |
| Destinazione runtime | `Home.jsx` (griglia 9 regni), `BottomNav.jsx`, viste filtrate su `Catalogo.jsx`/`Mappa.jsx`, `Events.jsx`/`EventDetail.jsx` |
| Decisione a monte | Struttura 3x3 confermata da Daniel; migrazione a step, non big-bang |

---

## 1. Scopo e Contesto

L'app ha oggi una navigazione piatta (Home con sezioni, BottomNav a icone, pagine indipendenti). Questa AF introduce un livello di organizzazione superiore — i **9 regni** — come chiave di lettura dei contenuti della community, ispirata alla cosmologia norrena (9 regni connessi da Yggdrasil), definita e validata con Daniel in sessione:

Vanaheim (natura e fertilità), Jötunheim (fatica e opere umane), Helheim (antenati e memoria), Niflheim (acque e sorgenti), Muspelheim (fuoco e tradizioni), Svartálfheim (mestieri e artigianato — include gli strumenti tecnici trasversali), Álfheim (bellezza e leggende), Asgard (sacro e devozione — include identità/regole trasversali), Midgard (vita di comunità).

Sopra i 9 regni esiste un decimo livello, **Yggdrasil**, trasversale e non appartenente a nessun regno: ospita la vista aggregata completa del catalogo (mappa + lista + livelli di evidenza su tutte le categorie insieme).

Questa non è una riscrittura del motore dati (il motore di catalogazione resta quello di AF-CATALOGAZIONE-001), ma una riorganizzazione della **navigazione e delle viste** sopra dati e funzionalità già esistenti o pianificate.

## 2. Perimetro Funzionale

**In scope:**
- Nuova Home a griglia 3x3 (9 regni) + accesso al livello Yggdrasil
- Mappatura e migrazione delle pagine esistenti dentro i 9 regni (vedi §5)
- Vista di catalogo filtrata per regno (lista + mappa + livello di evidenza aggregato sul dominio del regno)
- Vista di catalogo aggregata a livello Yggdrasil (tutte le categorie, nessun filtro)
- Relazione funzionale N:N tra Eventi/Attività e Schede di catalogo, con geolocalizzazione ereditata dalla scheda
- Migrazione a step (vedi §6bis), non sostituzione in blocco

**Out of scope (questa iterazione):**
- Riprogettazione del modello dati del motore di catalogazione (resta AF-CATALOGAZIONE-001, invariato)
- Nuove funzionalità di contenuto per i regni oggi vuoti (Svartálfheim, Asgard) oltre a quanto già assegnato in §5
- Gamification, notifiche push, export pubblico

## 3. Attori e Ruoli

Riuso as-is dell'RBAC esistente (Visitatore, Membro, Validatore, Amministratore — AF-CATALOGAZIONE-001 §3) per la navigazione a 9 regni e per il catalogo. Questa parte non introduce nuovi ruoli.

**Eccezione dichiarata (cambio RBAC esplicito) — Eventi**: oggi `POST /events` richiede `require_admin` (solo Admin crea eventi). Questa AF introduce un flusso Membro-propone/Admin-valida analogo a quello già in uso per il catalogo (vedi §6, §7): il Membro propone un evento in stato "bozza", l'Admin lo valida e pubblica. Non è un errore di scrittura ma una modifica di permessi deliberata, segnalata qui esplicitamente come richiesto dal processo di peer review (R9).

## 4. Modello Funzionale dei Livelli

- **Regno ≠ categoria di catalogo (chiarimento vincolante).** Il catalogo ha oggi 7 categorie tecniche (`idrico`, `naturale`, `storico`, `culturale`, `economico`, `militare`, `monumenti-cristiani`). Il "regno" NON sostituisce `categoria_id` e NON è un nuovo campo sulla scheda. È una **mappa funzionale** `regno_codice -> catalogo_categorie.codice[]`: una vista concettuale sopra le categorie esistenti (es. Niflheim → `idrico`; Vanaheim → `naturale` + nuove sotto-categorie flora/fauna/minerali, da creare come estensione delle categorie esistenti, non come nuovo attributo scheda). L'AT deve produrre questa tabella di mapping come artefatto esplicito.
- **Livello Regno**: vista filtrata (tramite la mappa regno→categorie sopra) su una o più categorie di catalogo. Mostra lista + mappa + livello di evidenza aggregato solo sulle schede di quel/quei dominio/i. Enfasi grafica coerente con l'identità visiva del regno (vedi mockup Home già condiviso).
- **Livello Yggdrasil**: vista aggregata, non filtrata. Mostra lista + mappa + livello di evidenza su tutto il catalogo, indipendentemente dal regno di appartenenza. Raggiungibile dalla Home, non annidato dentro Midgard né dentro alcun altro regno.
- **Eventi/Attività**: un Evento referenzia **da 1 a N** schede di catalogo (collegamento obbligatorio, non opzionale — decisione confermata da Daniel); una scheda di catalogo può essere sede di N eventi nel tempo. L'evento non ha coordinate proprie: eredita la geolocalizzazione dalla/dalle schede collegate. Gli eventi esistenti privi di collegamento (oggi basati su campi testuali `luogo`/`luogo_online`) richiedono una migrazione/adeguamento in AT: o mappatura best-effort verso una scheda esistente, o creazione di una scheda minima di catalogo a partire dal testo, da definire in AT.
- **Visualizzazione multi-scheda in mappa**: un evento collegato a più schede mostra **marker multipli**, uno per ciascuna scheda collegata, tutti etichettati con lo stesso evento. Nessuna gerarchia primaria/secondaria in questa iterazione (decisione confermata da Daniel, su segnalazione di Antigravity/Gemini e Codex in peer review).
- Se un evento referenzia più schede in regni diversi, compare in tutte le viste-regno pertinenti oltre che a livello Yggdrasil.

## 5. Mappatura dei 9 Regni sulle Pagine Esistenti (stato attuale → target)

| Regno | Pagine/componenti esistenti | Note migrazione |
|---|---|---|
| Vanaheim — Natura e fertilità | Geologia | Flora/fauna/piantumazioni: nuove categorie/sotto-categorie del motore di catalogazione esistente, non nuove pagine React — ma NON a impatto zero: richiedono seed dati, definizione `metadata_schema` per dominio e qualifica dei Validatori per i nuovi domini (AF-COMPETENZE-002) |
| Jötunheim — Fatica e opere umane | LavoriProgetto, CompetenzeSection | Nessuna migrazione strutturale, solo re-indirizzamento nel nuovo menu |
| Helheim — Antenati e memoria | Storia, Research | Nessuna migrazione strutturale |
| Niflheim — Acque e sorgenti | AnalisiAcqua | + nuova funzionalità mappatura punti d'acqua (AF-ACQUA-005, già in corso) |
| Muspelheim — Fuoco e tradizioni | Ricettario, Bar | Nessuna migrazione strutturale |
| Svartálfheim — Mestieri e artigianato | Media, Catalogo/CatalogoDettaglio/CatalogoNuovo/CatalogoValidazione, AppHeader, BottomNav, LanguageSelector, Toast, WalletCard | Questi restano componenti trasversali tecnicamente: NON diventano route o contenuti navigabili propri. "Abitano" Svartálfheim solo come classificazione concettuale nella mappa dei contenuti, senza alcun impatto sul routing React |
| Álfheim — Bellezza e leggende | Canzoniere, pagina Mappa attuale | Distinguere: la **pagina Mappa** (`Mappa.jsx`) resta contenuto di Álfheim; il **componente/vista mappa riusabile** (usato dalle viste-regno e da Yggdrasil per il catalogo) è un elemento tecnico condiviso, non "abita" Álfheim — stessa logica di Svartálfheim per gli altri componenti trasversali |
| Asgard — Sacro e devozione | StemmaComune, Login, Profilo, Guida | Nessuna migrazione strutturale |
| Midgard — Vita di comunità | Home (ridisegnata come hub 9 regni), Forum/ForumCategory/ForumThread, Chat/ChatRoom, Events/EventDetail, Dona, NumeriUtili | Home cambia ruolo: da elenco sezioni a griglia dei 9 regni + accesso a Yggdrasil |
| Yggdrasil (trasversale) | — (nuovo) | Vista aggregata catalogo; nessuna pagina preesistente da migrare |

*Tabella indicativa: da confermare con Daniel prima che l'AT la congeli in struttura di routing definitiva — stesso principio già applicato nelle AF precedenti.*

## 6. Flussi Funzionali Principali

1. **Ingresso**: utente apre Home → vede griglia 9 regni + punto di accesso a Yggdrasil
2. **Navigazione per regno**: utente entra in un regno → vede le pagine/funzionalità di quel regno + eventuale vista catalogo filtrata (lista/mappa/livello)
3. **Navigazione Yggdrasil**: utente accede alla vista aggregata → catalogo completo, tutte le categorie, ricerca trasversale
4. **Evento georeferenziato**: Membro propone un evento in stato "bozza" e lo collega obbligatoriamente (1..N) a schede di catalogo esistenti (in uno o più regni) → Admin valida e pubblica → l'evento eredita le coordinate dalle schede collegate, compare come marker multiplo nella/e vista/e regno pertinente/i e a livello Yggdrasil

## 6bis. Strategia di Migrazione a Step (non big-bang)

1. **Step 1**: nuova Home a griglia 9 regni, come livello di navigazione aggiuntivo sopra le pagine esistenti (nessuna pagina spostata, solo nuovi punti di ingresso)
2. **Step 2**: vista catalogo filtrata per regno (lista+mappa+livello), riusando il motore esistente con parametro di filtro categoria
3. **Step 3**: livello Yggdrasil (vista aggregata, nessun filtro)
4. **Step 4**: relazione N:N Eventi↔Schede di catalogo
5. **Step 5**: migrazione effettiva delle route/menu esistenti dentro la nuova struttura, con redirect dalle vecchie URL (nessuna rottura di link esistenti)

Ogni step è un incremento indipendentemente rilasciabile e testabile; nessuno step successivo parte senza che il precedente sia passato dalla peer review funzionale (AGENTS.md R9).

## 7. Regole di Business

- Il motore di catalogazione resta unico: nessuna duplicazione di schema per regno; il regno è una mappa `regno_codice -> catalogo_categorie.codice[]`, non un nuovo campo scheda
- Una scheda di catalogo appartiene a una sola categoria di catalogo alla volta (quindi a un solo regno tramite la mappa), ma può essere referenziata da eventi in contesti diversi
- La vista Yggdrasil non introduce permessi diversi: eredita l'RBAC del motore di catalogazione, mostra solo ciò che l'utente potrebbe già vedere sommando le viste-regno
- Nessuna migrazione di route esistenti (Step 5) senza redirect verificato
- **Eventi (cambio RBAC dichiarato)**: un Membro può proporre un evento in stato "bozza"; solo un Admin può validarlo e pubblicarlo. Ogni evento deve collegarsi ad almeno una scheda di catalogo (1..N obbligatorio): non sono ammessi eventi pubblicati privi di localizzazione tramite scheda

## 8. Criteri di Accettazione (Definition of Done — livello funzionale)

- [ ] La Home mostra la griglia dei 9 regni + un punto di accesso distinto al livello Yggdrasil
- [ ] Ogni regno con contenuto di catalogo mostra una vista lista+mappa+livello filtrata sulla propria categoria
- [ ] Il livello Yggdrasil mostra lista+mappa+livello su tutte le categorie senza filtro
- [ ] Un evento collegato a schede di regni diversi compare correttamente (marker multipli) in tutte le viste-regno pertinenti e a livello Yggdrasil
- [ ] Un Membro può proporre un evento in bozza; solo un Admin può validarlo e pubblicarlo; nessun evento è pubblicabile senza almeno una scheda di catalogo collegata
- [ ] La mappa `regno_codice -> catalogo_categorie.codice[]` è documentata come artefatto esplicito, senza introdurre un nuovo campo "regno" sulla scheda
- [ ] Nessuna route esistente restituisce 404 dopo lo Step 5 (redirect verificati)
- [ ] Ogni step ha ricevuto peer review funzionale da Codex e Antigravity/Gemini prima del passaggio allo step successivo

## 9. Dipendenze e Rischi Noti (da riportare in AT, non da risolvere qui)

| Rischio | Impatto | Note |
|---|---|---|
| Doppia appartenenza scheda/regno vs relazione evento N:N | Medio | L'AT deve modellare chiaramente che il regno è una proprietà della scheda (1) mentre il collegamento a eventi è una relazione separata (N:N) — non confondere i due concetti |
| Svartálfheim e Asgard come "contenitori concettuali" di componenti tecnici/trasversali | Basso | Non richiede alcuna modifica di codice: è una classificazione nella mappa dei contenuti, non nel routing tecnico |
| Migrazione Step 5 (redirect vecchie route) | Medio | Rischio di rottura link condivisi/bookmark; l'AT deve prevedere redirect 301 lato client o server per ogni route spostata |
| Vanaheim privo di pagine dedicate per flora/fauna/piantumazioni | Basso | Non blocca questa AF: le nuove categorie si aggiungono al motore di catalogazione esistente, non richiedono nuove pagine React |

## 10. Handoff ad AT (Haiku/Cowork) — cosa deve produrre

1. Struttura di routing per Home (griglia 9 regni) e per il livello Yggdrasil
2. Meccanismo di filtro categoria sulla vista catalogo esistente (riuso, non duplicazione del motore)
3. Schema della relazione N:N Eventi↔Schede di catalogo (tabella di join o equivalente); includere come un evento multi-scheda si traduce sulla Mappa (pin multipli vs location primaria/secondaria) — punto sollevato in peer review da Antigravity/Gemini
4. Piano di redirect per le route esistenti (Step 5), con elenco vecchia-route → nuova-route
5. Segnalazione esplicita di ogni punto aperto della sezione 9 che l'AT non può risolvere autonomamente

**Vincolo di processo**: l'AT prodotta da Haiku torna a Claude per validazione, POI passa in peer review funzionale a Codex e Antigravity/Gemini (AGENTS.md R9) prima di procedere a sviluppo e test. In caso di dissenso tra i due reviewer, la sessione si ferma e segnala a Daniel.

---

## Log Peer Review Funzionale (R9)

| Data | Reviewer | Esito | Note |
|---|---|---|---|
| 2026-07-13 | Antigravity/Gemini | APPROVATO | Nessuna riserva bloccante. Raccomandazione per l'AT: esplicitare come un Evento collegato a più Schede geograficamente distanti si traduce sulla Mappa — risolto (vedi §4, marker multipli). |
| 2026-07-13 | Codex | APPROVATO CON RISERVE → RISOLTE | 4 riserve bloccanti (regno≠categoria, RBAC eventi, cardinalità link, vista mappa multi) + 3 minori (Mappa pagina/componente, Svartálfheim/Asgard non navigabili, impatto seed Vanaheim). Tutte risolte con decisioni confermate da Daniel e incorporate nel documento (§3, §4, §5, §7, §8). |

**Stato R9**: COMPLETA. Entrambi i reviewer hanno approvato (Codex con riserve, tutte risolte e incorporate nel testo). Il documento può procedere all'AT.
