# NOTA INTERNA — Consiglio Direttivo Fine di Mondo APS
## Oggetto: Visibilità pubblica degli esperimenti sociali nell'app Il Fontanin
**Data:** 4 luglio 2026
**Da:** Team tecnico (revisione sicurezza branch `feature/algorand-wallet-mpc`)
**A:** Consiglio Direttivo Fine di Mondo APS
**Classificazione:** Uso interno — non pubblicare

---

## 1. Fatto tecnico rilevato

Durante la revisione di sicurezza del ramo di sviluppo è stato accertato che l'endpoint

```
GET /community/research/experiments
```

è accessibile **senza autenticazione** (visitatore anonimo, nessun token richiesto).

L'endpoint restituisce, per ciascun esperimento registrato nel sistema, i seguenti campi:

| Campo | Tipo | Esempio |
|---|---|---|
| `id` | UUID | — |
| `titolo` | stringa | "Indagine sulla mobilità nel parco" |
| `descrizione` | stringa (opt.) | testo libero inserito dal creatore |
| `tipo` | stringa | "sondaggio" |
| `stato` | stringa | "attivo" / "concluso" / "bozza" |
| `anonimo` | booleano | `true` / `false` |
| `starts_at` / `ends_at` | timestamp | — |
| `created_at` | timestamp | — |


## 2. Domanda al Consiglio Direttivo

**La scelta di rendere pubblico l'elenco degli esperimenti sociali è intenzionale?**

Due scenari sono possibili:

**Scenario A — Scelta intenzionale (trasparenza):** il Consiglio ha deciso che i cittadini e i visitatori del parco devono poter vedere quali ricerche l'associazione conduce, senza dover creare un account. Questo è coerente con una politica di open government / trasparenza associativa.

**Scenario B — Esposizione non pianificata:** la visibilità anonima è un residuo dell'impostazione di default del framework e non è mai stata valutata consapevolmente dal Consiglio. In questo caso occorre una delibera che la confermi o la revochi.

Il team tecnico non ha modificato la logica di accesso — la configurazione attuale è rimasta invariata, il fix rilasciato nel commit `dac1843` aggiorna solo la dichiarazione formale OpenAPI (documentazione), non il comportamento runtime.

---

## 3. Implicazioni GDPR / privacy

Indipendentemente dallo scenario, si segnalano le seguenti considerazioni:

**3.1 Campo `anonimo: false`**
Quando un esperimento è contrassegnato come `anonimo: false`, il suo titolo e descrizione sono visibili pubblicamente. Se il titolo o la descrizione contengono riferimenti a categorie di persone identificabili (es. "Sondaggio sugli anziani residenti", "Ricerca sui minori del doposcuola"), la pubblicazione potrebbe costituire trattamento di dati personali **senza base giuridica** ai sensi dell'art. 6 GDPR.

**3.2 Finalità del trattamento (art. 13 GDPR)**
Se i partecipanti a un esperimento sono stati informati che i dati sarebbero trattati solo internamente, la successiva pubblicazione dell'esperimento — anche solo in forma di metadato — potrebbe non essere compatibile con la finalità dichiarata nella privacy notice.

**3.3 Minimizzazione dei dati (art. 5.1.c GDPR)**
Esporre `created_at`, `starts_at`, `ends_at` e `stato` a visitatori anonimi va oltre il minimo necessario per le finalità di trasparenza, se queste non sono state esplicitamente definite come base del trattamento.

**3.4 Responsabile del trattamento**
Fine di Mondo APS, in quanto titolare del trattamento, è responsabile di questa scelta indipendentemente dal fatto che sia tecnica o deliberata.


## 4. Opzioni tecniche disponibili (non implementate, in attesa di delibera)

| Opzione | Descrizione | Impatto utente |
|---|---|---|
| **A — Mantieni pubblica** | Nessuna modifica al codice; delibera formale del Consiglio che ratifica la scelta | Nessuno |
| **B — Accesso solo per soci** | L'endpoint richiede token valido; i visitatori non vedono gli esperimenti | I link diretti non funzionano per non iscritti |
| **C — Pubblica solo esperimenti espliciti** | Nuovo campo `pubblica: bool` su ogni esperimento; il gestore decide caso per caso | Flessibilità massima, piccolo onere gestionale |
| **D — Oscura campi sensibili** | L'endpoint rimane pubblico ma restituisce solo `titolo` e `stato`, rimuovendo `anonimo`, timestamp e descrizione | Trasparenza ridotta, rischio GDPR minimizzato |

Il team tecnico è disponibile a implementare qualsiasi opzione a seguito di delibera.

---

## 5. Azione richiesta

Si chiede al Consiglio Direttivo di deliberare, entro la prossima riunione ordinaria, su:

1. **Conferma o revoca** della visibilità pubblica dell'elenco esperimenti (Scenario A o B, punto 2).
2. **Scelta dell'opzione tecnica** (punto 4) qualora si decida di modificare il comportamento attuale.
3. **Aggiornamento della privacy policy** dell'associazione qualora la visibilità pubblica venga confermata.

In assenza di delibera, il team tecnico manterrà lo stato attuale senza ulteriori modifiche.

---

*Documento redatto automaticamente dalla sessione di revisione sicurezza — Finding #3.*
*Per chiarimenti tecnici: aprire una issue su GitHub o contattare il team di sviluppo.*
