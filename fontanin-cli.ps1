# Fontanin CLI - Edizione Retrò per PowerShell
# Fine di Mondo APS (c) 2026

$Host.UI.RawUI.WindowTitle = "El Fontanin - Retro Terminal Client v1.0.0"

# Codici Colori ANSI per grafica avanzata
$ESC = [char]27
$ClrReset = "$ESC[0m"
$ClrOro   = "$ESC[38;5;220m"
$ClrNoce  = "$ESC[38;5;94m"
$ClrCyan  = "$ESC[38;5;51m"
$ClrGreen = "$ESC[38;5;46m"
$ClrRed   = "$ESC[38;5;196m"
$ClrGray  = "$ESC[38;5;244m"
$ClrWhite = "$ESC[38;5;15m"

$BackendUrl = "https://finedimondo-backend-vqytacm7la-ew.a.run.app/community"

function Clear-Screen {
    Clear-Host
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
    Write-Host "$ClrGray[La community storica del fontanin - Anno 1682]$ClrReset"
    Write-Host ""
}

function Show-Menu {
    Write-Host "$ClrWhite┌────────────────────────────────────────────────────────┐"
    Write-Host "│  $ClrOro[1]$ClrWhite Visualizza Info e Storia del Progetto             │"
    Write-Host "│  $ClrOro[2]$ClrWhite Mappa Interattiva (Versione ASCII)                │"
    Write-Host "│  $ClrOro[3]$ClrWhite Verifica Stato API Backend (Cloud Run)            │"
    Write-Host "│  $ClrOro[4]$ClrWhite Genera e Deriva Wallet Algorand MPC (Simulatore)  │"
    Write-Host "│  $ClrOro[5]$ClrWhite Esci                                              │"
    Write-Host "└────────────────────────────────────────────────────────┘$ClrReset"
    Write-Host ""
}

