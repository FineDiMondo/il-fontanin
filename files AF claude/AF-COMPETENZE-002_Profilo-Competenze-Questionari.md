# AF-COMPETENZE-002 — Analisi Funzionale
## Sistema Profilo Competenze e Questionari Modulari — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AF-COMPETENZE-002 |
| Fase | Analisi Funzionale (AF) |
| Autore | Claude (AF) |
| Dipendenza | Risolve il punto aperto Sez. 3 di AF-CATALOGAZIONE-001 (RBAC per dominio) |
| Relazione | Trasversale — impatta RBAC globale, non solo il motore di catalogazione |
| Prossimo step | Haiku/Cowork produce AT su questa base |
| Validazione AT | Claude |
| Sviluppo e Test | Gemini/Antigravity |

---

## 1. Scopo

Introdurre nel profilo utente una dichiarazione di competenze, raccolta tramite questionari, che qualifichi i ruoli RBAC esistenti (in particolare Validatore) per dominio di competenza. Il sistema deve essere **estensibile**: ogni nuovo tool aggiunto a El Fontanin (Acqua, Storico, Cristiano, futuri) registra il proprio set di domande, senza richiedere modifiche strutturali al motore di profilazione.

## 2. Relazione con il Modello RBAC Esistente

Il RBAC attuale (Visitatore/Membro/Validatore/Amministratore) resta **la struttura di autorizzazione di base**, invariata. Le competenze non sostituiscono i ruoli, li **qualificano**:

```
Ruolo base:        Validatore
Qualificazione:    { dominio: "monumenti-cristiani", livello: "esperto" }
                    { dominio: "punti-acqua", livello: "nessuna" }
```

Un utente può essere Validatore qualificato su un dominio e Membro semplice su un altro. Questo evita la proliferazione di ruoli nominali (Validatore-Storico, Validatore-Acqua, ecc.) mantenendo un solo ruolo base con attributi di dominio.

**DECISO (Daniel, 2026-07-05):** le qualifiche di competenza risiedono in **Firestore**, lette a runtime — non in Custom Claims. Motivazione: Custom Claims ha un limite dimensionale (~1000 byte per token), incompatibile con la crescita prevista dei domini (Acqua, Storico, futuri tool). L'AT deve progettare la struttura di lettura (collection `users/{uid}/competenze/{dominio}`, caching lato client se necessario per performance), non riaprire la scelta del backend.

## 3. Scheda Competenze — Modello Funzionale

Ogni utente ha un profilo competenze composto da:

- **Dominio**: identificatore del tool/ambito (es. `monumenti-cristiani`, `punti-acqua`, `monumenti-storici`, `genealogia-gn370`)
- **Livello dichiarato**: scala (es. Nessuna / Base / Intermedia / Esperta) — autodichiarata dall'utente
- **Livello validato**: stesso scala, assegnato da un Amministratore o Validatore senior dopo verifica (facoltativo, non blocca l'uso base)
- **Fonte della competenza**: campo libero (es. "storico dell'arte", "guida locale", "archivista", "nessuna, per interesse personale")
- **Data ultima revisione**

**Regola di business**: il livello dichiarato è sufficiente per proporre contributi (ruolo Membro). Il livello validato è necessario per assumere ruolo Validatore su quel dominio specifico. Questo distingue "posso contribuire" da "posso approvare i contributi altrui".

## 4. Sistema di Questionari Modulari

### 4.1 Principio di funzionamento
Ogni tool dichiara, al momento della propria implementazione, un **set di domande di competenza** associato al proprio dominio. Il motore di profilazione utente li aggrega automaticamente in un'unica sezione "Competenze" del profilo, senza che i tool esistenti debbano essere modificati quando se ne aggiunge uno nuovo.

### 4.2 Struttura di un set di domande (per dominio)
```
Dominio: monumenti-cristiani
Domande:
  1. Hai conoscenze di storia dell'arte religiosa? [scala]
  2. Hai accesso o esperienza con archivi ecclesiastici? [sì/no + dettaglio]
  3. Conosci l'area Fontanin/Sant'Andrea da residente o da studio? [scala]
```

### 4.3 Comportamento atteso
- Alla registrazione: questionario base (dati generici, nessuna competenza di dominio se nessun tool ancora attivo)
- All'attivazione di un nuovo tool: il questionario si estende con le domande specifiche di quel dominio
- L'utente può rispondere in qualsiasi momento dalla propria scheda profilo, non solo alla prima registrazione
- Le risposte pregresse non vengono mai invalidate dall'aggiunta di un nuovo dominio (isolamento tra domini)

## 5. Flusso Funzionale

1. Amministratore registra un nuovo dominio di competenza (es. all'attivazione del tool Monumenti Cristiani) con il relativo set di domande
2. Ogni utente vede, nella propria scheda profilo, la nuova sezione di domande relativa al dominio
3. Utente compila (facoltativo, ma necessario per proporre contributi con credibilità e per essere considerato per ruolo Validatore)
4. Amministratore o Validatore senior può validare la competenza dichiarata, promuovendo l'utente a Validatore per quel dominio
5. Il motore RBAC dei singoli tool (es. catalogazione) legge la qualifica di dominio per determinare se l'utente può validare schede in quel dominio specifico

## 6. Criteri di Accettazione

- [ ] Un utente può compilare/aggiornare la propria scheda competenze in qualsiasi momento
- [ ] L'aggiunta di un nuovo dominio (nuovo tool) estende il questionario senza richiedere migrazione dei profili esistenti
- [ ] Un Amministratore può validare la competenza dichiarata di un utente su un dominio specifico
- [ ] Il motore di catalogazione (AF-CATALOGAZIONE-001) può interrogare la qualifica di dominio di un utente per determinare se può operare come Validatore su quel dominio

## 7. Rischi e Dipendenze Note

| Rischio | Impatto | Note |
|---|---|---|
| Limite dimensionale Custom Claims Firebase | Chiuso | Deciso: Firestore a runtime, non Custom Claims (vedi Sez. 2) |
| Proliferazione domini senza governance | Chiuso | Confermato: solo Amministratore può creare nuovi domini di competenza |
| Autodichiarazione senza validazione mai completata | Basso | Sistema deve funzionare comunque con solo livello dichiarato, la validazione è un rafforzamento, non un blocco |

## 8. Handoff ad AT (Haiku/Cowork)

1. Schema Firestore dettagliato per profilo competenze (collection `users/{uid}/competenze/{dominio}`, campi, tipi) — backend già deciso (Sez. 2), l'AT progetta la struttura
2. Meccanismo di registrazione domini/domande per tool (chi lo scrive, dove risiede la configurazione) — creazione dominio riservata ad Amministratore (Sez. 7)
3. Componente React per la sezione "Competenze" del profilo utente, estensibile
4. Punto di integrazione con AF-CATALOGAZIONE-001: come il motore di catalogazione legge la qualifica di dominio per assegnare il ruolo Validatore effettivo

**Nota per AT**: questo documento sblocca la Sezione 3 di AF-CATALOGAZIONE-001. L'AT di quel documento va aggiornata di conseguenza (il Validatore non è più un ruolo flat, ma un ruolo qualificato per dominio secondo questo AF).
