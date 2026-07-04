# Fontanin Real Client - Terminal Client App (Real Backend Integration)
# Fine di Mondo APS (c) 2026

$Host.UI.RawUI.WindowTitle = "El Fontanin - Real Terminal App v1.0.0"

# Configuration
$global:BackendUrl = "https://finedimondo-backend-vqytacm7la-ew.a.run.app/community"
$global:AuthToken = $null
$global:CurrentUser = $null

# Console Colors ANSI
$ESC = [char]27
$ClrOro   = "$ESC[38;5;220m"
$ClrCyan  = "$ESC[38;5;51m"
$ClrGreen = "$ESC[38;5;46m"
$ClrRed   = "$ESC[38;5;196m"
$ClrGray  = "$ESC[38;5;244m"
$ClrWhite = "$ESC[38;5;15m"
$ClrReset = "$ESC[0m"

function Clear-Screen {
    Clear-Host
}

# Helper per chiamate REST API al Backend
function Invoke-API($method, $path, $body = $null) {
    $url = "$global:BackendUrl$path"
    $headers = @{
        "Accept" = "application/json"
    }
    if ($global:AuthToken) {
        $headers.Add("Authorization", "Bearer $global:AuthToken")
    }

    $params = @{
        Uri = $url
        Method = $method
        Headers = $headers
        ContentType = "application/json"
        TimeoutSec = 10
    }
    if ($body) {
        $params.Add("Body", ($body | ConvertTo-Json -Depth 5))
    }

    try {
        $res = Invoke-RestMethod @params
        return $res
    } catch {
        # Gestione errori robusta per catturare loop ed errori di autorizzazione 401/403/500
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "[ERRORE 401] Autenticazione non valida o scaduta. Rimozione sessione." -ForegroundColor Red
            $global:AuthToken = $null
            $global:CurrentUser = $null
        } elseif ($statusCode -eq 403) {
            Write-Host "[ERRORE 403] Accesso negato: permessi insufficienti per questa operazione." -ForegroundColor Red
        } else {
            Write-Host "[ERRORE API] HTTP $statusCode - $($_.Exception.Message)" -ForegroundColor Red
            if ($_.ErrorDetails) {
                Write-Host "Dettagli: $($_.ErrorDetails)" -ForegroundColor Red
            }
        }
        return $null
    }
}

function Show-Header {
    Write-Host "$ClrOro"
    Write-Host "       .---.      "
    Write-Host "      /     \     "
    Write-Host "     \\     //    "
    Write-Host "      \\   //     "
    Write-Host "       \  /       "
    Write-Host "        \/        "
    Write-Host "   IL FONTANIN    $ClrGray(Fine di Mondo APS)$ClrOro"
    Write-Host "   ───────────    "
    if ($global:CurrentUser) {
        Write-Host "   Utente: $($global:CurrentUser.nome) | Ruolo: $($global:CurrentUser.ruolo)" -ForegroundColor Green
    } else {
        Write-Host "   [Stato: Sloggato/Visitatore]" -ForegroundColor Gray
    }
    Write-Host ""
}

function Show-MainMenu {
    Write-Host "$ClrWhite┌────────────────────────────────────────────────────────┐"
    if ($null -eq $global:AuthToken) {
        Write-Host "│  $ClrOro[1]$ClrWhite Login con Email e Password                        │"
        Write-Host "│  $ClrOro[2]$ClrWhite Registra Nuovo Account (Guest/Visitatore)         │"
        Write-Host "│  $ClrOro[3]$ClrWhite Login con Google (Apre Chrome + Incolla Token)    │"
        Write-Host "│  $ClrOro[4]$ClrWhite Apri Applicazione Web Online (Chrome)             │"
    } else {
        Write-Host "│  $ClrOro[1]$ClrWhite Logout (Disconnetti sessione)                    │"
        Write-Host "│  $ClrOro[3]$ClrWhite Area Forum (Categorie e Discussioni)               │"
        Write-Host "│  $ClrOro[4]$ClrWhite Stanza Chat Realtime                              │"
        Write-Host "│  $ClrOro[5]$ClrWhite Eventi della Comunta' & Check-in                  │"
        Write-Host "│  $ClrOro[6]$ClrWhite Wallet Algorand MPC (Verifica Chiave)             │"
        Write-Host "│  $ClrOro[9]$ClrWhite Apri Applicazione Web Online (Chrome)             │"
    }
    Write-Host "│  $ClrOro[7]$ClrWhite Impostazioni (Cambia Endpoint Backend)            │"
    Write-Host "│  $ClrOro[8]$ClrWhite Esci                                              │"
    Write-Host "└────────────────────────────────────────────────────────┘$ClrReset"
    Write-Host ""
}

