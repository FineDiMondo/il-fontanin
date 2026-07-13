# AF-ACQUA-005 — Analisi Funzionale
## Mappatura e Catalogazione dei Punti d'Acqua — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AF-ACQUA-005 |
| Fase | Analisi Funzionale (AF) |
| Autore | Claude (AF) |
| Prossimo step | Haiku/Cowork produce AT (Analisi Tecnica) su questa base |
| Validazione AT | Claude, prima dell'handoff a sviluppo |
| Sviluppo e Test | Gemini/Antigravity |
| Destinazione runtime | Categoria "Acqua" del motore di catalogazione (`Catalogo.jsx`) + vista dedicata su `Mappa.jsx` + collegamento a `AnalisiAcqua.jsx` |
| Decisione a monte | Attiva la categoria Acqua, già prevista come riuso futuro in AF-CATALOGAZIONE-001 §1 ma non implementata nel pilot |
| Regno-categoria (content model) | Niflheim — Acque e sorgenti |

---

## 1. Scopo e Contesto

AF-CATALOGAZIONE-001 ha progettato il motore di catalogazione territoriale generico, con pilot sui Monumenti Cristiani e riuso esplicitamente previsto per i "Punti d'acqua" (stub `AnalisiAcqua.jsx`, esistente ma vuoto). Questo documento attiva quella categoria: non introduce un nuovo motore, ma una seconda istanza di dominio sullo stesso motore, più una vista di mappatura geografica dedicata.

Obiettivo: permettere alla community di censire, geolocalizzare e consultare i punti d'acqua della zona (fontanili, sorgenti, pozzi, punti di prelievo storici), collegando dove disponibili i dati di monitoraggio già raccolti da `AnalisiAcqua.jsx` (sensori qualità/livello acqua).

## 2. Perimetro Funzionale

