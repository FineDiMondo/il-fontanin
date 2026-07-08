# DECISIONE ARCHITETTURALE: Motore di Catalogazione Territoriale Generico

## STATO ATTUALE VERIFICATO

| Tool | File | Status | Note |
|------|------|--------|------|
| Punti d'acqua | `src/pages/AnalisiAcqua.jsx` | Stub | Solo placeholder i18n, no codice funzionante |
| Monumenti storici | — | Non esiste | Zero codice, zero stub |
| Monumenti cristiani | — | Non esiste | Richiesto, non ancora avviato |

**Conclusione**: Tutti e tre i tool sono al livello "concettuale". **Non stiamo refactorizzando nulla di esistente.**

---

## RACCOMANDAZIONE: OPZIONE C (Ibrida)

Rifiuto sia Opzione A (motore generico subito) che Opzione B (tre moduli indipendenti).

### Proposta: **Motore Generico + Pilot su Monumenti Cristiani**

**Fase 1 — Design del motore** (2-3 giorni, parallelizzabile con Gemini su Media)
- Progetta schema Firestore generico (una sola tabella logica)
- Progetta RBAC uniforme
- Progetta frontend componente ricorsivo (forma tassonomia-agnostica)

**Fase 2 — Implementazione pilot** (1 settimana)
- Implementa motore **SOLO per tassonomia "Monumenti cristiani"**
- Valida su Sant'Andrea come nodo zero
- QA + deploy

**Fase 3 — Riuso su altre due tassonomie** (2-3 giorni per tassonomia)
- Applica stesso motore a "Punti d'acqua" (completa stub AnalisiAcqua)
- Applica stesso motore a "Monumenti storici"
- 80% del codice riusato, solo tassonomia + icone cambiano

**Timeline totale**: 3 settimane  
**Timeline alternativo (Opzione B, tre moduli indipendenti)**: 5-6 settimane (manutenzione triplice)

---

## VANTAGGI DELLA OPZIONE C

### ✅ Rigoroso (Coerente con Approach Sistemico)
- Un solo schema Firestore
- Un solo set di regole di sicurezza
- Un solo componente di validazione
- Un solo pattern di RBAC

### ✅ Pragmatico (Ship Early)
- Monumenti cristiani live in 1 settimana
- Non aspetti che tutto sia perfetto
- Iterazioni feedback dagli utenti
- Design può evolvere sulla base di esperienza reale

### ✅ Economico
- 20% costo vs tre moduli separati
- Manutenzione centralizzata
- Evita divergenza schema nel tempo

### ✅ Estensibile
- Quando arriva il quarto tipo di catalogazione (es. tracciati storici, biodiversità), aggiungi solo una tassonomia

---

## SCHEMA GENERICO PROPOSTO (Reusabile)

### Firestore Collection: `/communities/{cid}/catalog/{categoria_tipo}/{entity_id}`

```javascript
{
  // Identità
  id: string,
  categoria: 'cristiano' | 'acqua' | 'storico',
  sottocategoria: string, // 'chiesa', 'sorgente', 'castello', etc
  tassonomia_id: string,  // ref a config tassonomia

  // Localizzazione
  nome: string,
  coordinate: { lat: number, lon: number },
  area_geografica: string, // area Fontanin, valle, etc

  // Evidenza (riuso pattern GN370)
  livello: 'C' | 'D' | 'I' | 'L',  // Certezza
  fonte: string, // 'archivio diocesano', 'documento storico', etc
  data_verifica: timestamp,
  note: string,

  // Campi specifici per sottocategoria (JSON flessibile)
  metadata_specifici: {
    // Per chiese: nome_santo, data_fondazione, etc
    // Per sorgente: portata, qualita_acqua, etc
    // Per castello: periodo_costruzione, etc
  },

  // Media
  foto: [{ url, source, uploader_id, timestamp }],
  documenti: [{ url, tipo, source }],

  // Contributo RBAC
  creato_da: user_id,
  modificato_da: user_id,
  stato: 'bozza' | 'verificato' | 'pubblicato',
  cronologia: [{
    timestamp,
    utente_id,
    azione, // 'created', 'edited', 'verified'
    cosa_cambiato
  }],

  // Timestamp
  created_at: timestamp,
  updated_at: timestamp
}
```

### Firestore Rules (Generico)

```javascript
match /communities/{cid}/catalog/{categoria}/{entityId} {
  // Visitatore: legge solo 'pubblicato'
  allow read: if request.auth.uid != null && 
              resource.data.stato == 'pubblicato';
  
  // Membro: legge tutto nella sua community, crea bozze
  allow read, create: if request.auth.uid != null &&
                        userInCommunity(cid, request.auth.uid);
  
  // Validatore: verifica e pubblica
  allow update: if request.auth.uid != null &&
                   userRole(cid, request.auth.uid) in ['validatore', 'admin'] &&
                   request.resource.data.stato in ['verificato', 'pubblicato'];
  
  // Admin: modifica totale
  allow write: if request.auth.uid != null &&
                  userRole(cid, request.auth.uid) == 'admin';
}
```

### Frontend Component Generico: `CatalogForm.jsx`

```javascript
// Prende configurazione tassonomia dinamicamente
<CatalogForm
  tassonomia="cristiano"
  sottocategorie={['chiesa', 'edicola', 'croce', ...]}
  campiSpecifici={{
    chiesa: ['nome_santo', 'data_fondazione'],
    edicola: ['materiale', 'dedicazione'],
  }}
  onSave={handleSave}
/>

// Interno renderizza form generico con tassonomia-specific fields
// Stesso codice funziona per acqua, storico, etc
```