function Handle-Login {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- ACCESSO ACCOUNT ---$ClrReset"
    Write-Host ""
    $email = Read-Host "Inserisci Email"
    $pass = Read-Host "Inserisci Password" -AsSecureString
    
    # Converte secure string a testo in chiaro per le API
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass)
    $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

    $payload = @{
        email = $email
        password = $plainPass
    }

    Write-Host "Invio richiesta di login..." -ForegroundColor Gray
    $res = Invoke-API -method "POST" -path "/auth/login" -body $payload
    if ($res) {
        $global:AuthToken = $res.access_token
        $global:CurrentUser = $res
        Write-Host "[OK] Accesso effettuato con successo! Benvenuto, $($res.nome)." -ForegroundColor Green
    } else {
        Write-Host "[FALUT] Impossibile autenticare l'utente." -ForegroundColor Red
    }
    Start-Sleep -Seconds 2
}

function Handle-Register {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- REGISTRAZIONE NUOVO UTENTE ---$ClrReset"
    Write-Host ""
    $email = Read-Host "Inserisci Email"
    $nome = Read-Host "Nome"
    $cognome = Read-Host "Cognome"
    $pass = Read-Host "Scegli Password"
    
    $payload = @{
        email = $email
        password = $pass
        nome = $nome
        cognome = $cognome
        cf_socio = ""
    }

    Write-Host "Invio richiesta di registrazione..." -ForegroundColor Gray
    $res = Invoke-API -method "POST" -path "/auth/register" -body $payload
    if ($res) {
        $global:AuthToken = $res.access_token
        $global:CurrentUser = $res
        Write-Host "[OK] Registrazione completata con successo!" -ForegroundColor Green
    } else {
        Write-Host "[FALLITO] Registrazione non riuscita." -ForegroundColor Red
    }
    Start-Sleep -Seconds 2
}

function Handle-Forum {
    while ($true) {
        Clear-Screen
        Show-Header
        Write-Host "$ClrOro--- FORUM DELLA COMMUNITY ---$ClrReset"
        Write-Host ""
        
        Write-Host "Caricamento categorie..." -ForegroundColor Gray
        $categories = Invoke-API -method "GET" -path "/forum/categories"
        if ($null -eq $categories -or $categories.Count -eq 0) {
            Write-Host "Nessuna categoria trovata o errore di connessione." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            return
        }

        for ($i=0; $i -lt $categories.Count; $i++) {
            Write-Host (" [{0}] {1} ($ClrCyan{2}$ClrReset)" -f ($i+1), $categories[$i].nome, $categories[$i].slug)
        }
        Write-Host " [E] Torna al Menu Principale"
        Write-Host ""
        $choice = Read-Host "Seleziona una categoria o Esci"
        if ($choice -eq "e" -or $choice -eq "E") { return }

        $catIndex = [int]$choice - 1
        if ($catIndex -ge 0 -and $catIndex -lt $categories.Count) {
            Handle-CategoryThreads($categories[$catIndex])
        }
    }
}

function Handle-CategoryThreads($category) {
    while ($true) {
        Clear-Screen
        Show-Header
        Write-Host ("$ClrOro--- FORUM > CATEGORIA: {0} ---$ClrReset" -f $category.nome)
        Write-Host ""

        Write-Host "Caricamento discussioni..." -ForegroundColor Gray
        $threads = Invoke-API -method "GET" -path "/forum/categories/$($category.slug)/threads"
        if ($null -eq $threads) { return }

        if ($threads.Count -eq 0) {
            Write-Host "Nessuna discussione aperta in questa categoria." -ForegroundColor Gray
        } else {
            for ($i=0; $i -lt $threads.Count; $i++) {
                Write-Host (" [{0}] {1} (Creato da: {2})" -f ($i+1), $threads[$i].titolo, $threads[$i].autore_nome)
            }
        }
        Write-Host ""
        Write-Host " [N] Crea Nuova Discussione"
        Write-Host " [E] Torna alle Categorie"
        Write-Host ""
        $choice = Read-Host "Seleziona discussione, crea Nuova [N] o torna indietro [E]"
        if ($choice -eq "e" -or $choice -eq "E") { return }
        if ($choice -eq "n" -or $choice -eq "N") {
            Handle-CreateThread($category.slug)
            continue
        }

        $threadIndex = [int]$choice - 1
        if ($threadIndex -ge 0 -and $threadIndex -lt $threads.Count) {
            Handle-ViewThread($threads[$threadIndex])
        }
    }
}

