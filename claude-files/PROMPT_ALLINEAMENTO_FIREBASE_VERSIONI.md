# INCARICO — Allineamento Firebase e versioni applicative — El Fontanin

Destinatario: Gemini CLI / Antigravity
Repository: `D:\Progetti GCloud\fontanin` (branch attivi: `main`, `feature/algorand-wallet-mpc`)
Metodo di lavoro richiesto: procedere per fasi, un gate di verifica prima di ogni fase successiva, nessuna azione irreversibile senza conferma esplicita dell'utente in chat per QUELLA specifica azione. Evidenza sempre sopra asserzione: ogni riga di stato deve essere accompagnata dal comando eseguito e dal suo output reale, mai da una stima.

## 0. Contesto verificato (stato al momento della stesura di questo incarico)

- **Web**: app Vite/React. Firebase Hosting (`el-fontanin.web.app`, progetto `el-fontanin`) serve **solo il branch `main`**. Esiste anche una configurazione Vercel (`vercel.json`, `.vercel/`) il cui scopo attuale non è stato confermato — non assumerlo, verificarlo in Fase A.
- **Branch `feature/algorand-wallet-mpc`**: contiene lavoro non presente su `main` e non deployato da nessuna parte — wallet Algorand MPC (Web3Auth SFA), saldo token «f» via indexer, fix crash `ForumCategory.jsx`, variante tema scuro `.fn-card--dark`, allineamento OpenAPI per Progressive Guest Mode, `COORDINATION.md` di coordinamento multi-sessione.
- **Android / iOS**: progetti Capacitor (`android/`, `ios/`, `capacitor.config.json`). Il webview **non incorpora il build Vite locale**: `server.url` punta a `https://el-fontanin.web.app`. Significa che si allineano automaticamente a qualunque cosa sia pubblicata su Firebase Hosting, ma vanno comunque verificati `appId`, permessi nativi, `versionCode`/`versionName` (Android) e build number (iOS) — questi NON si aggiornano da soli.
- **Desktop**: wrapper Electron (`desktop/main.js`) — stesso meccanismo, `loadURL('https://el-fontanin.web.app')`. Stessa considerazione su versione del pacchetto (`desktop/package.json`, oggi `1.0.0`).
- **CLI**: `fontanin-cli.ps1`, `fontanin-real-client.ps1` — client PowerShell che parlano presumibilmente con il backend via `VITE_API_BASE_URL`/endpoint equivalente. Da verificare se l'endpoint è hardcoded o letto da config, e se è allineato a quello effettivamente live.
- **Backend**: `community_module/` (FastAPI), con target di deploy `cloudbuild_community.yaml` / `Dockerfile.community` e riferimento in `.env.example` a `https://freedomrun-491323.ey.r.appspot.com` (App Engine). Non è stato verificato in questa sessione se il servizio live include già il fix OpenAPI del commit `dac1843` — verificarlo, non assumerlo.
- `package.json` root: `"name": "il-fontanin"`, `"version": "1.0.0"`. Nessuno script di build/deploy automatizzato oltre `vite build`.
- Multi-sessione Cowork attiva su `feature/algorand-wallet-mpc`: esiste `COORDINATION.md` in root che assegna ownership di file/moduli a sessioni diverse. **Leggerlo per primo**, insieme ad `AGENTS.md` e (se presente) `claude-files/README_HANDOFF.md`, prima di qualunque modifica.

## 1. Obiettivo (definizione operativa di "allineato")

Tutte le versioni dell'app (Web/Firebase, Web/Vercel se mantenuto, Android, iOS, Desktop, CLI) devono:
1. Puntare allo stesso git ref concordato per il contenuto applicativo.
2. Dichiarare lo stesso numero di versione semantica nei rispettivi file di config (`package.json` root, `capacitor.config.json`, `desktop/package.json`, versionName/versionCode Android, build iOS).
3. Parlare con lo stesso contratto API (stessa versione di OpenAPI, stesso backend live) — nessun client con endpoint o assunzioni stale.

Non è richiesto di decidere autonomamente COSA allineare (es. se e quando fare merge di `feature/algorand-wallet-mpc` in `main`) — questo è oggetto della Fase C, da presentare come proposta.

## 2. Fasi

### FASE A — Audit (sola lettura, zero modifiche)