function Show-Info {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- STORIA E GOVERNANCE ---$ClrReset"
    Write-Host ""
    Write-Host "Il Fontanin è una sorgiva storica risalente al 1682, situata a Villafranca di Verona."
    Write-Host "Originariamente creata come bene comune per l'approvvigionamento idrico e l'agricoltura,"
    Write-Host "oggi rappresenta un simbolo di aggregazione sociale e rigenerazione ecologica."
    Write-Host ""
    Write-Host "L'associazione $ClrOro'Fine di Mondo APS'$ClrReset tutela l'area e promuove:"
    Write-Host " - $ClrCyan[Arte e Cultura]$ClrReset: Installazioni artistiche e valorizzazione dei fontanili."
    Write-Host " - $ClrCyan[Socialità e Inclusione]$ClrReset: Incontri comunitari e il bar dei soci."
    Write-Host " - $ClrCyan[Sostenibilità]$ClrReset: Monitoraggio della qualità dell'acqua e del territorio."
    Write-Host ""
    Write-Host "Premi un tasto per tornare al menu..."
    [void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-AsciiMap {
    Clear-Screen
    Show-Header
    Write-Host "$ClrCyan--- MAPPA DEL TERRITORIO (RILIEVO ASCII) ---$ClrReset"
    Write-Host ""
    Write-Host "$ClrGray   [Nord] $ClrReset"
    Write-Host "   +---------------------------------------+"
    Write-Host "   | (Oasi della Bora)                     |"
    Write-Host "   |    [WWF]                              |"
    Write-Host "   |                                       |"
    Write-Host "   |              (Fossa Moretta)          |"
    Write-Host "   |                 [O]                   |"
    Write-Host "   |                                       |"
    Write-Host "   |     (IL FONTANIN)                     |"
    Write-Host "   |         [X]                           |"
    Write-Host "   |                                       |"
    Write-Host "   |                    (Villa Canossa)    |"
    Write-Host "   |                       [#]             |"
    Write-Host "   +---------------------------------------+"
    Write-Host "$ClrGray                                  [Sud] $ClrReset"
    Write-Host ""
    Write-Host "$ClrOroLegenda dei punti d'interesse:$ClrReset"
    Write-Host " $ClrOro[X]$ClrReset Il Fontanin (Sorgiva principale - 1682)"
    Write-Host " $ClrCyan[O]$ClrReset Fossa Moretta (Risorgiva vicina, irrigazione storica)"
    Write-Host " $ClrGreen[WWF]$ClrReset Oasi della Bora (Oasi naturale e risorgiva protetta)"
    Write-Host " $ClrNoce[#]$ClrReset Villa Canossa (Villa storica e boschetto limitrofo)"
    Write-Host ""
    Write-Host "Premi un tasto per tornare al menu..."
    [void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Check-Backend {
    Clear-Screen
    Show-Header
    Write-Host "$ClrCyanConnessione al backend Cloud Run in corso...$ClrReset"
    Write-Host ""
    
    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get -TimeoutSec 10
        $endTime = Get-Date
        $latency = [Math]::Round(($endTime - $startTime).TotalMilliseconds)

        if ($response.status -eq "ok") {
            Write-Host "$ClrGreen[OK]$ClrReset Connesso con successo!"
            Write-Host " - Latenza: $ClrCyan$latency ms$ClrReset"
            Write-Host " - Modulo attivo: $ClrWhite$($response.module)$ClrReset"
            Write-Host " - URL API: $ClrGray$BackendUrl/health$ClrReset"
        } else {
            Write-Host "$ClrRed[ERRORE]$ClrReset Risposta imprevista dal server."
        }
    } catch {
        Write-Host "$ClrRed[ERRORE]$ClrReset Impossibile connettersi al server Cloud Run."
        Write-Host "Dettaglio errore: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Write-Host "Premi un tasto per tornare al menu..."
    [void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Simulate-MpcWallet {
    Clear-Screen
    Show-Header
    Write-Host "$ClrOro--- SIMULATORE WALLET ALGORAND MPC (ADR-001) ---$ClrReset"
    Write-Host ""
    Write-Host "Questo modulo simula il flusso di derivazione crittografica client-side"
    Write-Host "utilizzando una chiave privata MPC estratta da Web3Auth."
    Write-Host ""
    
    $simulatedSeedHex = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596"
    
    Write-Host "$ClrGray[1/4] Estrazione chiave privata MPC (Web3Auth)...$ClrReset"
    Start-Sleep -Milliseconds 600
    Write-Host " -> Chiave grezza recuperata (Hex): $ClrCyan$simulatedSeedHex$ClrReset"
    Write-Host ""

    Write-Host "$ClrGray[2/4] Conversione della chiave in Uint8Array...$ClrReset"
    Start-Sleep -Milliseconds 500
    
    # Simula la derivazione crittografica (utilizziamo la stessa logica di tweetnacl)
    Write-Host "$ClrGray[3/4] Generazione keypair Ed25519 (tweetnacl)...$ClrReset"
    Start-Sleep -Milliseconds 700
    
    # Generazione indirizzo Algorand deterministico di test basato sulla chiave
    # Calcolo fittizio coerente per la visualizzazione CLI
    $simulatedAddress = "JJQMCPFUMVEFRVJG5WI6F4MWILVRQHJTCX4S55RBASIJ6CU2VHFXKQN2KM"
    
    Write-Host "$ClrGray[4/4] Codifica dell'indirizzo Algorand (algosdk)...$ClrReset"
    Start-Sleep -Milliseconds 500
    Write-Host ""
    Write-Host "$ClrGreen[COMPLETATO] Wallet derivato con successo!$ClrReset"
    Write-Host "Indirizzo Pubblico Algorand: $ClrOro$simulatedAddress$ClrReset"
    Write-Host ""
    Write-Host "$ClrGray[!] NOTA: Il token 'f' associato al tuo profilo vive su Algorand Mainnet."
    Write-Host "L'associazione non detiene chiavi private (Modello Non-Custodial).$ClrReset"
    Write-Host ""
    Write-Host "Premi un tasto per tornare al menu..."
    [void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Loop principale dell'applicazione CLI
while ($true) {
    Clear-Screen
    Show-Header
    Show-Menu
    
    Write-Host -NoNewline "Seleziona un'opzione [1-5]: "
    $choice = Read-Host
    
    switch ($choice) {
        "1" { Show-Info }
        "2" { Show-AsciiMap }
        "3" { Check-Backend }
        "4" { Simulate-MpcWallet }
        "5" { 
            Clear-Screen
            Write-Host "$ClrOroGrazie per aver visitato il Fontanin! A presto.$ClrReset"
            Write-Host ""
            break 
        }
        default {
            Write-Host "$ClrRedOpzione non valida. Riprova.$ClrReset" -NoNewline
            Start-Sleep -Seconds 1
        }
    }
}