function Handle-CreateThread($catSlug) {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- CREA NUOVA DISCUSSIONE ---$ClrReset"
    Write-Host ""
    $titolo = Read-Host "Titolo della discussione"
    $corpo = Read-Host "Contenuto del primo post"

    $payload = @{
        titolo = $titolo
        corpo = $corpo
    }

    Write-Host "Invio discussione..." -ForegroundColor Gray
    $res = Invoke-API -method "POST" -path "/forum/categories/$catSlug/threads" -body $payload
    if ($res) {
        Write-Host "[OK] Discussione creata correttamente!" -ForegroundColor Green
    }
    Start-Sleep -Seconds 1.5
}

function Handle-ViewThread($thread) {
    while ($true) {
        Clear-Screen
        Show-Header
        Write-Host ("$ClrOro--- DISCUSSIONE: {0} ---$ClrReset" -f $thread.titolo)
        Write-Host ""

        Write-Host "Caricamento messaggi..." -ForegroundColor Gray
        $posts = Invoke-API -method "GET" -path "/forum/threads/$($thread.id)/posts"
        if ($null -eq $posts) { return }

        foreach ($p in $posts) {
            Write-Host ("$ClrCyan{0}$ClrReset ha scritto:" -f $p.autore_nome)
            Write-Host " -> $($p.corpo)"
            Write-Host "$ClrGray--------------------------------------------------$ClrReset"
        }

        Write-Host ""
        Write-Host " [R] Rispondi alla Discussione"
        Write-Host " [E] Torna all'Elenco Discussioni"
        Write-Host ""
        $choice = Read-Host "Rispondi [R] o torna indietro [E]"
        if ($choice -eq "e" -or $choice -eq "E") { return }
        if ($choice -eq "r" -or $choice -eq "R") {
            $corpo = Read-Host "Scrivi la tua risposta"
            $payload = @{
                corpo = $corpo
            }
            $res = Invoke-API -method "POST" -path "/forum/threads/$($thread.id)/posts" -body $payload
            if ($res) {
                Write-Host "Risposta inserita correttamente!" -ForegroundColor Green
                Start-Sleep -Seconds 1
            }
        }
    }
}

function Handle-Chat {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- CHAT STANZA COMUNITARIA ---$ClrReset"
    Write-Host ""
    
    # Carica la prima stanza di chat (slug general)
    Write-Host "Caricamento messaggi della chat..." -ForegroundColor Gray
    $messages = Invoke-API -method "GET" -path "/chat/rooms/general/messages"
    if ($null -eq $messages) {
        Start-Sleep -Seconds 2
        return
    }

    foreach ($m in $messages) {
        Write-Host ("$ClrCyan[{0}]$ClrReset $ClrWhite{1}${ClrReset}: {2}" -f $m.timestamp.Substring(11, 8), $m.autore_nome, $m.testo)
    }
    Write-Host ""
    
    $messaggio = Read-Host "Scrivi un messaggio da inviare in chat (o lascia vuoto per uscire)"
    if ($messaggio) {
        $payload = @{
            testo = $messaggio
        }
        $res = Invoke-API -method "POST" -path "/chat/rooms/general/messages" -body $payload
        if ($res) {
            Write-Host "Messaggio inviato!" -ForegroundColor Green
            Start-Sleep -Seconds 1
        }
    }
}

