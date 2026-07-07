# Piano di Sviluppo: Task Pendenti e AT-COMPETENZE-002

L'Analisi Tecnica (AT) per il modulo Competenze è formalizzata in `files AF claude`. Gli editor per Canzoniere/Ricettario vengono posticipati al post-golive, mantenendoli in modalità MVP-lettura. 

Questo ciclo si concentra sui task "pre-golive" non negoziabili e sullo sviluppo infrastrutturale del modulo Competenze.

---

## 🏛️ Decisione Architetturale Ufficiale: PostgreSQL vs Firestore
**CONFERMA ESPLICITA**: Si riconferma in via definitiva l'adozione di **PostgreSQL** (tramite `community_module` / FastAPI / SQLAlchemy) come layer di persistenza per il modulo Competenze, superando l'assunzione originale su Firestore presente nell'AF. Questa scelta garantisce coerenza con il resto del RBAC e dell'infrastruttura relazionale in uso per le altre feature.

---

## 🛠️ Proposed Changes

### 1. Task Pre-GoLive (Propedeutici)

#### [PR] Riallineamento Draft (First Step)
- Creazione della PR per risolvere i 45/20 commit di scarto accumulati sul branch `feature/algorand-wallet-mpc` rispetto a `main`.

#### [NEW] Inizializzazione Alembic
- Inizializzazione di Alembic in `community_module` per la gestione delle migrazioni.
- Estrazione dello schema attuale in una "initial migration" (baseline) *prima* di creare le tabelle Competenze, per non rompere il DB di produzione.

#### [MODIFY] Allineamento Env Var ASA
- **Standardizzazione univoca**: Verrà adottata e propagata una sola variabile ambiente: `VITE_F_TOKEN_ASA_ID`. 
- Qualsiasi riferimento a `VITE_FONTANIN_ASA_ID` verrà eliminato/unificato. L'aggiornamento toccherà `.env.example`, `AGENTS.md` (se necessario) e `WalletCard.jsx`.

#### [MODIFY] Fix Sicurezza Bozze Catalogo
- Indagine e risoluzione del bug di sicurezza sulle bozze del catalogo per bloccare l'accesso non autorizzato alle bozze.

---

### 2. Sviluppo AT-COMPETENZE-002 (Profilo Competenze)

#### [MODIFY] Feature Flag: `ff_competenze`
- Inserimento di un nuovo feature flag `ff_competenze` (di default `OFF`) che proteggerà il rilascio della funzionalità. 
- Il menu `Profilo`, il componente `CompetenzeSection` e la rotta frontend dedicata saranno montati e visibili **esclusivamente** se il flag è attivo.

#### [MODIFY] `community_module/models/community_models.py`
- Aggiunta delle tabelle `CompetenzaDominio` e `CompetenzaUtente` (con JSONB).

#### [NEW] Migrazione Alembic
- Creazione della migrazione per applicare le tabelle competenze a PostgreSQL (`jackass_verona`).

#### [MODIFY] `community_module/models/schemas.py`
- Aggiunta degli schema Pydantic: `DomandaCompetenza`, `DominioCreate`, `DominioOut`, `CompetenzaDichiarazione`, ecc.

#### [NEW] `community_module/services/competenze_service.py` & `community_module/api/competenze.py`
- Implementazione della funzione `is_validatore_per_dominio`.
- Implementazione del router FastAPI con controllo RBAC e mount in `community_main.py`.

#### [NEW] Frontend: `Profilo.jsx` e `CompetenzeSection.jsx`
- Creazione della pagina Profilo Utente.
- Form integrato protetto dal flag `ff_competenze`.

#### [MODIFY] Bootstrap Dominio Admin
- Creazione script per popolare il dominio "monumenti-cristiani".

---

## 🧪 Verification Plan

### Automated Tests
- Esecuzione di `test_backend.py`, `test_visitatore.py` e della nuova test suite `test_usabilita_write_gated.py`.
- Test unitario della logica RBAC `is_validatore_per_dominio` con PyTest.

### Manual Verification
- **Alembic**: Verifica del corretto auto-generamento delle migrazioni.
- **Competenze**: Verifica visibilità menu tramite `ff_competenze` (ON/OFF). Test di validazione dichiarazione utente da parte dell'Admin e conseguente sblocco dei permessi sul Catalogo.