---

## TASSONOMIA: MONUMENTI CRISTIANI (Gate 3 Dettagliato)

### Categoria principale: `cristiano`

#### Sottocategorie proposte:

| Sottocategoria | Descrizione | Campi Specifici | Punto Partenza |
|---|---|---|---|
| **chiesa** | Edifici di culto, chiese, cappelle, oratori | nome_santo, anno_fondazione, periodo_architettonico, dedicazione, diocese | Sant'Andrea |
| **edicola_votiva** | Edicole, cappellette votive, nicchie affrescate | dedica, iconografia, stato_conservazione | Area Fontanin |
| **croce_confine** | Croci di confine, confraternali, crocifissi storici | materiale, data_collocazione, confraternita | Verificare archivio |
| **campanile** | Campanili, campane storiche | anno_fondazione, materiale_campane, campanilista | Collegato a chiese |
| **cimitero_storico** | Cimiteri, ossari, tombe monumentali | periodo, lapidi_notabili, sepolti_storici | Verificare fonti |
| **affresco_esterno** | Affreschi esterni, dipinti murali religiosi | periodo, autore, tema, stato_conservazione | Fotografare systematicamente |
| **abside_scomparsa** | Elementi architettonici di edifici demoliti | periodo_costruzione, chiesa_associata, documentazione | Mappare da archivi |

#### Punto di partenza: **Sant'Andrea**

Sant'Andrea come "nodo zero" della rete:
- Entità centrale con livello di evidenza massimo (L)
- Da lì espandere radialmente a:
  - Campi circostanti (chiese dipendenti)
  - Edicole devozionali storicamente collegate
  - Documenti nell'Archivio Diocesano (cross-reference)
  - Affreschi e ornamenti
  - Campanile e campane

---

## INTEGRAZIONE CON EVIDENZA GN370

**Opportunità**: Monumenti cristiani possono linkare a GN370 quando rilevante.

```javascript
// In metadata_specifici per chiese:
{
  nome_santo: 'Sant'Andrea Apostolo',
  gn370_link: 'GN370_ID_1234',  // Link a evidenza storica nel DB GN370
  archivio_diocesano_ref: 'BROL/100/003'
}
```

Questo crea una **rete semantica** tra:
- Catalogazione territoriale (Monumenti cristiani)
- Ricerca storica (GN370 livelli [C/D/I/L])
- Archivi diocesani (documentazione)

---

## PLAN DI AZIONE (Per Procedere)

### Settimana 1 — Design + Pilot (Monumenti Cristiani)

**Giorni 1-2: Backend Design**
- [ ] Firestore schema design (generico)
- [ ] Collection path standardizzazione
- [ ] RBAC rules (Firestore security)
- [ ] Indexes configuration

**Giorni 3-5: Frontend Pilot (Monumenti Cristiani)**
- [ ] CatalogForm.jsx (generico, tassonomia-configurable)
- [ ] CatalogCard.jsx (visualizzazione)
- [ ] CatalogGallery.jsx (lista/mappa)
- [ ] Tassonomia "cristiano" config
- [ ] Integration in `/research` o nuovo tab `/catalog?type=cristiano`

**Giorni 6-7: Deploy pilot**
- [ ] QA su Sant'Andrea
- [ ] Raccolta feedback da community
- [ ] Ottimizzazioni

### Settimana 2-3 — Riuso su altre due tassonomie

**Giorno 1-2 (Acqua)**
- [ ] Tassonomia "acqua" config (sorgente, fontanile, pozzo, roggia)
- [ ] Completa stub AnalisiAcqua.jsx
- [ ] Reusa CatalogForm + altri componenti

**Giorno 3-4 (Storico)**
- [ ] Tassonomia "storico" config (castello, fortificazione, miliari, ossario, obelisco)
- [ ] Crea nuovo tab in Research o `/catalog?type=storico`

---

## DECISION GATE (Per Daniel)

**Domanda diretta**: Procediamo con Opzione C (motore generico, pilot su Cristiano)?

```
□ SÍ → Startup: Design motore + implementazione pilot in parallelo
         (Gemini continua Media Phase 4-5, team A fa Catalogazione)
         Timeline: 3 settimane

□ NO → Qual è la preferenza? (Opzione A pura, Opzione B, altra?)
       Cosa ha priorità assoluta nel backlog attualmente?
       (ADR-001? ASA Mainnet? Altro?)
```

---

## NOTA FINALE: Coerenza Sistemica

L'Opzione C è coerente con l'approccio che El Fontanin ha già adottato:

- **GN370**: Un metodo (livelli C/D/I/L), tre/quattro applicazioni (geografia, geologia, cronologia, antropologia)
- **RBAC El Fontanin**: Un modello (Visitatore/Membro/Validatore/Admin), usato ovunque
- **Catalogazione Territoriale**: Un motore (tassonomia-agnostico), tre istanze (cristiano/acqua/storico)

È il **pattern cibernetico applicato**: astrazione di struttura comune, parametrizzazione del dominio specifico, scalabilità per aggiunta di nuove tassonomie.

Coerente con Wiener (feedback loops nella gestione dell'informazione) e Bateson (pattern che connettono domini diversi).