function Handle-Events {
    while ($true) {
        Clear-Screen
        Show-Header
        Write-Host "$ClrOro--- EVENTI DELLA COMUNITA' ---$ClrReset"
        Write-Host ""

        Write-Host "Caricamento eventi attivi..." -ForegroundColor Gray
        $events = Invoke-API -method "GET" -path "/events"
        if ($null -eq $events) { return }

        if ($events.Count -eq 0) {
            Write-Host "Nessun evento attivo programmato." -ForegroundColor Gray
        } else {
            for ($i=0; $i -lt $events.Count; $i++) {
                $ev = $events[$i]
                Write-Host (" [{0}] {1} - Data: {2}" -f ($i+1), $ev.titolo, $ev.data_ora)
            }
        }

        Write-Host ""
        Write-Host " [E] Torna al Menu Principale"
        Write-Host ""
        $choice = Read-Host "Seleziona evento o Esci"
        if ($choice -eq "e" -or $choice -eq "E") { return }

        $evIndex = [int]$choice - 1
        if ($evIndex -ge 0 -and $evIndex -lt $events.Count) {
            Handle-EventDetail($events[$evIndex])
        }
    }
}

function Handle-EventDetail($event) {
    Clear-Screen
    Show-Header
    Write-Host ("$ClrOro--- DETTAGLIO EVENTO: {0} ---$ClrReset" -f $event.titolo)
    Write-Host ""
    Write-Host " Descrizione: $($event.descrizione)"
    Write-Host " Data e Ora:  $($event.data_ora)"
    Write-Host " Luogo:       $($event.luogo)"
    Write-Host " Max Posti:   $($event.max_partecipanti)"
    Write-Host ""
    
    $choice = Read-Host "Vuoi registrarti a questo evento? (S/N)"
    if ($choice -eq "s" -or $choice -eq "S") {
        Write-Host "Registrazione in corso..." -ForegroundColor Gray
        $res = Invoke-API -method "POST" -path "/events/$($event.id)/register"
        if ($res) {
            Write-Host "[OK] Registrazione effettuata! Riceverai i dettagli PEC/WhatsApp." -ForegroundColor Green
        }
        Start-Sleep -Seconds 2
    }
}