**In scope:**
- Catalogazione collaborativa dei punti d'acqua (stesso workflow bozza → validazione → pubblicazione di AF-CATALOGAZIONE-001)
- Vista mappa dedicata: punti d'acqua geolocalizzati, filtrabili per tipo e stato
- Collegamento opzionale scheda ↔ dati sensore (se il punto d'acqua ha un sensore attivo in `AnalisiAcqua.jsx`)
- Tassonomia di dominio per i punti d'acqua (vedi §5)

**Out of scope (questa iterazione):**
- Installazione o gestione fisica dei sensori
- Allarmi/notifiche automatiche su soglie sensore
- Integrazione con enti esterni (consorzi di bonifica, ARPA)

## 3. Attori e Ruoli (RBAC — riuso as-is da AF-CATALOGAZIONE-001)

| Ruolo | Azioni consentite |
|---|---|
| Visitatore | Ricerca e consultazione punti d'acqua pubblicati |
| Membro | Propone nuova scheda punto d'acqua o modifica (stato: bozza) |
| Validatore | Approva/respinge bozze; qualificato per dominio "Acqua" tramite profilo competenze (AF-COMPETENZE-002), non tramite ruolo nominale separato |
| Amministratore | Gestione tassonomia Acqua, gestione collegamenti a sensori, pubblicazione forzata |

## 4. Modello Dati Funzionale (non tecnico)

Ogni scheda "punto d'acqua" eredita il modello generico di AF-CATALOGAZIONE-001 (identità, localizzazione, evidenza, contenuto, media, tracciabilità, stato) e aggiunge:

- **Tipo di punto**: fontanile, sorgente, pozzo, punto di prelievo storico, altro
- **Stato idrico**: attivo, secco, intermittente, da verificare
- **Collegamento sensore** (opzionale): riferimento al flusso dati di `AnalisiAcqua.jsx`, se presente per quel punto
- **Ultima verifica in campo**: data e autore del sopralluogo

## 5. Tassonomia Punti d'Acqua (proposta)

1. Fontanili
2. Sorgenti naturali
3. Pozzi
4. Punti di prelievo storico/agricolo
5. Altro (da qualificare in bozza, non bloccante)

*Da validare con Daniel prima che l'AT la congeli in schema: elenco indicativo, non definitivo — stesso principio già applicato in AF-CATALOGAZIONE-001 §5.*

## 6. Flussi Funzionali Principali

1. **Ricerca/consultazione**: utente cerca punti d'acqua per tipo o area → risultati su mappa dedicata o lista
2. **Catalogazione**: Membro propone scheda → stato "bozza"
3. **Validazione**: Validatore (qualificato dominio Acqua) revisiona, approva o respinge con nota
4. **Pubblicazione**: scheda approvata visibile su mappa e catalogo
5. **Arricchimento collaborativo**: nuove bozze collegate per aggiornare stato idrico o dati di sopralluogo, senza sovrascrittura diretta
6. **Consultazione dati sensore**: se la scheda ha un collegamento sensore, il Visitatore vede un rimando ai dati di `AnalisiAcqua.jsx` (sola lettura, nessuna duplicazione dati)

## 7. Regole di Business

- Nessuna scheda è visibile pubblicamente prima della validazione (identico a AF-CATALOGAZIONE-001)
- Il collegamento a un sensore non rende la scheda automaticamente pubblicata: resta soggetta allo stesso workflow di validazione
- Lo stato idrico è un campo obbligatorio per la pubblicazione, non per il salvataggio in bozza
- Ogni modifica allo stato idrico di una scheda pubblicata genera una nuova bozza in coda di validazione (storico preservato)

## 8. Criteri di Accettazione (Definition of Done — livello funzionale)

- [ ] Un Membro può inserire una scheda punto d'acqua con almeno i campi obbligatori (nome, tipo, coordinate, stato idrico)
- [ ] Un Validatore qualificato dominio Acqua vede una coda di bozze punti d'acqua e può approvare/respingere
- [ ] Una scheda pubblicata è visibile sulla vista mappa dedicata e ricercabile da un Visitatore
- [ ] Una scheda collegabile a un sensore mostra un rimando ai dati di `AnalisiAcqua.jsx` senza duplicarli
- [ ] Lo schema dati non richiede modifiche strutturali al motore generico di AF-CATALOGAZIONE-001 (verifica di portabilità, coerente con quanto già previsto in quel documento)

## 9. Dipendenze e Rischi Noti (da riportare in AT, non da risolvere qui)

| Rischio | Impatto | Note |
|---|---|---|
| `AnalisiAcqua.jsx` è attualmente uno stub vuoto | Medio | L'AT deve chiarire se il collegamento sensore è un campo predisposto ma non funzionante finché lo stub non viene implementato, o se le due funzionalità procedono in parallelo |
| Qualifica di dominio "Acqua" per i Validatori | Basso | Stesso meccanismo di AF-COMPETENZE-002 già validato per Monumenti Cristiani; da estendere al dominio Acqua, non da riprogettare |
| Vista mappa dedicata vs riuso di `Mappa.jsx` esistente | Da chiarire in AT | Preferibile riuso con filtro per categoria "Acqua" piuttosto che una pagina separata, per coerenza con l'architettura esistente |
| Tassonomia §5 non definitiva | Basso | Non blocca il pilot: categoria "Altro" assorbe i casi non ancora classificati |

## 10. Handoff ad AT (Haiku/Cowork) — cosa deve produrre

1. Schema Firestore per la categoria "Acqua" (coerente con lo schema generico già definito in AT-CATALOGAZIONE-001)
2. Security Rules per i 4 ruoli sulla categoria Acqua (riuso, non riprogettazione)
3. Struttura del filtro/vista mappa dedicata su `Mappa.jsx` per la categoria Acqua
4. Proposta di collegamento dati fra scheda catalogo e `AnalisiAcqua.jsx` (sola lettura)
5. Segnalazione esplicita di ogni punto aperto della sezione 9 che l'AT non può risolvere autonomamente

**Vincolo di processo**: l'AT prodotta da Haiku torna a Claude per validazione prima di passare a Gemini/Antigravity per sviluppo e test.
