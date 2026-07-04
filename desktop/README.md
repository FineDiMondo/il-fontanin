# El Fontanin - Desktop Clients (Windows, Linux, macOS)

Questo modulo contiene il wrapper **Electron** per impacchettare l'applicazione web in eseguibili nativi per PC desktop.

Grazie alla configurazione **Web-Server**, l'eseguibile desktop caricherà direttamente la versione live ospitata su Firebase (`https://el-fontanin.web.app/`). Ciò significa che **gli utenti non dovranno mai reinstallare l'applicazione** per vedere le nuove modifiche o aggiornamenti del sito!

---

## 🛠️ Come Compilare gli Eseguibili Nativi

### 1. Prerequisiti
Assicurati di aver installato [Node.js](https://nodejs.org/) sul tuo computer.

### 2. Installazione delle dipendenze
Apri un terminale (PowerShell o Prompt dei comandi) all'interno di questa cartella (`desktop/`) ed esegui:
```bash
npm install
```

### 3. Avviare l'app desktop in modalità Sviluppo
Per testare l'app in locale prima di compilarla:
```bash
npm start
```

### 4. Compilare i pacchetti di distribuzione (dist)
Esegui il comando di build per la tua piattaforma:

*   **Per Windows (Genera un installer `.exe`):**
    ```bash
    npm run dist -- --win
    ```
    *Il file installabile `.exe` verrà generato nella cartella `desktop/dist-desktop/`.*

*   **Per Linux x64 (Genera pacchetti `.AppImage` e `.deb`):**
    ```bash
    npm run dist -- --linux
    ```

*   **Per Linux ARM / Raspberry Pi (Genera pacchetti per Raspberry Pi 32-bit e 64-bit):**
    ```bash
    npm run dist -- --linux --arm64 --armv7l
    ```
    *Questo genererà file `.AppImage` e `.deb` pronti per l'installazione su Raspberry Pi OS.*

*   **Per macOS (Genera un file installer `.dmg`):**
    ```bash
    npm run dist -- --mac
    ```
    *(Nota: La compilazione per Mac richiede di essere su un computer Apple macOS).*