Per ciascuna versione, produrre una riga di tabella con: git ref/commit servito o pacchettizzato, numero di versione dichiarato, endpoint/API base URL configurato, comando usato per verificarlo, output ottenuto.

Coprire almeno:
- Firebase Hosting (`el-fontanin.web.app`): quale branch/commit è effettivamente live (es. via header, build hash in `dist/`, o confronto contenuto).
- Vercel: cosa serve oggi, se è ancora attivo, a cosa punta.
- `android/` e `ios/`: `appId`, versionCode/versionName o equivalente, eventuali plugin nativi che richiedono rebuild.
- `desktop/`: versione pacchetto, se esistono build già distribuite (`dist-desktop/`).
- CLI (`fontanin-cli.ps1`, `fontanin-real-client.ps1`): endpoint hardcoded vs. configurabile.
- Backend: quale servizio è realmente raggiungibile (App Engine `freedomrun-491323` e/o Cloud Run), quale commit/versione dell'OpenAPI spec espone davvero (confrontare con `dac1843`).

### FASE B — Gap analysis

Elencare ogni discrepanza trovata in Fase A. Per ciascuna: descrizione, rischio se non risolta (es. utente Android vede feature diverse da utente Desktop; CLI firma con contratto API superato), azione proposta, reversibilità dell'azione proposta.

### FASE C — Piano di allineamento (proposta, NON esecuzione)

Presentare un piano ordinato che copra tipicamente: decisione su merge/rebase di `feature/algorand-wallet-mpc` verso `main` (o mantenimento separato con motivazione), bump di versione coordinato in tutti i file di config coinvolti, ordine di redeploy (backend prima o dopo frontend, a seconda delle dipendenze API), decisione esplicita su Vercel (mantenere sincronizzato, ridirezionare, o dismettere — da sottoporre all'utente, non decidere autonomamente), eventuale necessità di rebuild/resign Android/iOS/Electron.

**Presentare il piano in chat e attendere conferma esplicita dell'utente prima di passare alla Fase D.**

### FASE D — Esecuzione (solo dopo conferma, un'azione irreversibile alla volta)

- Eseguire nell'ordine concordato in Fase C.
- Commit atomici, messaggio descrittivo per ciascun passo.
- Ricontrollare `git status` / `git log` immediatamente prima di ogni scrittura (disciplina multi-sessione già in uso — vedi `COORDINATION.md`); se si rileva una scrittura concorrente non prevista, fermarsi e riportare, non sovrascrivere.
- **Nessun deploy** (Firebase Hosting, Cloud Run/App Engine, Vercel) e **nessun merge su `main`** senza una conferma separata e specifica dell'utente per QUELLA singola azione — non vale un "vai" generico dato in Fase C per l'intero piano.

### FASE E — Verifica post-allineamento

- Per ciascuna versione: confermare con evidenza (non asserzione) che serve/contiene il git ref concordato.
- Ripetere i test esistenti (`test_visitatore.py`, `test_backend.py`, `test-cli-batch.ps1`) e riportare i risultati numerici.
- Aggiornare `COORDINATION.md` con l'esito.

## 3. Vincoli non negoziabili

- Nessuna modifica alla logica interna di `AuthContext.jsx` / `WalletContext.jsx` oltre a quanto già presente.
- Nessuna implementazione della recovery policy del wallet (finding #4 — bloccato, attende delibera del Consiglio Direttivo).
- Nessuna decisione autonoma sulla visibilità pubblica di ricerca/esperimenti (finding #3 — memo di governance già scritto, attende delibera).
- Rispettare l'ownership dei file dichiarata in `COORDINATION.md` se altre sessioni Cowork risultano ancora attive.
- Nessun ASA ID, chiave o segreto hardcodato in nessuna versione (web, mobile, desktop, CLI).
- Nessun deploy o merge su `main` senza conferma esplicita dell'utente in chat, per ciascuna singola azione — mai per l'intero piano in blocco.

## 4. Criteri di accettazione

- Tabella di Fase A completa, ogni riga con comando ed evidenza reale.
- Zero discrepanze non giustificate tra le versioni dichiarate nei file di config al termine della Fase D.
- Tutti i test esistenti verdi dopo l'esecuzione.
- Report finale strutturato: stato iniziale, gap trovati, piano proposto, azioni effettivamente eseguite (con commit hash), stato finale, punti ancora aperti per decisione umana.
