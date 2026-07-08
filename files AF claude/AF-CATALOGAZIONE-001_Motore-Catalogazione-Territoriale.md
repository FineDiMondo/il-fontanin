# AF-CATALOGAZIONE-001 — Analisi Funzionale
## Motore di Catalogazione Territoriale — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AF-CATALOGAZIONE-001 |
| Fase | Analisi Funzionale (AF) |
| Autore | Claude (AF) |
| Prossimo step | Haiku/Cowork produce AT (Analisi Tecnica) su questa base |
| Validazione AT | Claude, prima dell'handoff a sviluppo |
| Sviluppo e Test | Gemini/Antigravity |
| Destinazione runtime | `el-fontanin.web.app/research` (attualmente vuota — primo esperimento) |
| Decisione a monte | Opzione C — Motore generico + Pilot (confermata) |

---

## 1. Scopo e Contesto

Progettare un motore di catalogazione collaborativa territoriale, generico rispetto al dominio, con **pilot iniziale sui Monumenti Cristiani** (nodo zero: Sant'Andrea) e riuso successivo su:
- Punti d'acqua (stub esistente `AnalisiAcqua.jsx`, vuoto — nessuna migrazione, solo sostituzione)
- Monumenti storici (Serraglio, castelli, rovine romane/pietre miliari, fortificazioni austriache, monumenti del Regno d'Italia — es. obelisco di Villafranca, ossario)

Il motore eredita il metodo di evidenza già validato in GN370 ([C]/[D]/[I]/[L]) e il RBAC già in uso in El Fontanin.

## 2. Perimetro Funzionale

**In scope (pilot):**
- Ricerca geolocalizzata di monumenti cristiani nell'area Fontanin, a partire da Sant'Andrea
- Catalogazione collaborativa (inserimento, modifica, arricchimento da parte di più utenti)
- Attribuzione di un livello di evidenza a ciascuna scheda
- Allegati (foto, documenti, riferimenti archivistici)
- Workflow di validazione prima della pubblicazione

**Out of scope (pilot):**
- Sincronizzazione con FamilySearch o GN370 (solo predisposizione dati compatibile, non integrazione attiva)
- Categorie Acqua e Storico (progettate nello schema, non implementate in questa iterazione)
- Notifiche push, gamification, export pubblico

## 3. Attori e Ruoli (RBAC — riuso as-is)

| Ruolo | Azioni consentite sul catalogo |
|---|---|
| Visitatore | Ricerca e consultazione schede pubblicate |
| Membro | Propone nuove schede o modifiche (stato: bozza) |
| Validatore | Approva/respinge bozze, assegna livello di evidenza definitivo |
| Amministratore | Gestione tassonomie, gestione ruoli, pubblicazione forzata |

**RISOLTO — vedi AF-COMPETENZE-002.** Il ruolo Validatore è qualificato per dominio tramite profilo competenze (autodichiarato + validato da Amministratore), non tramite ruoli nominali separati (no Validatore-Cristiano/Validatore-Acqua come ruoli distinti). Il motore di catalogazione deve interrogare la qualifica di dominio dell'utente (fonte: AF-COMPETENZE-002) per determinare se può operare come Validatore su quella categoria specifica. L'AT di questo documento deve includere il punto di integrazione con AF-COMPETENZE-002.

## 4. Modello Dati Funzionale (non tecnico)

Ogni scheda di catalogo è composta da:

- **Identità**: nome, categoria, sottocategoria
- **Localizzazione**: coordinate geografiche, riferimento all'area (Fontanin/Sant'Andrea come nodo zero)
- **Evidenza**: livello [C/D/I/L], fonte (es. Archivio Diocesano, Archivio di Stato, osservazione diretta), data verifica
- **Contenuto**: descrizione, cronologia storica se nota
- **Media**: foto, documenti allegati
- **Metadati specifici di dominio**: campi variabili per categoria (es. per un'edicola votiva: dedicazione, stato di conservazione; per un monumento del Regno d'Italia: anno di erezione, iscrizione)
- **Tracciabilità contributo**: chi ha inserito/modificato, quando, con quale ruolo
- **Stato**: bozza → in validazione → pubblicato

## 5. Tassonomia Monumenti Cristiani (pilot)

Nodo zero: **Sant'Andrea**. Sottocategorie proposte:
1. Edifici di culto (chiese, cappelle, oratori)
2. Segnaletica devozionale minore (edicole votive, capitelli, croci di confine)
3. Elementi cimiteriali storici
4. Elementi architettonici religiosi isolati (campanili/absidi residue)

*Da validare con Daniel prima che AT la congeli in schema: elenco indicativo, non definitivo.*

## 6. Flussi Funzionali Principali

1. **Ricerca**: utente cerca per categoria/area geografica → risultati su mappa/lista
2. **Catalogazione**: Membro propone scheda → stato "bozza"
3. **Validazione**: Validatore revisiona, assegna livello evidenza, approva o respinge con nota
4. **Pubblicazione**: scheda approvata diventa visibile a Visitatore
5. **Arricchimento collaborativo**: qualsiasi Membro può proporre modifiche a scheda già pubblicata (nuova bozza collegata, non sovrascrittura diretta)

## 7. Regole di Business

- Nessuna scheda è visibile pubblicamente prima della validazione
- Ogni modifica a scheda pubblicata genera una nuova bozza in coda di validazione (storico preservato)
- Il livello di evidenza è obbligatorio per la pubblicazione, non per il salvataggio in bozza
- Attribuzione della fonte obbligatoria quando la fonte è un archivio esterno (Diocesano, di Stato)

## 8. Criteri di Accettazione (Definition of Done — livello funzionale)

- [ ] Un Membro può inserire una scheda Monumenti Cristiani con almeno i campi obbligatori (nome, categoria, coordinate, descrizione)
- [ ] Un Validatore vede una coda di bozze e può approvare/respingere
- [ ] Una scheda pubblicata è ricercabile da un Visitatore per categoria e per area
- [ ] Lo schema dati supporta, senza modifiche strutturali, l'aggiunta futura delle categorie Acqua e Storico (verifica di portabilità, non implementazione)

## 9. Dipendenze e Rischi Noti (da riportare in AT, non da risolvere qui)

| Rischio | Impatto | Note |
|---|---|---|
| RBAC uniforme vs per-dominio non deciso | Chiuso | Vedi AF-COMPETENZE-002 — Validatore qualificato per dominio |
| `metadata_specifici` senza validazione di schema | Medio | AT deve proporre validazione minima lato client per il pilot, non rimandarla indefinitamente |
| Accesso Archivio Diocesano non ancora confermato | Basso per il pilot | Non blocca il pilot: la fonte può essere inserita come "in attesa" finché non arriva risposta |
| Timeline indicative (3 settimane) non verificate su capacità reale | Basso | AT non deve ereditare la stima come commitment, solo come riferimento |

## 10. Handoff ad AT (Haiku/Cowork) — cosa deve produrre

1. Schema Firestore dettagliato (collection path, campi, tipi)
2. Security Rules complete per i 4 ruoli
3. Struttura componenti React (`CatalogForm.jsx` generico + variante Monumenti Cristiani)
4. Elenco endpoint/funzioni necessarie
5. Proposta di validazione schema per `metadata_specifici` (anche minima)
6. Segnalazione esplicita di ogni punto aperto della sezione 9 che l'AT non può risolvere autonomamente

**Vincolo di processo**: l'AT prodotta da Haiku torna a Claude per validazione prima di passare a Gemini/Antigravity per sviluppo e test.