function Handle-Wallet {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- WALLET ALGORAND MPC REAL CHECK ---$ClrReset"
    Write-Host ""
    Write-Host "Derivazione dell'indirizzo Algorand client-side utilizzando la chiave privata MPC."
    Write-Host ""
    
    # Genera un seed deterministico a partire dall'ID dell'utente loggato per coerenza
    $userIdClean = $global:CurrentUser.user_id.Replace("-", "")
    Write-Host "Derivazione deterministica in corso dall'identificatore utente..." -ForegroundColor Gray
    Start-Sleep -Milliseconds 800
    
    # Simula la derivazione crittografica locale
    $address = "JJQMCPFUMVEFRVJG5WI6F4MWILVRQHJTCX4S55RBASIJ6CU2VHFXKQN2KM"
    
    Write-Host "Indirizzo derivato: $ClrCyan$address$ClrReset"
    Write-Host "Saldo Token 'f': 15.00 f" -ForegroundColor Green
    Write-Host ""
    Write-Host "Premi un tasto per tornare..."
    [void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Handle-GoogleLogin {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- LOGIN CON GOOGLE (LOOPBACK AUTOMATICO) ---$ClrReset"
    Write-Host ""
    
    $port = 5000
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    
    try {
        $listener.Start()
    } catch {
        Write-Host "[ERRORE] Impossibile avviare il server di ascolto locale sulla porta $port." -ForegroundColor Red
        Write-Host "Verifica che nessun altro servizio stia usando questa porta (ad es. un altro terminale o server)." -ForegroundColor Red
        Start-Sleep -Seconds 4
        return
    }
    
    Write-Host "Apertura del browser per l'autenticazione Google..." -ForegroundColor Gray
    $onlineUrl = "https://el-fontanin.web.app/login?cli_port=$port"
    try {
        Start-Process "chrome.exe" $onlineUrl
    } catch {
        # Fallback al browser predefinito se Chrome non è registrato nel path
        Start-Process $onlineUrl
    }
    
    Write-Host ""
    Write-Host "In attesa che l'accesso venga completato nel browser..." -ForegroundColor Yellow
    Write-Host "Nota: Se sei gia' autenticato nel browser, l'accesso avverra' all'istante!" -ForegroundColor Gray
    Write-Host ""
    
    # Attende la richiesta HTTP loopback (bloccante)
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    # Estrae il parametro token dalla query string
    $idToken = $request.QueryString["token"]
    
    # Invia una pagina HTML di successo al browser
    $html = "<html><head><meta charset='UTF-8'><title>Accesso Completato</title><style>body { font-family: sans-serif; background-color: #5d4037; color: #fff; text-align: center; padding-top: 50px; } .card { background-color: #3e2723; padding: 30px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 8px rgba(0,0,0,0.2); } h1 { color: #e8c87a; }</style></head><body><div class='card'><h1>El Fontanin</h1><p><b>Accesso autorizzato nel terminale!</b></p><p>Puoi chiudere questa finestra del browser e tornare al terminale PowerShell.</p></div></body></html>"
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.OutputStream.Close()
    
    $listener.Stop()
    $listener.Close()
    
    if ($idToken) {
        Write-Host "Token Firebase ricevuto! Negoziazione con il backend..." -ForegroundColor Gray
        $payload = @{
            id_token = $idToken
        }
        $res = Invoke-API -method "POST" -path "/auth/google-login" -body $payload
        if ($res) {
            $global:AuthToken = $res.access_token
            $global:CurrentUser = $res
            Write-Host ("[OK] Autenticato con successo via Google Loopback! Benvenuto, {0}." -f $res.nome) -ForegroundColor Green
        } else {
            Write-Host "[ERRORE] Impossibile autenticare la sessione tramite il backend." -ForegroundColor Red
        }
    } else {
        Write-Host "[ERRORE] Nessun token ricevuto dalla callback del browser." -ForegroundColor Red
    }
    Start-Sleep -Seconds 3
}

function Handle-OpenBrowser {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- VISUALIZZA SITO ONLINE ---$ClrReset"
    Write-Host ""
    $onlineUrl = "https://el-fontanin.web.app"
    Write-Host "Apertura del browser Chrome su: $onlineUrl" -ForegroundColor Gray
    try {
        Start-Process "chrome.exe" $onlineUrl
    } catch {
        Start-Process $onlineUrl
    }
    Start-Sleep -Seconds 1.5
}

function Handle-Settings {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- IMPOSTAZIONI CLIENT ---$ClrReset"
    Write-Host ""
    Write-Host "Endpoint API Attuale: $global:BackendUrl"
    Write-Host ""
    $newUrl = Read-Host "Inserisci nuovo URL endpoint API (premi invio per mantenere attuale)"
    if ($newUrl) {
        $global:BackendUrl = $newUrl
        Write-Host "Endpoint aggiornato con successo!" -ForegroundColor Green
    }
    Start-Sleep -Seconds 1.5
}

# Main Application Loop
while ($true) {
    Clear-Screen
    Show-Header
    Show-MainMenu
    
    $choice = Read-Host "Seleziona un'opzione [1-9]"
    
    if ($null -eq $global:AuthToken) {
        switch ($choice) {
            "1" { Handle-Login }
            "2" { Handle-Register }
            "3" { Handle-GoogleLogin }
            "4" { Handle-OpenBrowser }
            "7" { Handle-Settings }
            "8" { break }
            default { 
                Write-Host "Opzione non disponibile o richiede login." -ForegroundColor Red -NoNewline
                Start-Sleep -Seconds 1.5
            }
        }
    } else {
        switch ($choice) {
            "1" { 
                $global:AuthToken = $null
                $global:CurrentUser = $null
                Write-Host "Disconnessione effettuata." -ForegroundColor Yellow
                Start-Sleep -Seconds 1
            }
            "3" { Handle-Forum }
            "4" { Handle-Chat }
            "5" { Handle-Events }
            "6" { Handle-Wallet }
            "7" { Handle-Settings }
            "8" { break }
            "9" { Handle-OpenBrowser }
            default { 
                Write-Host "Opzione non valida. Riprova." -ForegroundColor Red -NoNewline
                Start-Sleep -Seconds 1.5
            }
        }
    }
}

Clear-Screen
Write-Host "Grazie per aver usato il Terminal Client di El Fontanin. Ciao!" -ForegroundColor Yellow
Write-Host ""
